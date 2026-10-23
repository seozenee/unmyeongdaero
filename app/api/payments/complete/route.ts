import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { jsonError, toErrorResponse } from "@/lib/errors";
import { confirmPayment, markClientFailure } from "@/lib/payments/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/payments/complete — 결제창에서 돌아온 뒤 서버가 토스에 승인을 내고 확정한다.
// body: { paymentId, paymentKey?, clientError?: { code, message } }
//
// 승인은 서버에서만 낸다. 브라우저가 "결제됐다"고 말하는 것은 믿지 않고,
// 토스에 직접 승인을 요청해 그 응답으로만 구매를 열어 준다.
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "LOGIN_REQUIRED", "로그인이 필요해요.");

  const body = (await request.json().catch(() => null)) as {
    paymentId?: string;
    paymentKey?: string;
    clientError?: { code?: string; message?: string };
  } | null;
  if (!body?.paymentId) return jsonError(400, "VALIDATION_ERROR", "결제 정보가 없어요.");

  try {
    if (body.clientError) {
      await markClientFailure(user, body.paymentId, body.clientError.message ?? "결제가 완료되지 않았어요.");
    }
    return NextResponse.json(
      await confirmPayment(body.paymentId, { userId: user.id, tossPaymentKey: body.paymentKey }),
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
