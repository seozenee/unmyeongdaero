import "server-only";

import { randomBytes } from "node:crypto";
import { getRepository, type Reading } from "@/lib/db";
import { env, modes } from "@/lib/env";
import { getReport } from "@/lib/reports/catalog";
import { isCompleteReport } from "@/lib/story/report";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { renderReportPdf, reportPdfFilename } from "./render";

const BUCKET = "reports";

/**
 * 구운 PDF 를 스토리지에 올리고, 카톡 버튼이 열 짧은 주소를 만든다.
 *
 * 왜 우리 도메인을 한 번 거치는가. 카카오는 알림톡 버튼의 링크 도메인을 심사한다.
 * 스토리지의 서명 주소(…supabase.co)는 등록한 도메인과 다르고 며칠이면 만료되므로
 * 템플릿에 고정할 수 없다. 그래서 만료되지 않는 /r/{token} 을 템플릿에 넣고,
 * 열릴 때마다 서버가 새 서명 주소로 넘긴다.
 */
export async function ensureReadingPdf(reading: Reading): Promise<{ token: string; path: string } | null> {
  if (!isCompleteReport(reading.script)) return null;
  if (reading.pdfToken && reading.pdfPath) return { token: reading.pdfToken, path: reading.pdfPath };

  const report = getReport(reading.reportSlug);
  if (!report || report.kind !== "report") return null;

  // 손에 든 reading 은 몇 초 전의 사본일 수 있다. 완성 직후에 굽고, 곧이어 알림이 또
  // 부르는 길이 있어서다. 저장된 행을 한 번 더 보고 이미 구워져 있으면 그대로 쓴다 —
  // 그러지 않으면 같은 풀이를 두 번 굽고, 카톡에 넣은 코드가 두 번째 것으로 바뀐다.
  const current = await getRepository().getReading(reading.id);
  if (current?.pdfToken && current.pdfPath) return { token: current.pdfToken, path: current.pdfPath };

  // 로컬 개발(스토리지 없음)에서는 굽지 않는다. 알림도 어차피 모의 발송이다.
  if (modes.data() !== "supabase") {
    console.info(`[pdf] 스토리지가 없어 보관을 건너뜁니다 (reading ${reading.id})`);
    return null;
  }

  const pdf = await renderReportPdf({
    product: report,
    report: reading.script,
    subject: reading.subject,
    sazu: reading.sazu ?? {},
    issuedAt: reading.generatedAt ? new Date(reading.generatedAt) : undefined,
  });

  const path = `${reading.userId}/${reading.id}.pdf`;
  const { error } = await getSupabaseAdmin()
    .storage.from(BUCKET)
    .upload(path, pdf, { contentType: "application/pdf", upsert: true });
  if (error) throw new Error(`[pdf] 업로드 실패: ${error.message}`);

  const token = randomBytes(24).toString("base64url");
  await getRepository().updateReading(reading.id, {
    pdfPath: path,
    pdfToken: token,
    pdfCreatedAt: new Date().toISOString(),
  });
  return { token, path };
}

/**
 * 스토리지에 둔 PDF 를 그대로 가져온다.
 *
 * 내려받기 요청마다 다시 굽지 않기 위한 것이다. 조판은 몇 초가 걸리고 서체를 통째로
 * 심어야 해서, 같은 파일을 받을 때마다 치르기에는 비싸다.
 */
export async function readStoredPdf(path: string): Promise<Buffer | null> {
  const { data, error } = await getSupabaseAdmin().storage.from(BUCKET).download(path);
  if (error || !data) {
    console.error(`[pdf] 보관본 읽기 실패 (${path})`, error);
    return null;
  }
  return Buffer.from(await data.arrayBuffer());
}

/** 짧은 주소가 가리킬 실제 내려받기 주소. 잠깐만 살아 있다 */
export async function signedPdfUrl(reading: Reading, seconds = 60 * 10): Promise<string | null> {
  if (!reading.pdfPath) return null;
  const report = getReport(reading.reportSlug);
  const filename = report ? reportPdfFilename(report, reading.subject) : "운명대로.pdf";

  const { data, error } = await getSupabaseAdmin()
    .storage.from(BUCKET)
    .createSignedUrl(reading.pdfPath, seconds, { download: filename });
  if (error) {
    console.error(`[pdf] 서명 주소 생성 실패 (reading ${reading.id})`, error);
    return null;
  }
  return data?.signedUrl ?? null;
}

/** 카톡 「PDF 받기」 버튼이 여는 주소. 만료되지 않는다 */
export const pdfShareUrl = (token: string) => `${env.siteUrl}/r/${token}`;

/** 카톡 「보고서 열기」 버튼이 여는 주소. 같은 코드를 쓴다 */
export const readingShareUrl = (token: string) => `${env.siteUrl}/v/${token}`;

/**
 * 공유 코드만 먼저 발급한다.
 *
 * PDF 는 풀이가 다 쓰인 뒤에야 구울 수 있지만, 시작 알림의 「진행 상황 보기」 버튼은
 * 그보다 먼저 필요하다. 코드는 PDF 와 같은 것을 쓰므로 여기서 미리 만들어 둔다.
 */
export async function ensureShareToken(reading: Reading): Promise<string | null> {
  if (reading.pdfToken) return reading.pdfToken;
  if (modes.data() !== "supabase") return null;

  const token = randomBytes(24).toString("base64url");
  await getRepository().updateReading(reading.id, { pdfToken: token });
  return token;
}
