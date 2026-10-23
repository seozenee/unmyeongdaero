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
