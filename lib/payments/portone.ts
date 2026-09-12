import "server-only";

import { PortOneClient, PortOneError, Webhook } from "@portone/server-sdk";
import { env, ServiceNotConfiguredError } from "@/lib/env";

export type ProviderPaymentState =
  | { status: "paid"; amount: number; transactionId: string; paidAt: string | null }
  | { status: "failed" | "cancelled"; reason: string }
  | { status: "pending" };

let client: ReturnType<typeof PortOneClient> | undefined;

function portone() {
  if (!env.portoneApiSecret) throw new ServiceNotConfiguredError("PortOne", ["PORTONE_API_SECRET"]);
  client ??= PortOneClient({ secret: env.portoneApiSecret, storeId: env.portoneStoreId });
  return client;
}

/** PortOne 서버에서 결제 상태를 직접 조회한다(클라이언트가 보낸 결과는 신뢰하지 않음) */
export async function getPortOnePaymentState(paymentId: string): Promise<ProviderPaymentState> {
  let payment;
  try {
    payment = await portone().payment.getPayment({ paymentId });
  } catch (error) {
    // 결제창을 열기 전에 닫혀 PortOne 에 기록이 없는 경우
    if (error instanceof PortOneError && (error as { data?: { type?: string } }).data?.type === "PAYMENT_NOT_FOUND") {
      return { status: "pending" };
    }
    throw error;
  }

  switch (payment.status) {
    case "PAID":
      return {
        status: "paid",
        amount: payment.amount.total,
        transactionId: payment.transactionId,
        paidAt: payment.paidAt ?? null,
      };
    case "FAILED":
      return {
        status: "failed",
        reason: payment.failure.pgMessage ?? payment.failure.reason ?? "결제가 승인되지 않았어요.",
      };
    case "CANCELLED":
    case "PARTIAL_CANCELLED":
      return { status: "cancelled", reason: "결제가 취소되었어요." };
    default:
      return { status: "pending" };
  }
}

export async function cancelPortOnePayment(paymentId: string, reason: string) {
  await portone().payment.cancelPayment({ paymentId, reason });
}

/** 웹훅 서명 검증. 원문 body 문자열이 필요하다 */
export async function verifyPortOneWebhook(body: string, headers: Headers) {
  if (!env.portoneWebhookSecret) throw new ServiceNotConfiguredError("PortOne", ["PORTONE_WEBHOOK_SECRET"]);
  return Webhook.verify(env.portoneWebhookSecret, body, Object.fromEntries(headers.entries()));
}

export const isWebhookVerificationError = (error: unknown) => error instanceof Webhook.WebhookVerificationError;
