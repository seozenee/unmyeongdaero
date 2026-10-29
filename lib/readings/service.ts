import "server-only";

import { waitUntil } from "@vercel/functions";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { claudeBaseParams, finalText, getAnthropic } from "@/lib/ai/anthropic";
import { callGemini, geminiText } from "@/lib/ai/gemini";
import type { AppUser } from "@/lib/auth/session";
import { getRepository, type BirthProfile, type Reading, type StoredSazu } from "@/lib/db";
import { modes } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { ensureReadingPdf } from "@/lib/pdf/store";
import { getReport, type ReportProduct } from "@/lib/reports/catalog";
import { buildManseTopics } from "@/lib/manse";
import { SazuApiError } from "@/lib/sazu/errors";
import { buildReportSystemPrompt, buildReportUserPrompt } from "@/lib/story/prompts";
import { isCompleteReport, storyReportSchema, type StoryReport } from "@/lib/story/report";
import { softenDeep } from "@/lib/story/sanitize";
import { buildTemplateReport } from "@/lib/story/report-template";
import { hasLive, startLive, streamLive } from "./live";
import { notifyReading } from "./notify";
import { readingDraftSchema, validateDraftForReport } from "./schema";

/**
 * 실패를 손님에게 어떻게 말할지 정한다.
 *
 * 키가 거부당했거나(401) 설정이 빠졌을 때는 몇 번을 눌러도 같은 자리에서 멈춘다.
 * 그런데도 "다시 시도해 주세요"를 띄우면, 손님은 되지 않을 일을 반복하다 지친다.
 * 고쳐야 할 사람은 우리이고, 손님은 기다리면 되는 상황이라고 정확히 말한다.
 *
 * 운영자도 로그만 보고 가를 수 있어야 한다 — 설정 문제와 일시적 오류는 대응이 다르다.
 */
export function describeFailure(error: unknown): { message: string; retryable: boolean; tag: string } {
  if (error instanceof SazuApiError) return { message: error.userMessage, retryable: true, tag: "sazu" };

  const status = typeof error === "object" && error !== null ? (error as { status?: number }).status : undefined;
  const name = error instanceof Error ? error.name : "";

  // 인증·권한·설정 — 사람이 고치기 전에는 몇 번을 눌러도 같다
  if (status === 401 || status === 403 || name === "ServiceNotConfiguredError") {
    return {
      message: "지금은 풀이를 만들 수 없어요. 저희가 확인하고 있고, 준비되면 카카오톡으로 알려 드릴게요.",
      retryable: false,
      tag: "config",
    };
  }
  // 한도·혼잡 — 기다리면 풀린다
  if (status === 429 || (typeof status === "number" && status >= 500)) {
    return { message: "지금 요청이 몰려 있어요. 잠시 뒤 다시 시도해 주세요.", retryable: true, tag: "busy" };
  }
  return { message: "풀이를 쓰는 중 문제가 생겼어요. 다시 시도해 주세요.", retryable: true, tag: "unknown" };
}

/**
 * 결제 전에 명식이 실제로 계산되는지 확인한다.
 * 잘못된 날짜(2월 30일, 존재하지 않는 윤달)로 결제까지 마친 뒤 실패하는 일을 막는다.
 */
function verifyProfile(profile: BirthProfile, target: "subject" | "partner"): StoredSazu {
  try {
    return buildManseTopics([], profile, null);
  } catch (error) {
    const who = target === "partner" ? "상대방 정보: " : "";
    console.error(`[manse] ${target} 명식 계산 실패`, error);
    throw new AppError(400, "MANSE_FAILED", `${who}생년월일시를 다시 확인해 주세요.`, { target });
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
  const manse = verifyProfile(parsed.data.subject, "subject");
  if (partner) verifyProfile(partner, "partner");

  const reading = await repo.createReading({
    userId: user.id,
    reportSlug: report.slug,
    subject: parsed.data.subject,
    partner,
    answers: parsed.data.answers,
    notifyPhone: parsed.data.notifyPhone,
  });
  await repo.updateReading(reading.id, { sazu: manse });

  // 바로 결제로 보내지 않는다. 계산된 만세력을 먼저 보여 주고, 맞는지 확인한 뒤 결제로 넘어간다.
  return { alreadyPurchased: false as const, readingId: reading.id, redirect: `/readings/${reading.id}/manse` };
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

/**
 * 제미나이로 보고서를 쓴다.
 *
 * Interactions API 는 조각을 흘려보내 주지 않으므로, 다 받은 뒤 한 번에 밀어 넣는다.
 * 화면은 글자가 차오르는 연출을 그대로 쓰되 실제로는 완성본이 한 번에 들어간다 —
 * 중간에 끊긴 JSON 을 파싱하려다 깨지는 것보다 낫다.
 */
async function generateWithGemini(
  report: ReportProduct,
  reading: Reading,
  sazu: StoredSazu,
  onDelta: (delta: string) => void,
): Promise<StoryReport> {
  const result = await callGemini({
    input: `${buildReportSystemPrompt(report)}\n\n---\n\n${buildReportUserPrompt(report, reading, sazu, today())}`,
    schema: z.toJSONSchema(storyReportSchema) as Record<string, unknown>,
  });

  const text = geminiText(result);
  if (!text) throw new Error("[gemini] 빈 응답");
  onDelta(text);
  return softenDeep(storyReportSchema.parse(JSON.parse(text)));
}

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
  // 알림은 곁가지다 — 여기서 기다리지 않고, 실패해도 생성에 영향을 주지 않는다
  void notifyReading(reading, report, "reading-started");
  try {
    let sazu: StoredSazu = reading.sazu ?? {};
    if (report.topics.some((topic) => !sazu[topic]) || !sazu.manse) {
      // 초안 때 저장해 둔 건 manse 한 토픽뿐이다. 나머지는 여기서 마저 계산한다.
      sazu = { ...sazu, ...buildManseTopics(report.topics, reading.subject, reading.partner) };
      await repo.updateReading(reading.id, { sazu });
    }

    let result: StoryReport;
    if (modes.ai() === "gemini") {
      result = await generateWithGemini(report, reading, sazu, live.push);
    } else if (modes.ai() === "anthropic") {
      result = await generateWithClaude(report, reading, sazu, live.push);
    } else {
      result = buildTemplateReport(report, reading, sazu);
      await streamJsonSlowly(result, live.push);
    }

    const generatedAt = new Date().toISOString();
    await repo.updateReading(reading.id, {
      script: result,
      status: "ready",
      error: null,
      generatedAt,
    });
    live.succeed();

    // PDF 를 굽고 카톡으로 알린다. 화면을 이미 닫은 사람도 결과를 받게 하는 것이 목적이므로,
    // 스트림을 닫은 뒤에 한다. 오래 걸려도 사용자를 기다리게 하지 않는다.
    //
    // 굽는 일을 알림 안에 두지 않고 여기서 먼저 한다. 알림은 번호를 남긴 사람에게만 가는데,
    // 번호를 남기지 않았다고 해서 보관본이 없어야 할 이유는 없다. 그 사람도 나중에
    // 내려받기를 누르면 조판이 끝나기를 기다려야 했다.
    const finished = { ...reading, script: result, generatedAt };
    await ensureReadingPdf(finished).catch((error) =>
      console.error(`[reading ${reading.id}] PDF 보관 실패`, error),
    );
    await notifyReading(finished, report, "reading-ready").catch((error) =>
      console.error(`[reading ${reading.id}] 완료 알림 실패`, error),
    );
  } catch (error) {
    const { message, retryable, tag } = describeFailure(error);
    // 태그를 앞에 둔다 — 운영 로그에서 설정 문제만 따로 추려낼 수 있어야 한다
    console.error(`[reading ${reading.id}] 생성 실패 (${tag})`, error);
    await repo
      .updateReading(reading.id, { status: "failed", error: message, errorRetryable: retryable })
      .catch(() => undefined);
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
