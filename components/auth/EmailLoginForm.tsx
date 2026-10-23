"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

/**
 * 이메일·비밀번호 로그인.
 *
 * 기본은 접어 둔다. 대부분은 카카오로 들어오고, 이 칸이 먼저 보이면 "가입부터 해야 하나"
 * 하는 벽으로 느껴진다. 필요한 사람만 펼쳐 쓰게 한다.
 *
 * form 으로 직접 보내므로 자바스크립트가 막혀 있어도 로그인된다.
 */
export function EmailLoginForm({ next }: { next: string }) {
  const [open, setOpen] = useState(false);
  const [intent, setIntent] = useState<"signin" | "signup">("signin");

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-outline-variant/60 py-3 font-label-md text-label-md text-on-surface-variant transition-colors hover:border-outline hover:text-on-surface"
      >
        <Icon name="mail" className="text-[18px]" />
        이메일로 시작하기
      </button>
    );
  }

  return (
    <form
      method="post"
      action="/auth/email"
      className="flex flex-col gap-space-sm rounded-xl border border-outline-variant/60 p-space-md text-left motion-safe:animate-fade-up"
    >
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="intent" value={intent} />

      <div className="flex rounded-lg bg-surface-container p-0.5">
        {(["signin", "signup"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setIntent(value)}
            className={`flex-1 rounded-[6px] py-2 font-label-sm text-label-sm transition-colors ${
              intent === value ? "bg-surface-container-highest text-on-surface" : "text-on-surface-variant"
            }`}
          >
            {value === "signin" ? "로그인" : "회원가입"}
          </button>
        ))}
      </div>

      <label className="flex flex-col gap-1">
        <span className="font-label-sm text-label-sm text-on-surface-variant">이메일</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="name@example.com"
          className="w-full rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-space-sm py-2.5 font-body-md text-body-md text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/60"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-label-sm text-label-sm text-on-surface-variant">비밀번호</span>
        <input
          type="password"
          name="password"
          required
          minLength={8}
          autoComplete={intent === "signup" ? "new-password" : "current-password"}
          placeholder="8자 이상"
          className="w-full rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-space-sm py-2.5 font-body-md text-body-md text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/60"
        />
      </label>

      <button
        type="submit"
        className="mt-space-xs w-full rounded-lg bg-on-surface py-3 font-label-md text-label-md text-surface transition-transform active:scale-[0.99]"
      >
        {intent === "signin" ? "로그인" : "가입하고 시작하기"}
      </button>
    </form>
  );
}
