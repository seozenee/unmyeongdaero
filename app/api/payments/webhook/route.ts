import { env } from "@/lib/env";
import { AppError, jsonError } from "@/lib/errors";
import { isWebhookVerificationError, verifyPortOneWebhook } from "@/lib/payments/portone";
import { confirmPayment } from "@/lib/payments/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/payments/webhook — PortOne V2 웹훅. 서명 검증 → 결제 재조회 → 구매 기록(멱등).
// 2xx 가 아니면 PortOne 이 지수 백오프로 최대 5회 재시도한다.
export async function POST(request: Request) {
  if (!env.portoneWebhookSecret) return jsonError(404, "NOT_FOUND", "Not Found");

  const body = await request.text();
  let webhook;
  try {
    webhook = await verifyPortOneWebhook(body, request.headers);
  } catch (error) {
    if (isWebhookVerificationError(error)) return jsonError(400, "INVALID_SIGNATURE", "웹훅 서명이 올바르지 않습니다.");
    console.error("[webhook] 검증 중 오류", error);
    return jsonError(500, "WEBHOOK_ERROR", "웹훅 처리 실패");
  }

  const type = "type" in webhook ? String(webhook.type) : "";
  const paymentId = "data" in webhook ? (webhook.data as { paymentId?: string } | undefined)?.paymentId : undefined;

  if (type.startsWith("Transaction.") && paymentId) {
    try {
      await confirmPayment(paymentId);
    } catch (error) {
      // 우리 주문이 아닌 결제(다른 채널 등)는 재시도할 필요가 없다
      if (error instanceof AppError && error.status === 404) return new Response(null, { status: 200 });
      console.error(`[webhook] ${type} ${paymentId} 처리 실패`, error);
      return jsonError(500, "WEBHOOK_ERROR", "웹훅 처리 실패");
    }
  }

  return new Response(null, { status: 200 });
}
