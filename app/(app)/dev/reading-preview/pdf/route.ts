import { jsonError, toErrorResponse } from "@/lib/errors";
import { pdfDownloadResponse } from "@/lib/pdf/download";
import { renderReportPdf, reportPdfFilename } from "@/lib/pdf/render";
import { getReadingPreview } from "@/lib/story/reading-preview";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") return new Response(null, { status: 404 });
  const { searchParams } = new URL(request.url);
  try {
    const preview = getReadingPreview(searchParams.get("slug") ?? undefined, searchParams.get("reference") ?? undefined);
    if (!preview) return jsonError(404, "REPORT_NOT_FOUND", "미리보기 풀이를 찾을 수 없어요.");
    const { report, subject, script, sazu, now } = preview;
    const pdf = await renderReportPdf({ product: report, subject, report: script, sazu, issuedAt: now });
    return pdfDownloadResponse(pdf, reportPdfFilename(report, subject));
  } catch (error) {
    return toErrorResponse(error);
  }
}
