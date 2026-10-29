"use client";

import { Icon } from "@/components/ui/Icon";
import { WebtoonMedia } from "@/components/webtoon/WebtoonMedia";
import type { WebtoonAsset } from "@/components/webtoon/assets";
import { cn } from "@/lib/cn";

interface FunnelStageProps {
  /** 뒤에 깔리는 상품의 그림. 없으면 바탕색만 */
  backdrop: WebtoonAsset | null;
  /** 전체 걸음 수와 지금 걸음(0부터) */
  total: number;
  current: number;
  /** 앞 답변에 반응하는 한 줄. 안내자의 말이다 */
  narration?: string | null;
  /** 이번에 묻는 것 */
  question: string;
  /** 질문 아래에 들어갈 입력 */
  children: React.ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  /** 다음으로 갈 수 있는 상태인가 */
  canGoNext?: boolean;
  nextLabel?: string;
  /** 건너뛸 수 있는 걸음(상대 명식 등) */
  onSkip?: () => void;
}

/**
 * 묻는 화면 한 장.
 *
 * 예전에는 어두운 바탕에 작은 입력 카드를 띄웠다. 카드는 '서류를 채우는 자리'처럼
 * 보여서, 이야기를 듣다가 갑자기 신청서를 받아 든 느낌이 됐다.
 *
 * 그림이 화면을 채우고 글자는 아래 3분의 1에만 앉힌다. 한 화면에 질문 하나만 두고,
 * 위에 걸음 수를 점으로 찍어 "몇 개 남았는지"를 늘 보이게 한다. 끝이 보이면 사람은
 * 끝까지 간다.
 *
 * 질문 위의 한 줄은 안내자가 앞 답을 듣고 건네는 말이다. 그 한 줄 때문에 같은 입력이
 * 설문이 아니라 대화가 된다.
 */
export function FunnelStage({
  backdrop,
  total,
  current,
  narration,
  question,
  children,
  onBack,
  onNext,
  canGoNext = true,
  nextLabel = "다음",
  onSkip,
}: FunnelStageProps) {
  return (
    <section className="fixed inset-0 z-40 flex flex-col bg-surface">
      {/* 배경 — 글자가 앉을 아래쪽만 깊게 덮는다 */}
      <div className="absolute inset-0">
        {backdrop ? (
          <WebtoonMedia asset={backdrop} className="absolute inset-0" />
        ) : (
          <div className="absolute inset-0 bg-surface-container" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/70 to-surface/20" />
      </div>

      {/* 걸음 — 몇 개 남았는지 늘 보이게 */}
      <header className="relative flex items-center gap-space-sm px-margin pt-[calc(1rem+env(safe-area-inset-top,0px))]">
        <button
          type="button"
          onClick={onBack}
          disabled={!onBack}
          aria-label="이전"
          className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-on-surface disabled:opacity-0"
        >
          <Icon name="arrow_back_ios_new" className="text-[18px]" />
        </button>
        <ol className="flex flex-1 items-center justify-center gap-1.5" aria-label={`${current + 1} / ${total}`}>
          {Array.from({ length: total }, (_, index) => (
            <li
              key={index}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                index === current ? "w-4 bg-secondary" : index < current ? "w-1.5 bg-secondary/60" : "w-1.5 bg-on-surface/20",
              )}
            />
          ))}
        </ol>
        <span className="h-10 w-10" aria-hidden />
      </header>

      {/* 묻는 자리 — 아래 3분의 1 */}
      <div className="relative mt-auto flex flex-col gap-space-md px-margin pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
        {narration && (
          <p className="font-body-md text-body-md italic text-on-surface-variant/80">{narration}</p>
        )}
        <h1 className="text-[1.75rem] font-bold leading-tight tracking-tight text-on-surface">{question}</h1>

        <div className="flex flex-col gap-space-sm">{children}</div>

        <div className="mt-space-xs flex gap-space-sm">
          {onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="rounded-xl border border-outline-variant/60 px-space-lg py-3.5 font-label-md text-label-md text-on-surface-variant"
            >
              건너뛰기
            </button>
          )}
          {onNext && (
            <button
              type="button"
              onClick={onNext}
              disabled={!canGoNext}
              className={cn(
                "flex-1 rounded-xl py-3.5 font-label-md text-label-md transition-colors",
                canGoNext ? "bg-secondary text-on-secondary" : "bg-secondary/25 text-on-surface/40",
              )}
            >
              {nextLabel}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

/** 고르는 자리 — 고른 것만 색이 찬다 */
export function StageChoice({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: string | null;
  onChange: (value: string) => void;
}) {
  return (
    <div role="radiogroup" className="flex flex-col gap-space-sm">
      {options.map((option) => {
        const picked = value === option;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={picked}
            onClick={() => onChange(option)}
            className={cn(
              "rounded-xl border py-3.5 font-label-md text-label-md transition-colors",
              picked
                ? "border-secondary bg-secondary/15 text-on-surface"
                : "border-outline-variant/50 text-on-surface-variant",
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
