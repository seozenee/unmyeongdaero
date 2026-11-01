"use client";

import { useState } from "react";

/** 결제 전에 번호를 놓쳤어도 본인 풀이에서 완성 알림을 신청할 수 있다. */
export function ReadingNotificationForm({ readingId, hasPhone = false }: { readingId: string; hasPhone?: boolean }) {
  const [editing, setEditing] = useState(!hasPhone);
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(hasPhone ? "등록한 번호로 풀이 완성 알림을 받아요." : "");
  const [failed, setFailed] = useState(false);

  if (!editing) return <div className="flex items-center gap-2 rounded-xl border border-outline-variant/40 p-space-md text-sm text-on-surface-variant" onClick={event => event.stopPropagation()}>
    <p className="flex-1" role="status">{notice}</p>
    <button type="button" onClick={() => setEditing(true)} className="shrink-0 py-2 text-secondary">번호 변경</button>
  </div>;

  return <form className="flex flex-col gap-3 rounded-xl border border-secondary/25 bg-surface-container-low p-space-lg" onClick={event => event.stopPropagation()}
    onSubmit={async event => {
      event.preventDefault();
      if (busy) return;
      setBusy(true); setFailed(false); setNotice("");
      try {
        const response = await fetch(`/api/readings/${readingId}`, { method: "PATCH", headers: { "content-type": "application/json" },
          body: JSON.stringify({ notifyPhone: phone, consent: true }) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error?.message ?? "번호를 저장하지 못했어요. 다시 시도해 주세요.");
        if (result.ready && !result.sent) {
          setFailed(true); setNotice("번호는 저장했지만 지금 알림을 보내지 못했어요. 잠시 뒤 다시 눌러 주세요.");
        } else {
          setNotice(result.sent ? "카카오톡으로 풀이와 PDF 받는 링크를 보냈어요." : "번호를 저장했어요. 풀이가 완성되면 카카오톡으로 알려 드릴게요.");
          setEditing(false); setPhone("");
        }
      } catch (error) {
        setFailed(true); setNotice(error instanceof Error ? error.message : "연결을 확인하고 다시 시도해 주세요.");
      } finally { setBusy(false); }
    }}>
    <label className="flex flex-col gap-2 text-sm font-semibold text-on-surface">
      카카오톡으로 풀이와 PDF 받기
      <input type="tel" inputMode="tel" autoComplete="tel" value={phone} maxLength={20} required placeholder="010-0000-0000"
        onChange={event => setPhone(event.target.value)} className="w-full rounded-lg border border-outline-variant/60 bg-surface px-3 py-3 text-base font-normal outline-none focus:border-secondary" />
    </label>
    <p className="text-xs leading-relaxed text-outline">알림 받기를 누르면 이 번호를 풀이 완성 알림과 PDF 링크 전송에 사용하는 데 동의해요. 광고는 보내지 않아요.</p>
    {notice && <p role={failed ? "alert" : "status"} className={failed ? "text-sm text-error" : "text-sm text-on-surface-variant"}>{notice}</p>}
    <button type="submit" disabled={busy} className="min-h-11 rounded-lg bg-secondary px-4 py-3 text-sm font-bold text-on-secondary disabled:opacity-60">
      {busy ? "저장하는 중…" : "이 번호로 알림 받기"}
    </button>
  </form>;
}
