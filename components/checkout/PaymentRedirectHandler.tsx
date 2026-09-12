"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";

type State =
  | { kind: "checking" }
  | { kind: "failed"; title: string; body: string; retryUrl?: string }
  | { kind: "pending" };

export function PaymentRedirectHandler({
  paymentId,
  code,
  message,
}: {
  paymentId: string | null;
  code: string | null;
  message: string | null;
}) {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "checking" });
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (!paymentId) {
      setState({ kind: "failed", title: "결제 정보가 없어요", body: "보관함에서 결제 결과를 확인해 주세요." });
      return;
    }

    void (async () => {
      for (let attempt = 0; attempt < 6; attempt += 1) {
        const response = await fetch("/api/payments/complete", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ paymentId, clientError: code ? { code, message } : undefined }),
        }).catch(() => null);
        const body = response ? await response.json().catch(() => null) : null;

        if (!response?.ok || !body) {
          setState({ kind: "failed", title: "결제 확인에 실패했어요", body: body?.error?.message ?? "보관함에서 결제 결과를 확인해 주세요." });
          return;
        }
        if (body.status === "paid") {
          router.replace(body.redirect);
          return;
        }
        if (body.status === "failed" || body.status === "cancelled") {
          setState({
            kind: "failed",
            title: body.status === "cancelled" ? "결제를 취소하셨어요" : "결제가 완료되지 않았어요",
            body: `${body.reason} 입력하신 정보는 그대로 남아 있어요.`,
            retryUrl: body.retryUrl,
          });
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
      setState({ kind: "pending" });
    })();
  }, [paymentId, code, message, router]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-space-md text-center">
      {state.kind === "checking" && (
        <>
          <Icon name="progress_activity" className="animate-spin text-[32px] text-primary" />
          <p className="font-body-md text-body-md text-on-surface-variant">결제를 확인하고 있어요…</p>
        </>
      )}
      {state.kind === "pending" && (
        <>
          <Icon name="schedule" className="text-[32px] text-tertiary" />
          <h1 className="font-headline-md text-headline-md text-on-surface">결제 확인이 늦어지고 있어요</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">결제가 완료됐다면 잠시 후 보관함에 자동으로 추가돼요.</p>
          <Link href="/library" className="rounded-xl bg-on-surface px-space-lg py-3 font-label-md text-label-md text-surface">
            보관함 확인하기
          </Link>
        </>
      )}
      {state.kind === "failed" && (
        <>
          <Icon name="error" className="text-[32px] text-error" />
          <h1 className="font-headline-md text-headline-md text-on-surface">{state.title}</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">{state.body}</p>
          <div className="flex gap-space-sm">
            {state.retryUrl && (
              <Link href={state.retryUrl} className="rounded-xl bg-on-surface px-space-lg py-3 font-label-md text-label-md text-surface">
                다시 결제하기
              </Link>
            )}
            <Link href="/library" className="rounded-xl bg-surface-container-highest px-space-lg py-3 font-label-md text-label-md text-on-surface">
              보관함
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
