import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getRepository } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /v/:token — 카톡으로 보낸 「보고서 열기」 버튼이 열리는 자리.
 *
 * 알림톡 버튼의 링크는 템플릿에 박혀 있어 상품마다 바꿀 수 없다. 그래서 코드 하나만
 * 변수로 두고, 어느 보고서로 갈지는 서버가 정한다. /r/:token (PDF)과 같은 코드를 쓴다.
 *
 * 토큰은 "어느 풀이인가"만 가리킨다. "열 자격이 있는가"는 세션으로 판단하므로,
 * 링크가 남에게 전달돼도 남의 풀이는 열리지 않는다.
 */
export async function GET(_request: Request, { params }: { params: { token: string } }) {
  const reading = await getRepository().getReadingByPdfToken(params.token);
  if (!reading) redirect("/library");

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/v/${params.token}`)}`);
  if (user.id !== reading.userId) redirect("/library");

  redirect(`/reports/${reading.reportSlug}/read`);
}
