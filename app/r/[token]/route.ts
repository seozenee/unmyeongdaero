import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getRepository } from "@/lib/db";
import { needsReadingRepair } from "@/lib/readings/calculation";
import { AppError } from "@/lib/errors";
import { getOwnedPurchasedReading } from "@/lib/readings/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /r/:token — 카톡으로 보낸 PDF 버튼이 열리는 자리.
 *
 * 주소 자체는 만료되지 않지만, 아는 것만으로는 열리지 않는다. 구매한 본인이 로그인해 있어야
 * 같은 사이트의 PDF 내려받기로 넘겨 준다. 토큰은 "어느 풀이인가"만 가리키고, "열 자격이 있는가"는
 * 세션으로 판단한다. 남에게 링크가 전달되어도 남의 풀이가 열리지 않는다.
 */
export async function GET(_request: Request, { params: paramsPromise }: { params: Promise<{ token: string }> }) {
  const params = await paramsPromise;
  const reading = await getRepository().getReadingByPdfToken(params.token);
  if (!reading) redirect("/library");

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/r/${params.token}`)}`);
  if (user.id !== reading.userId) redirect("/library");
  try {
    await getOwnedPurchasedReading(user, reading.id);
  } catch (error) {
    if (error instanceof AppError && [402, 404].includes(error.status)) redirect("/library");
    throw error;
  }
  if (needsReadingRepair(reading)) redirect(`/reports/${reading.reportSlug}/read`);

  redirect(`/api/readings/${encodeURIComponent(reading.id)}/pdf`);
}
