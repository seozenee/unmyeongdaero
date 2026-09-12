import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { isProduction } from "@/lib/env";
import { jsonError, toErrorResponse } from "@/lib/errors";
import { settleMockPayment } from "@/lib/payments/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/payments/mock — 개발 대체 모드 전용 모의 결제 승인/취소. body: { paymentId, outcome: "paid" | "cancelled" }
export async function POST(request: Request) {
  if (isProduction) return jsonError(404, "NOT_FOUND", "Not Found");

  const user = await getCurrentUser();
  if (!user) return jsonError(401, "LOGIN_REQUIRED", "로그인이 필요해요.");

  const body = (await request.json().catch(() => null)) as { paymentId?: string; outcome?: string } | null;
  if (!body?.paymentId || (body.outcome !== "paid" && body.outcome !== "cancelled")) {
    return jsonError(400, "VALIDATION_ERROR", "요청 형식이 올바르지 않아요.");
  }

  try {
    return NextResponse.json(await settleMockPayment(user, body.paymentId, body.outcome));
  } catch (error) {
    return toErrorResponse(error);
  }
}
