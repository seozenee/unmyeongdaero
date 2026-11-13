import { getCurrentUser } from "@/lib/auth/session";
import { jsonError, toErrorResponse } from "@/lib/errors";
import { isCompleteReport } from "@/lib/story/report";
import { after } from "next/server";
import { pdfDownloadResponse } from "@/lib/pdf/download";
import { renderReportPdf, reportPdfFilename } from "@/lib/pdf/render";
import { ensureReadingPdf, isCurrentReadingPdf, readStoredPdf } from "@/lib/pdf/store";
import { getOwnedPurchasedReading } from "@/lib/readings/service";
import { needsReadingRepair } from "@/lib/readings/calculation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// 글꼴을 심고 본문을 조판하는 데 몇 초가 걸린다. 기본 제한(10초)으로는 긴 보고서가 잘린다.
// (보관본이 있으면 조판을 건너뛰지만, 처음 굽는 요청은 여전히 이 시간이 필요하다)
export const maxDuration = 60;

/**
 * GET /api/readings/:id/pdf — 구매한 본인만 내려받는다.
 *
 * 한동안 요청마다 그 자리에서 구웠다. 같은 파일을 받을 때마다 서체를 통째로 심고 전부
 * 다시 조판하는 셈이라, 두 번째부터는 치르지 않아도 될 값이었다.
 *
 * 이제는 스토리지에 둔 것을 먼저 본다. 없으면 한 번 구워 올려 두고, 그 뒤로는 받아만
 * 간다. 스토리지가 없는 환경(로컬 개발)과 보관본을 읽지 못한 경우에는 예전처럼 그
 * 자리에서 굽는다 — 내려받기가 실패하는 것보다 느린 편이 낫다.
 */
export async function GET(_request: Request, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "LOGIN_REQUIRED", "로그인이 필요해요.");

  try {
    const { reading, report } = await getOwnedPurchasedReading(user, params.id);
    if (needsReadingRepair(reading)) return jsonError(409, "READING_REPAIR_REQUIRED", "계산과 풀이 구성을 보완하고 있어요. 풀이 화면을 먼저 열어 주세요. 추가 결제는 없습니다.");
    if (!isCompleteReport(reading.script)) {
      return jsonError(409, "REPORT_NOT_READY", "풀이가 아직 준비되지 않았어요.");
    }

    const filename = reportPdfFilename(report, reading.subject);

    const kept = isCurrentReadingPdf(reading.pdfPath) ? await readStoredPdf(reading.pdfPath).catch(() => null) : null;
    if (kept) return pdfDownloadResponse(kept, filename);

    const pdf = await renderReportPdf({
      product: report,
      report: reading.script,
      subject: reading.subject,
      sazu: reading.sazu ?? {},
      issuedAt: reading.generatedAt ? new Date(reading.generatedAt) : undefined,
    });

    after(async () => {
      await ensureReadingPdf(reading, pdf).catch((error) => console.error(`[pdf] 보관 실패 (reading ${reading.id})`, error));
    });
    return pdfDownloadResponse(pdf, filename);
  } catch (error) {
    return toErrorResponse(error);
  }
}
