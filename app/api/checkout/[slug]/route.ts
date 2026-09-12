import { NextResponse } from "next/server";
import { getCurrentUser, loginUrl } from "@/lib/auth/session";
import { jsonError, toErrorResponse } from "@/lib/errors";
import { startCheckout } from "@/lib/payments/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/checkout/:slug — 결제 요청 준비(서버가 금액·결제 ID 확정). 이미 소장한 리포트면 결제창 없이 결과로.
export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const body = (await request.json().catch(() => ({}))) as { readingId?: string };
  const user = await getCurrentUser();
  if (!user) {
    const next = `/checkout/${params.slug}${body.readingId ? `?reading=${body.readingId}` : ""}`;
    return jsonError(401, "LOGIN_REQUIRED", "로그인이 필요해요.", { loginUrl: loginUrl(next) });
  }

  try {
    return NextResponse.json(await startCheckout(user, params.slug, body.readingId ?? null));
  } catch (error) {
    return toErrorResponse(error);
  }
}
