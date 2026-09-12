"use client";

import { useEffect } from "react";
import { GuideAvatar } from "@/components/story/GuideAvatar";
import { useTypewriter } from "@/components/story/useTypewriter";
import { cn } from "@/lib/cn";
import type { Guide } from "@/lib/story/guides";

interface TypedProps {
  text: string;
  /** 타이핑 효과를 쓸지 (지난 대사는 false) */
  animate?: boolean;
  /** 타이핑이 끝나면 한 번 호출 */
  onTyped?: () => void;
  /** 스트리밍 중이라 뒤에 글자가 더 올 수 있음 */
  streaming?: boolean;
  /** 부모가 "빨리 넘기기"를 요청한 횟수 — 바뀌면 즉시 끝까지 표시 */
  skipSignal?: number;
}

function useTyped({ text, animate = true, onTyped, streaming, skipSignal }: TypedProps) {
  const typed = useTypewriter(text, { enabled: animate });
  const { skip, done } = typed;

  useEffect(() => {
    if (skipSignal) skip();
  }, [skipSignal, skip]);

  useEffect(() => {
    if (done && !streaming) onTyped?.();
    // onTyped 는 매 렌더 새로 만들어질 수 있어 done/streaming 변화에만 반응한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, streaming]);

  return typed;
}

export function GuideBubble({ guide, showName = true, ...props }: TypedProps & { guide: Guide; showName?: boolean }) {
  const typed = useTyped(props);
  return (
    <div className="flex items-start gap-space-sm motion-safe:animate-fade-up">
      <GuideAvatar guide={guide} size="sm" className={cn(!showName && "invisible")} />
      <div className="flex min-w-0 max-w-[84%] flex-col gap-1">
        {showName && <span className="font-label-sm text-label-sm text-on-surface-variant">{guide.name}</span>}
        <p className="whitespace-pre-line rounded-2xl rounded-tl-md bg-surface-container-high px-space-md py-2.5 font-body-md text-body-md leading-relaxed text-on-surface">
          {typed.text}
          {(!typed.done || props.streaming) && (
            <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-primary motion-safe:animate-dot-blink" />
          )}
        </p>
      </div>
    </div>
  );
}

export function NarrationLine(props: TypedProps) {
  const typed = useTyped({ ...props });
  return (
    <p className="mx-auto max-w-[90%] py-space-xs text-center font-body-sm text-body-sm leading-relaxed text-on-surface-variant motion-safe:animate-fade-in">
      {typed.text}
    </p>
  );
}

export function UserBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-end motion-safe:animate-fade-up">
      <div className="max-w-[80%] whitespace-pre-line rounded-2xl rounded-tr-md bg-primary/20 px-space-md py-2.5 font-body-md text-body-md leading-relaxed text-on-surface">
        {children}
      </div>
    </div>
  );
}

export function TypingIndicator({ guide }: { guide: Guide }) {
  return (
    <div className="flex items-center gap-space-sm motion-safe:animate-fade-in" aria-label={`${guide.name} 입력 중`}>
      <GuideAvatar guide={guide} size="sm" />
      <div className="flex gap-1 rounded-2xl rounded-tl-md bg-surface-container-high px-space-md py-3">
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            className="h-1.5 w-1.5 rounded-full bg-on-surface-variant motion-safe:animate-dot-blink"
            style={{ animationDelay: `${dot * 180}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
