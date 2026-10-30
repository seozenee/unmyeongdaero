import "server-only";

import { randomUUID } from "node:crypto";
import type { AppUser } from "@/lib/auth/session";
import { getRepository, type Payment } from "@/lib/db";
import { env, isFreeAccess, isProduction, modes } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { CONSULT_TURN_LIMIT, getReport, type ReportProduct } from "@/lib/reports/catalog";
import { cancelTossPayment, confirmTossPayment, getTossPaymentState } from "./toss";

export type CheckoutStart =
  | { kind: "already-purchased"; redirect: string }
  | {
      kind: "toss";
      /** 우리 주문번호이자 토스의 orderId */
      paymentId: string;
      clientKey: string;
      /** 구매자 식별값. 같은 사람이 다시 와도 같은 값이어야 간편결제가 기억된다 */
      customerKey: string;
      orderName: string;
      totalAmount: number;
      customerName: string | null;
      successUrl: string;
      failUrl: string;
    }
  | { kind: "mock"; paymentId: string; orderName: string; totalAmount: number };

const newPaymentId = () => `sd_${Date.now().toString(36)}_${randomUUID().replaceAll("-", "").slice(0, 12)}`;

export function resultPathFor(report: ReportProduct, consultSessionId?: string) {
  return report.kind === "consult" ? `/consult/${consultSessionId ?? ""}` : `/reports/${report.slug}/read`;
}

export async function startCheckout(user: AppUser, slug: string, readingId: string | null): Promise<CheckoutStart> {
  const report = getReport(slug);
  if (!report) throw new AppError(404, "REPORT_NOT_FOUND", "찾을 수 없는 상품이에요.");
  const repo = getRepository();

  // 이미 소장한 리포트도 다시 살 수 있다. 전에는 결제창 없이 결과로 돌려보냈는데,
  // 그러면 "다시 보고 싶다"는 사람에게 길이 없었다(풀이 만들기 쪽에도 같은 주석이 있다).
  //
  // 이 자리에서 막지 않는 대신, 결제 화면이 "이미 가지고 있는 풀이가 있다"고 알려 주고
  // 보관함으로 가는 길을 함께 보여 준다. 모르고 두 번 내는 일은 없어야 한다.

  if (!readingId) {
    throw new AppError(400, "READING_REQUIRED", "먼저 풀이에 필요한 정보를 입력해 주세요.", {
      redirect: report.kind === "consult" ? "/consult" : `/reports/${report.slug}`,
    });
  }
  const reading = await repo.getReading(readingId);
  if (!reading || reading.userId !== user.id || reading.reportSlug !== report.slug) {
    throw new AppError(404, "READING_NOT_FOUND", "입력하신 풀이 정보를 찾을 수 없어요. 다시 입력해 주세요.");
  }

  const paymentId = newPaymentId();
  const provider = modes.payment();
  // 금액은 항상 서버 카탈로그 값으로 고정 — 클라이언트가 보낸 금액은 신뢰하지 않는다
  await repo.createPayment({
    paymentId,
    provider,
    userId: user.id,
    reportSlug: report.slug,
    readingId: reading.id,
    amount: report.price,
  });

  // 결제창과 카드사 전표에 찍히는 이름이다. 무엇을 샀는지 알아볼 수 있어야 한다.
  const orderName = `운명대로 ${report.title}`.slice(0, 100);
  if (provider === "mock") return { kind: "mock", paymentId, orderName, totalAmount: report.price };

  const complete = new URL("/checkout/complete", env.siteUrl);
  complete.searchParams.set("slug", report.slug);

  const fail = new URL("/checkout/complete", env.siteUrl);
  fail.searchParams.set("slug", report.slug);
  fail.searchParams.set("failed", "1");

  return {
    kind: "toss",
    paymentId,
    clientKey: env.tossClientKey!,
    customerKey: user.id,
    orderName,
    totalAmount: report.price,
    customerName: reading.subject.name,
    successUrl: complete.toString(),
    failUrl: fail.toString(),
  };
}

export type ConfirmResult =
  | { status: "paid"; redirect: string }
  | { status: "pending" }
  | { status: "failed" | "cancelled"; reason: string; retryUrl: string };

/** 결제 확정·권한 부여 (결제 완료 콜백과 웹훅 양쪽에서 호출, 여러 번 불려도 결과가 같다) */
async function fulfill(payment: Payment, report: ReportProduct): Promise<string> {
  const repo = getRepository();
  if (report.kind === "consult") {
    const reading = payment.readingId ? await repo.getReading(payment.readingId) : null;
    if (!reading) throw new Error(`[payments] 상담 결제 ${payment.paymentId} 의 입력 정보가 없습니다.`);
    const session = await repo.createConsultSession({
      userId: payment.userId,
      paymentRowId: payment.id,
      subject: reading.subject,
      turnLimit: CONSULT_TURN_LIMIT,
    });
    return resultPathFor(report, session.id);
  }

  await repo.createPurchase({
    userId: payment.userId,
    reportSlug: report.slug,
    paymentRowId: payment.id,
    readingId: payment.readingId,
  });
  return resultPathFor(report);
}

export async function confirmPayment(
  paymentId: string,
  options: { userId?: string; tossPaymentKey?: string } = {},
): Promise<ConfirmResult> {
  const repo = getRepository();
  const payment = await repo.getPayment(paymentId);
  if (!payment || (options.userId && payment.userId !== options.userId)) {
    throw new AppError(404, "PAYMENT_NOT_FOUND", "결제 정보를 찾을 수 없어요.");
  }
  const report = getReport(payment.reportSlug)!;
  const retryUrl = `/checkout/${report.slug}${payment.readingId ? `?reading=${payment.readingId}` : ""}`;

  if (payment.status === "paid") return { status: "paid", redirect: await fulfill(payment, report) };
  if (payment.status === "failed" || payment.status === "cancelled") {
    return { status: payment.status, reason: payment.failureReason ?? "결제가 완료되지 않았어요.", retryUrl };
  }

  if (payment.provider === "mock") {
    if (isProduction && !isFreeAccess) throw new AppError(400, "INVALID_PROVIDER", "사용할 수 없는 결제 방식이에요.");
    return { status: "pending" };
  }

  // 결제창에서 돌아왔으면 승인을 낸다. 토스는 승인을 불러야 실제로 돈이 빠진다.
  // 승인 요청에 금액을 함께 보내므로, 브라우저가 금액을 바꿔 보내도 토스가 거절한다.
  const state = options.tossPaymentKey
    ? await confirmTossPayment({ paymentKey: options.tossPaymentKey, orderId: paymentId, amount: payment.amount })
    : await getTossPaymentState(paymentId);

  if (state.status === "paid") {
    if (state.amount !== payment.amount) {
      // 여기까지 왔다면 토스 쪽 금액이 우리 주문과 다른 것이다. 되돌린다.
      await cancelTossPayment(state.transactionId, "결제 금액 불일치").catch((error) => console.error(error));
      await repo.updatePayment(paymentId, { status: "failed", failureReason: "결제 금액이 주문과 달라 자동 취소되었어요." });
      return { status: "failed", reason: "결제 금액이 주문과 달라 자동 취소되었어요.", retryUrl };
    }
    await repo.updatePayment(paymentId, {
      status: "paid",
      pgTransactionId: state.transactionId,
      paidAt: state.paidAt ?? new Date().toISOString(),
      failureReason: null,
    });
    return { status: "paid", redirect: await fulfill({ ...payment, status: "paid" }, report) };
  }
  if (state.status === "failed" || state.status === "cancelled") {
    await repo.updatePayment(paymentId, { status: state.status, failureReason: state.reason });
    return { status: state.status, reason: state.reason, retryUrl };
  }
  return { status: "pending" };
}

/** 개발 대체 모드 결제 처리 */
export async function settleMockPayment(user: AppUser, paymentId: string, outcome: "paid" | "cancelled") {
  if (isProduction && !isFreeAccess) throw new AppError(404, "NOT_FOUND", "Not Found");
  const repo = getRepository();
  const payment = await repo.getPayment(paymentId);
  if (!payment || payment.userId !== user.id || payment.provider !== "mock") {
    throw new AppError(404, "PAYMENT_NOT_FOUND", "결제 정보를 찾을 수 없어요.");
  }
  if (payment.status === "pending") {
    await repo.updatePayment(
      paymentId,
      outcome === "paid"
        ? { status: "paid", pgTransactionId: `mock_${randomUUID()}`, paidAt: new Date().toISOString() }
        : { status: "cancelled", failureReason: "결제를 취소하셨어요." },
    );
  }
  return confirmPayment(paymentId, { userId: user.id });
}

/** 브라우저 결제창이 실패·취소를 돌려줬을 때 기록만 남긴다(최종 판정은 토스 조회로) */
export async function markClientFailure(user: AppUser, paymentId: string, reason: string) {
  const repo = getRepository();
  const payment = await repo.getPayment(paymentId);
  if (!payment || payment.userId !== user.id || payment.status !== "pending") return;
  if (payment.provider === "toss") {
    const state = await getTossPaymentState(paymentId).catch(() => null);
    if (state?.status === "paid") return; // 실제로는 결제됨 → 완료 화면이 처리한다
  }
  await repo.updatePayment(paymentId, { status: "failed", failureReason: reason.slice(0, 200) });
}
