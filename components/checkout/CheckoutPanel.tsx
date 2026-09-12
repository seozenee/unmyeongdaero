"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { formatKRW } from "@/lib/format";

type ConfirmResult =
  | { status: "paid"; redirect: string }
  | { status: "pending" }
  | { status: "failed" | "cancelled"; reason: string; retryUrl: string };

type CheckoutStart =
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

interface Notice {
  tone: "error" | "info";
  title: string;
  body: string;
  action?: { label: string; href: string };
}

interface CheckoutPanelProps {
  slug: string;
  readingId: string;
  price: number;
  ctaLabel: string;
  initialNotice?: Notice | null;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function CheckoutPanel({ slug, readingId, price, ctaLabel, initialNotice = null }: CheckoutPanelProps) {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState<null | "preparing" | "paying" | "confirming">(null);
  const [notice, setNotice] = useState<Notice | null>(initialNotice);
  const [mock, setMock] = useState<Extract<CheckoutStart, { kind: "mock" }> | null>(null);

  const handleResult = async (paymentId: string, result: ConfirmResult): Promise<void> => {
    if (result.status === "paid") {
      router.replace(result.redirect);
      return;
    }
    if (result.status === "pending") {
      // 웹훅보다 먼저 돌아온 경우: 잠깐 기다리며 몇 번 더 확인
      for (let attempt = 0; attempt < 5; attempt += 1) {
        await sleep(1500);
        const again = await confirm(paymentId);
        if (!again || again.status !== "pending") return again ? handleResult(paymentId, again) : undefined;
      }
      setNotice({
        tone: "info",
        title: "결제 확인이 조금 늦어지고 있어요",
        body: "결제가 완료됐다면 잠시 후 보관함에 자동으로 추가돼요. 이중 결제가 되지 않도록 다시 결제하기 전에 보관함을 먼저 확인해 주세요.",
        action: { label: "보관함 확인하기", href: "/library" },
      });
      return;
    }
    setNotice({
      tone: "error",
      title: result.status === "cancelled" ? "결제를 취소하셨어요" : "결제가 완료되지 않았어요",
      body: `${result.reason} 입력하신 명식 정보는 그대로 남아 있으니 언제든 다시 결제할 수 있어요.`,
    });
  };

  const confirm = async (paymentId: string, clientError?: { code?: string; message?: string }) => {
    setBusy("confirming");
    try {
      const response = await fetch("/api/payments/complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ paymentId, clientError }),
      });
      const body = await response.json();
      if (!response.ok) {
        setNotice({ tone: "error", title: "결제 확인에 실패했어요", body: body.error?.message ?? "잠시 후 보관함을 확인해 주세요." });
        return null;
      }
      return body as ConfirmResult;
    } catch {
      setNotice({
        tone: "error",
        title: "네트워크가 불안정해요",
        body: "결제 여부를 확인하지 못했어요. 결제가 됐다면 보관함에 자동으로 추가되니 먼저 확인해 주세요.",
        action: { label: "보관함 확인하기", href: "/library" },
      });
      return null;
    } finally {
      setBusy(null);
    }
  };

  const pay = async () => {
    if (!agreed) {
      setNotice({ tone: "info", title: "동의가 필요해요", body: "디지털 콘텐츠 청약철회 제한 안내를 확인하고 체크해 주세요." });
      return;
    }
    setNotice(null);
    setBusy("preparing");

    let start: CheckoutStart;
    try {
      const response = await fetch(`/api/checkout/${slug}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ readingId }),
      });
      const body = await response.json();
      if (response.status === 401 && body.error?.loginUrl) {
        window.location.href = body.error.loginUrl;
        return;
      }
      if (!response.ok) {
        setNotice({
          tone: "error",
          title: "결제를 준비하지 못했어요",
          body: body.error?.message ?? "잠시 후 다시 시도해 주세요.",
          action: body.error?.redirect ? { label: "정보 다시 입력하기", href: body.error.redirect } : undefined,
        });
        setBusy(null);
        return;
      }
      start = body;
    } catch {
      setNotice({ tone: "error", title: "네트워크가 불안정해요", body: "연결을 확인한 뒤 다시 시도해 주세요." });
      setBusy(null);
      return;
    }

    if (start.kind === "already-purchased") {
      router.replace(start.redirect);
      return;
    }
    if (start.kind === "mock") {
      setBusy(null);
      setMock(start);
      return;
    }

    setBusy("paying");
    try {
      const { requestPayment } = await import("@portone/browser-sdk/v2");
      const response = await requestPayment({
        storeId: start.storeId,
        channelKey: start.channelKey,
        paymentId: start.paymentId,
        orderName: start.orderName,
        totalAmount: start.totalAmount,
        currency: "KRW",
        payMethod: "CARD",
        redirectUrl: start.redirectUrl,
      });
      // 모바일 리다이렉트 방식이면 response 가 없고 /checkout/complete 에서 이어진다
      if (!response) return;
      const result = await confirm(start.paymentId, response.code ? { code: response.code, message: response.message } : undefined);
      if (result) await handleResult(start.paymentId, result);
    } catch (error) {
      console.error(error);
      const result = await confirm(start.paymentId, { code: "SDK_ERROR", message: "결제창을 여는 중 문제가 생겼어요." });
      if (result) await handleResult(start.paymentId, result);
    } finally {
      setBusy(null);
    }
  };

  const settleMock = async (outcome: "paid" | "cancelled") => {
    if (!mock) return;
    const paymentId = mock.paymentId;
    setMock(null);
    setBusy("confirming");
    try {
      const response = await fetch("/api/payments/mock", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ paymentId, outcome }),
      });
      const body = await response.json();
      if (!response.ok) {
        setNotice({ tone: "error", title: "모의 결제 처리 실패", body: body.error?.message ?? "다시 시도해 주세요." });
        return;
      }
      await handleResult(paymentId, body as ConfirmResult);
    } finally {
      setBusy(null);
    }
  };

  const busyLabel = { preparing: "결제를 준비하고 있어요…", paying: "결제창에서 진행해 주세요…", confirming: "결제를 확인하고 있어요…" };

  return (
    <div className="flex flex-col gap-space-sm">
      {notice && (
        <div
          role="alert"
          className={
            notice.tone === "error"
              ? "flex flex-col gap-1 rounded-xl bg-error-container/30 p-space-md"
              : "flex flex-col gap-1 rounded-xl bg-surface-container-high p-space-md"
          }
        >
          <span className={notice.tone === "error" ? "font-label-md text-label-md text-error" : "font-label-md text-label-md text-primary"}>
            {notice.title}
          </span>
          <p className="font-body-sm text-body-sm text-on-surface">{notice.body}</p>
          {notice.action && (
            <a href={notice.action.href} className="mt-1 self-start font-label-md text-label-md text-on-surface underline">
              {notice.action.label}
            </a>
          )}
        </div>
      )}

      <label className="flex items-start gap-space-sm rounded-lg bg-surface-container-low p-space-sm font-body-sm text-body-sm text-on-surface-variant">
        <input type="checkbox" className="mt-1 accent-secondary" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
        <span>
          결제 즉시 풀이 생성이 시작되는 디지털 콘텐츠로, <strong className="text-on-surface">열람이 시작되면 청약철회가 제한</strong>
          됨을 확인했어요. (전자상거래법 제17조 제2항)
        </span>
      </label>

      <button
        type="button"
        onClick={pay}
        disabled={busy !== null}
        className="mt-space-xs flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-secondary-container to-secondary py-3.5 font-label-md text-label-md text-on-secondary shadow-lg shadow-secondary-container/30 transition-transform active:scale-[0.98] disabled:opacity-60"
      >
        <span>{busy ? busyLabel[busy] : `${formatKRW(price)} · ${ctaLabel}`}</span>
        {!busy && <Icon name="arrow_forward" className="text-[18px]" />}
      </button>
      <p className="text-center font-label-sm text-label-sm text-outline">구독 결제 없음 · 영구 소장 단건 열람권</p>

      {mock && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 motion-safe:animate-fade-in" role="dialog" aria-modal>
          <div className="w-full max-w-md rounded-t-2xl bg-surface-container-high p-space-lg pb-safe motion-safe:animate-fade-up">
            <span className="rounded-full bg-tertiary/15 px-2 py-0.5 font-label-sm text-label-sm text-tertiary">개발용 모의 결제창</span>
            <h2 className="mt-space-sm font-headline-md text-headline-md text-on-surface">{mock.orderName}</h2>
            <p className="font-price-display text-price-display text-secondary">{formatKRW(mock.totalAmount)}</p>
            <p className="mt-space-xs font-body-sm text-body-sm text-on-surface-variant">
              PortOne 키가 없는 개발 환경이라 실제 결제 없이 승인/취소를 흉내 냅니다.
            </p>
            <div className="mt-space-md grid grid-cols-2 gap-space-sm">
              <button type="button" onClick={() => settleMock("cancelled")} className="rounded-xl bg-surface-container-highest py-3 font-label-md text-label-md text-on-surface">
                결제 취소
              </button>
              <button type="button" onClick={() => settleMock("paid")} className="rounded-xl bg-on-surface py-3 font-label-md text-label-md text-surface">
                결제 승인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
