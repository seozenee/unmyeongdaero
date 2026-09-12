"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BirthForm } from "@/components/story/BirthForm";
import type { BirthProfile } from "@/lib/db/types";

export function ConsultStart({ sandbox, initialSubject }: { sandbox: boolean; initialSubject: BirthProfile | null }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const start = async (subject: BirthProfile) => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/readings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: "consult", subject, partner: null, answers: {} }),
      });
      const body = await response.json();
      if (response.status === 401 && body.error?.loginUrl) {
        window.location.href = body.error.loginUrl;
        return;
      }
      if (!response.ok) {
        setError(body.error?.message ?? "잠시 문제가 생겼어요. 다시 시도해 주세요.");
        return;
      }
      router.push(body.redirect);
    } catch {
      setError("네트워크가 불안정해요. 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-space-sm">
      {error && <p className="rounded-lg bg-error-container/30 p-space-sm font-body-sm text-body-sm text-on-surface">{error}</p>}
      <BirthForm
        title="새 상담에 쓸 나의 명식"
        submitLabel={busy ? "명식을 확인하고 있어요…" : "이 명식으로 상담 결제하기"}
        sandbox={sandbox}
        initial={initialSubject ?? undefined}
        onSubmit={start}
      />
    </div>
  );
}
