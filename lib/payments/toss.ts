import "server-only";

import { env, ServiceNotConfiguredError } from "@/lib/env";

/**
 * 토스페이먼츠 결제 API.
 *
 * 포트원 같은 중개사를 거치지 않고 토스와 직접 말한다. SDK 는 브라우저 쪽에만 있고
 * 서버는 REST 로 부른다 — 인증이 시크릿 키 하나라 따로 감쌀 것이 없다.
 *
 * 토스는 결제창이 닫혔다고 결제가 끝난 게 아니다. 돌아온 paymentKey 로 '승인'을 한 번 더
 * 불러야 실제로 돈이 빠진다. 이 두 단계 때문에 다른 PG 와 흐름이 다르다.
 */
const BASE = "https://api.tosspayments.com/v1";

export type ProviderPaymentState =
  | { status: "paid"; amount: number; transactionId: string; paidAt: string | null }
  | { status: "failed" | "cancelled"; reason: string }
  | { status: "pending" };

function authHeader() {
  if (!env.tossSecretKey) throw new ServiceNotConfiguredError("토스페이먼츠", ["TOSS_SECRET_KEY"]);
  // 시크릿 키 뒤에 콜론을 붙여 base64 — 비밀번호가 없는 Basic 인증이다
  return `Basic ${Buffer.from(`${env.tossSecretKey}:`).toString("base64")}`;
}

interface TossPayment {
  paymentKey: string;
  orderId: string;
  status: string;
  totalAmount: number;
  approvedAt: string | null;
  failure?: { code?: string; message?: string } | null;
  cancels?: Array<{ cancelReason?: string }> | null;
}

interface TossError {
  code: string;
  message: string;
}

async function call(path: string, init?: RequestInit): Promise<TossPayment> {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { authorization: authHeader(), "content-type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  const body = (await response.json().catch(() => null)) as TossPayment | TossError | null;

  if (!response.ok) {
    const error = body as TossError | null;
    throw new TossApiError(error?.code ?? "UNKNOWN", error?.message ?? "결제 처리 중 문제가 생겼어요.", response.status);
  }
  return body as TossPayment;
}

export class TossApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly httpStatus: number,
  ) {
    super(`[toss] ${code}: ${message}`);
    this.name = "TossApiError";
  }

  /** 이미 처리된 주문인지 — 승인을 두 번 불러도 괜찮아야 한다 */
  get alreadyProcessed() {
    return this.code === "ALREADY_PROCESSED_PAYMENT";
  }

  /** 아직 토스에 기록이 없는 주문인지 */
  get notFound() {
    return this.code === "NOT_FOUND_PAYMENT" || this.code === "NOT_FOUND_PAYMENT_SESSION";
  }
}

function toState(payment: TossPayment): ProviderPaymentState {
  switch (payment.status) {
    case "DONE":
      return {
        status: "paid",
        amount: payment.totalAmount,
        transactionId: payment.paymentKey,
        paidAt: payment.approvedAt ?? null,
      };
    case "CANCELED":
    case "PARTIAL_CANCELED":
      return { status: "cancelled", reason: payment.cancels?.[0]?.cancelReason ?? "결제가 취소되었어요." };
    case "ABORTED":
    case "EXPIRED":
      return { status: "failed", reason: payment.failure?.message ?? "결제가 승인되지 않았어요." };
    default:
      // READY, IN_PROGRESS, WAITING_FOR_DEPOSIT
      return { status: "pending" };
  }
}

/**
 * 결제 승인. 결제창에서 돌아온 paymentKey 로 실제 승인을 낸다.
 *
 * 금액을 함께 보내는 것이 중요하다. 토스가 자기 쪽 금액과 대조해 다르면 승인을 거절하므로,
 * 브라우저가 금액을 바꿔 보내도 통과하지 않는다.
 */
export async function confirmTossPayment(input: { paymentKey: string; orderId: string; amount: number }) {
  try {
    const payment = await call("/payments/confirm", {
      method: "POST",
      // 같은 주문을 두 번 승인하지 않게 한다(새로고침, 웹훅과 겹침)
      headers: { "Idempotency-Key": `confirm-${input.orderId}` },
      body: JSON.stringify(input),
    });
    return toState(payment);
  } catch (error) {
    if (error instanceof TossApiError && error.alreadyProcessed) {
      // 이미 승인된 주문이면 조회해서 상태를 그대로 돌려준다
      return getTossPaymentState(input.orderId);
    }
    throw error;
  }
}

/** 우리 주문번호로 토스에 현재 상태를 물어본다 */
export async function getTossPaymentState(orderId: string): Promise<ProviderPaymentState> {
  try {
    return toState(await call(`/payments/orders/${encodeURIComponent(orderId)}`));
  } catch (error) {
    // 결제창을 열기 전에 닫혔으면 토스에 기록이 없다
    if (error instanceof TossApiError && (error.notFound || error.httpStatus === 404)) return { status: "pending" };
    throw error;
  }
}

export async function cancelTossPayment(paymentKey: string, reason: string) {
  await call(`/payments/${encodeURIComponent(paymentKey)}/cancel`, {
    method: "POST",
    headers: { "Idempotency-Key": `cancel-${paymentKey}` },
    body: JSON.stringify({ cancelReason: reason.slice(0, 200) }),
  });
}
