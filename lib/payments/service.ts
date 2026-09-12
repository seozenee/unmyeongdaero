import "server-only";

import { randomUUID } from "node:crypto";
import type { AppUser } from "@/lib/auth/session";
import { getRepository, type Payment } from "@/lib/db";
import { env, isProduction, modes } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { CONSULT_TURN_LIMIT, getReport, type ReportProduct } from "@/lib/reports/catalog";
import { cancelPortOnePayment, getPortOnePaymentState } from "./portone";

export type CheckoutStart =
  | { kind: "already-purchased"; redirect: string }
  | {
      kind: "portone";
      paymentId: string;
      storeId: string;
      channelKey: string;
      orderName: string;
      totalAmount: number;
      redirectUrl: string;
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

  // 이미 소장한 리포트는 결제창 없이 바로 결과로
  if (report.kind === "report") {
    const purchase = await repo.getPurchase(user.id, report.slug);
    if (purchase) return { kind: "already-purchased", redirect: resultPathFor(report) };
  }

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

  const orderName = `운명대로 · ${report.categoryLabel}`;
  if (provider === "mock") return { kind: "mock", paymentId, orderName, totalAmount: report.price };

  return {
    kind: "portone",
    paymentId,
    storeId: env.portoneStoreId!,
    channelKey: env.portoneChannelKey!,
    orderName,
    totalAmount: report.price,
    redirectUrl: new URL(`/checkout/complete?slug=${report.slug}`, env.siteUrl).toString(),
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

export async function confirmPayment(paymentId: string, options: { userId?: string } = {}): Promise<ConfirmResult> {
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
    if (isProduction) throw new AppError(400, "INVALID_PROVIDER", "사용할 수 없는 결제 방식이에요.");
    return { status: "pending" };
  }

  const state = await getPortOnePaymentState(paymentId);
  if (state.status === "paid") {
    if (state.amount !== payment.amount) {
      // 위변조 의심: 결제를 취소하고 실패 처리
      await cancelPortOnePayment(paymentId, "결제 금액 불일치").catch((error) => console.error(error));
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
  if (isProduction) throw new AppError(404, "NOT_FOUND", "Not Found");
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

/** 브라우저 결제창이 실패·취소를 돌려줬을 때 기록만 남긴다(최종 판정은 PortOne 조회로) */
export async function markClientFailure(user: AppUser, paymentId: string, reason: string) {
  const repo = getRepository();
  const payment = await repo.getPayment(paymentId);
  if (!payment || payment.userId !== user.id || payment.status !== "pending") return;
  if (payment.provider === "portone") {
    const state = await getPortOnePaymentState(paymentId).catch(() => null);
    if (state?.status === "paid") return; // 실제로는 결제됨 → 웹훅/완료 확인이 처리
  }
  await repo.updatePayment(paymentId, { status: "failed", failureReason: reason.slice(0, 200) });
}
