"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-space-md px-margin text-center">
      <span className="font-headline-xl text-headline-xl font-bold text-outline-variant">500</span>
      <h1 className="font-headline-md text-headline-md text-on-surface">잠시 문제가 생겼어요</h1>
      <p className="font-body-md text-body-md text-on-surface-variant">
        결제하신 리포트와 기록은 안전하게 남아 있어요. 잠시 후 다시 시도해 주세요.
      </p>
      <div className="flex gap-space-sm">
        <button type="button" onClick={reset} className="rounded-xl bg-on-surface px-space-lg py-3 font-label-md text-label-md text-surface">
          다시 시도
        </button>
        <Link href="/" className="rounded-xl bg-surface-container-highest px-space-lg py-3 font-label-md text-label-md text-on-surface">
          홈으로
        </Link>
      </div>
    </main>
  );
}
