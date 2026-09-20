import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getRepository } from "@/lib/db";
import { signedPdfUrl } from "@/lib/pdf/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /r/:token — 카톡으로 보낸 PDF 버튼이 열리는 자리.
 *
 * 주소 자체는 만료되지 않지만, 아는 것만으로는 열리지 않는다. 구매한 본인이 로그인해 있어야
 * 스토리지의 서명 주소로 넘겨 준다. 토큰은 "어느 풀이인가"만 가리키고, "열 자격이 있는가"는
 * 세션으로 판단한다. 남에게 링크가 전달되어도 남의 풀이가 열리지 않는다.
 */
export async function GET(_request: Request, { params }: { params: { token: string } }) {
  const reading = await getRepository().getReadingByPdfToken(params.token);
  if (!reading) redirect("/library");

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/r/${params.token}`)}`);
  if (user.id !== reading.userId) redirect("/library");

  const url = await signedPdfUrl(reading);
  // 파일이 없거나 서명에 실패하면 보고서 화면으로 보낸다 — 거기서 다시 내려받을 수 있다
  redirect(url ?? `/reports/${reading.reportSlug}/read`);
}
