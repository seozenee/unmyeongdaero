import { getCurrentUser } from "@/lib/auth/session";
import { jsonError, toErrorResponse } from "@/lib/errors";
import { isCompleteReport } from "@/lib/story/report";
import { renderReportPdf, reportPdfFilename } from "@/lib/pdf/render";
import { ensureReadingPdf, readStoredPdf } from "@/lib/pdf/store";
import { getOwnedPurchasedReading } from "@/lib/readings/service";

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
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "LOGIN_REQUIRED", "로그인이 필요해요.");

  try {
    const { reading, report } = await getOwnedPurchasedReading(user, params.id);
    if (!isCompleteReport(reading.script)) {
      return jsonError(409, "REPORT_NOT_READY", "풀이가 아직 준비되지 않았어요.");
    }

    const filename = reportPdfFilename(report, reading.subject);

    const stored = await ensureReadingPdf(reading).catch((error) => {
      // 보관에 실패해도 내려받기는 되어야 한다
      console.error(`[pdf] 보관 실패 (reading ${reading.id})`, error);
      return null;
    });
    const kept = stored ? await readStoredPdf(stored.path) : null;

    const pdf =
      kept ??
      (await renderReportPdf({
        product: report,
        report: reading.script,
        subject: reading.subject,
        sazu: reading.sazu ?? {},
        issuedAt: reading.generatedAt ? new Date(reading.generatedAt) : undefined,
      }));

    return new Response(new Uint8Array(pdf), {
      headers: {
        "content-type": "application/pdf",
        // 한글 파일명은 RFC 5987 로 적어야 브라우저가 깨뜨리지 않는다
        "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "content-length": String(pdf.length),
        // 본인만 받는 개인 문서다. 중간 캐시에 남지 않게 한다.
        "cache-control": "private, no-store",
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
