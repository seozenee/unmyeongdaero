import "server-only";

import { waitUntil } from "@vercel/functions";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { claudeBaseParams, finalText, getAnthropic } from "@/lib/ai/anthropic";
import type { AppUser } from "@/lib/auth/session";
import { getRepository, type BirthProfile, type Reading, type StoredSazu } from "@/lib/db";
import { modes } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { getReport, type ReportProduct } from "@/lib/reports/catalog";
import { SazuApiError } from "@/lib/sazu/errors";
import { fetchSazuForProfiles, fetchSazuForReport } from "@/lib/sazu/readings";
import { buildReportSystemPrompt, buildReportUserPrompt } from "@/lib/story/prompts";
import { isCompleteReport, storyReportSchema, type StoryReport } from "@/lib/story/report";
import { softenDeep } from "@/lib/story/sanitize";
import { buildTemplateReport } from "@/lib/story/report-template";
import { hasLive, startLive, streamLive } from "./live";
import { readingDraftSchema, validateDraftForReport } from "./schema";

const SANDBOX_MESSAGE =
  "지금은 체험용 분석 키가 연결되어 있어 샘플 명식으로만 풀이할 수 있어요. 입력 칸 위의 샘플 명식을 골라 주세요.";

/** 결제 전에 manse 로 명식이 계산되는지 확인한다(잘못된 날짜·샌드박스 불일치로 결제 후 실패하는 일을 막음) */
async function verifyProfile(profile: BirthProfile, target: "subject" | "partner"): Promise<StoredSazu> {
  try {
    return await fetchSazuForProfiles([], profile, null);
  } catch (error) {
    if (!(error instanceof SazuApiError)) throw error;
    const who = target === "partner" ? "상대방 정보: " : "";
    if (error.code === "SAMPLE_PROFILE_REQUIRED") {
      throw new AppError(400, error.code, `${who}${SANDBOX_MESSAGE}`, { target });
    }
    if (error.clientStatus === 400) {
      throw new AppError(400, error.code, `${who}${error.userMessage}`, { target, fieldErrors: error.fieldErrors });
    }
    throw error;
  }
}

export async function createDraftReading(user: AppUser, input: unknown) {
  const parsed = readingDraftSchema.safeParse(input);
  if (!parsed.success) throw new AppError(400, "VALIDATION_ERROR", "입력하신 내용을 다시 확인해 주세요.");

  const report = getReport(parsed.data.slug);
  if (!report) throw new AppError(404, "REPORT_NOT_FOUND", "찾을 수 없는 상품이에요.");

  const invalid = validateDraftForReport(report, parsed.data);
  if (invalid) throw new AppError(400, "VALIDATION_ERROR", invalid);

  const repo = getRepository();
  if (report.kind === "report") {
    const purchase = await repo.getPurchase(user.id, report.slug);
    if (purchase) return { alreadyPurchased: true as const, redirect: `/reports/${report.slug}/read` };
  }

  const partner = report.partner === "none" ? null : parsed.data.partner;
  const [manse] = await Promise.all([
    verifyProfile(parsed.data.subject, "subject"),
    partner ? verifyProfile(partner, "partner") : Promise.resolve(null),
  ]);

  const reading = await repo.createReading({
    userId: user.id,
    reportSlug: report.slug,
    subject: parsed.data.subject,
    partner,
    answers: parsed.data.answers,
  });
  await repo.updateReading(reading.id, { sazu: manse });

  return { alreadyPurchased: false as const, readingId: reading.id, redirect: `/checkout/${report.slug}?reading=${reading.id}` };
}

/** 구매자 본인의 리딩인지 확인하고 돌려준다 */
export async function getOwnedPurchasedReading(user: AppUser, readingId: string) {
  const repo = getRepository();
  const reading = await repo.getReading(readingId);
  if (!reading || reading.userId !== user.id) throw new AppError(404, "READING_NOT_FOUND", "풀이를 찾을 수 없어요.");
  const report = getReport(reading.reportSlug);
  if (!report || report.kind !== "report") throw new AppError(404, "REPORT_NOT_FOUND", "찾을 수 없는 상품이에요.");
  const purchase = await repo.getPurchase(user.id, report.slug);
  if (!purchase || purchase.readingId !== reading.id) {
    throw new AppError(402, "PAYMENT_REQUIRED", "열람권 구매 후 확인할 수 있어요.", {
      checkoutUrl: `/checkout/${report.slug}?reading=${reading.id}`,
    });
  }
  return { reading, report };
}

// ─── 생성 ────────────────────────────────────────────────────────────────────

const STALE_GENERATION_MS = 3 * 60 * 1000;
const today = () => new Date().toISOString().slice(0, 10);

async function generateWithClaude(
  report: ReportProduct,
  reading: Reading,
  sazu: StoredSazu,
  onDelta: (delta: string) => void,
): Promise<StoryReport> {
  const stream = getAnthropic().beta.messages.stream({
    ...claudeBaseParams(),
    max_tokens: 64000,
    output_config: { effort: "high", format: zodOutputFormat(storyReportSchema) },
    system: [{ type: "text", text: buildReportSystemPrompt(report), cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: buildReportUserPrompt(report, reading, sazu, today()) }],
  });
  stream.on("text", onDelta);

  const message = await stream.finalMessage();
  if (message.stop_reason === "refusal") throw new Error("[claude] 요청이 거절되었습니다.");
  if (message.stop_reason === "max_tokens") throw new Error("[claude] 출력이 max_tokens 에서 잘렸습니다.");
  // 프롬프트로도 금지하지만 모델이 내부 점수("신강 79점")나 겁주는 표현을 흘릴 수 있어 코드로 한 번 더 막는다
  return softenDeep(storyReportSchema.parse(JSON.parse(finalText(message.content))));
}

/** AI 미설정 개발 모드: 보고서 JSON 을 조금씩 흘려 스트리밍 경험을 그대로 재현한다 */
async function streamJsonSlowly(value: unknown, onDelta: (delta: string) => void) {
  const json = JSON.stringify(value);
  for (let index = 0; index < json.length; index += 24) {
    onDelta(json.slice(index, index + 24));
    await new Promise((resolve) => setTimeout(resolve, 16));
  }
}

async function runGeneration(reading: Reading, report: ReportProduct, live: ReturnType<typeof startLive>) {
  const repo = getRepository();
  try {
    let sazu: StoredSazu = reading.sazu ?? {};
    if (report.topics.some((topic) => !sazu[topic]) || !sazu.manse) {
      sazu = { ...sazu, ...(await fetchSazuForReport(report, reading.subject, reading.partner)) };
      await repo.updateReading(reading.id, { sazu });
    }

    let result: StoryReport;
    if (modes.ai() === "anthropic") {
      result = await generateWithClaude(report, reading, sazu, live.push);
    } else {
      result = buildTemplateReport(report, reading, sazu);
      await streamJsonSlowly(result, live.push);
    }

    await repo.updateReading(reading.id, {
      script: result,
      status: "ready",
      error: null,
      generatedAt: new Date().toISOString(),
    });
    live.succeed();
  } catch (error) {
    console.error(`[reading ${reading.id}] 생성 실패`, error);
    const message =
      error instanceof SazuApiError ? error.userMessage : "풀이를 쓰는 중 문제가 생겼어요. 다시 시도해 주세요.";
    await repo.updateReading(reading.id, { status: "failed", error: message }).catch(() => undefined);
    live.fail(message);
  }
}

export type GenerationStart =
  | { kind: "ready"; report: StoryReport }
  | { kind: "stream"; stream: ReadableStream<Uint8Array> }
  | { kind: "busy" };

export async function startOrAttachGeneration(user: AppUser, readingId: string): Promise<GenerationStart> {
  const { reading, report } = await getOwnedPurchasedReading(user, readingId);
  if (reading.status === "ready" && isCompleteReport(reading.script)) return { kind: "ready", report: reading.script };

  const attached = streamLive(reading.id);
  if (attached) return { kind: "stream", stream: attached };

  const stale =
    reading.status === "generating" && Date.now() - Date.parse(reading.updatedAt) > STALE_GENERATION_MS;
  // 예전 형식으로 저장된 결과(ready 이지만 스키마 불일치)는 새 형식으로 다시 만든다
  const from = stale ? (["generating"] as const) : (["draft", "failed", "ready"] as const);
  const claimed = await getRepository().transitionReading(reading.id, [...from], "generating");
  if (!claimed || hasLive(reading.id)) {
    const again = streamLive(reading.id);
    return again ? { kind: "stream", stream: again } : { kind: "busy" };
  }

  const live = startLive(reading.id);
  // 클라이언트가 탭을 닫아도 생성·저장은 끝까지 진행한다 (Vercel 에서는 waitUntil 로 함수 수명 연장)
  waitUntil(runGeneration(reading, report, live));
  return { kind: "stream", stream: streamLive(reading.id)! };
}
