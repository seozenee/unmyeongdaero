import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { jsonError, toErrorResponse } from "@/lib/errors";
import { confirmPayment, markClientFailure } from "@/lib/payments/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/payments/complete — 결제창 종료 후 서버가 PortOne 에 직접 조회해 확정한다.
// body: { paymentId, clientError?: { code, message } }
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "LOGIN_REQUIRED", "로그인이 필요해요.");

  const body = (await request.json().catch(() => null)) as {
    paymentId?: string;
    clientError?: { code?: string; message?: string };
  } | null;
  if (!body?.paymentId) return jsonError(400, "VALIDATION_ERROR", "결제 정보가 없어요.");

  try {
    if (body.clientError) {
      await markClientFailure(user, body.paymentId, body.clientError.message ?? "결제가 완료되지 않았어요.");
    }
    return NextResponse.json(await confirmPayment(body.paymentId, { userId: user.id }));
  } catch (error) {
    return toErrorResponse(error);
  }
}
