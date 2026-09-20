import { getCurrentUser } from "@/lib/auth/session";
import { jsonError, toErrorResponse } from "@/lib/errors";
import { isCompleteReport } from "@/lib/story/report";
import { renderReportPdf, reportPdfFilename } from "@/lib/pdf/render";
import { getOwnedPurchasedReading } from "@/lib/readings/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// 글꼴을 심고 본문을 조판하는 데 몇 초가 걸린다. 기본 제한(10초)으로는 긴 보고서가 잘린다.
export const maxDuration = 60;

// GET /api/readings/:id/pdf — 구매한 본인만 내려받는다
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "LOGIN_REQUIRED", "로그인이 필요해요.");

  try {
    const { reading, report } = await getOwnedPurchasedReading(user, params.id);
    if (!isCompleteReport(reading.script)) {
      return jsonError(409, "REPORT_NOT_READY", "풀이가 아직 준비되지 않았어요.");
    }

    const pdf = await renderReportPdf({
      product: report,
      report: reading.script,
      subject: reading.subject,
      sazu: reading.sazu ?? {},
      issuedAt: reading.generatedAt ? new Date(reading.generatedAt) : undefined,
    });

    const filename = reportPdfFilename(report, reading.subject);
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
