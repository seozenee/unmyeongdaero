"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { parseGanji } from "@/lib/saju/ganji";
import type { DecadeItem } from "@/lib/saju/modules";

interface DecadeTimelineProps {
  items: DecadeItem[];
  /** 현재 대운 인덱스. 첫 대운 이전이면 -1 */
  currentIndex: number;
  direction?: string;
  className?: string;
}

export function DecadeTimeline({ items, currentIndex, direction, className }: DecadeTimelineProps) {
  const currentRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    // 가로 스크롤 영역 안에서만 현재 대운을 가운데로 (페이지 세로 스크롤은 건드리지 않음)
    const item = currentRef.current;
    const scroller = item?.parentElement;
    if (!item || !scroller) return;
    scroller.scrollLeft = item.offsetLeft - scroller.clientWidth / 2 + item.clientWidth / 2;
  }, [currentIndex]);

  return (
    <section className={cn("rounded-xl bg-surface-container p-space-lg", className)} aria-label="대운 흐름">
      <div className="flex items-baseline justify-between">
        <h3 className="font-headline-md text-headline-md text-on-surface">10년 대운 흐름</h3>
        {direction && <span className="font-label-sm text-label-sm text-outline">{direction}</span>}
      </div>

      {/* overflow-x-auto 는 세로 넘침도 잘라내므로 '지금' 배지 높이만큼 pt 확보 */}
      <ol className="no-scrollbar -mx-space-lg mt-space-sm flex snap-x gap-space-sm overflow-x-auto px-space-lg pb-1 pt-space-sm">
        {items.map((item, index) => {
          const current = index === currentIndex;
          const ganji = parseGanji(item.full);
          return (
            <li
              key={`${item.startAge}-${item.full}`}
              ref={current ? currentRef : undefined}
              aria-current={current ? "step" : undefined}
              className={cn(
                "relative flex w-[4.5rem] shrink-0 snap-center flex-col items-center gap-space-xs rounded-lg px-space-xs py-space-md",
                current ? "bg-primary/15 ring-1 ring-primary" : "bg-surface-container-high",
              )}
            >
              {current && (
                <span className="absolute -top-2 rounded-full bg-primary px-1.5 font-label-sm text-[10px] leading-4 text-on-primary">
                  지금
                </span>
              )}
              <span className={cn("font-label-sm text-label-sm", current ? "text-primary" : "text-outline")}>
                {item.startAge}세~
              </span>
              <span
                className={cn(
                  "font-headline-md text-headline-md leading-none",
                  current ? "text-primary" : "text-on-surface",
                )}
              >
                {ganji ? `${ganji.stem.han}${ganji.branch.han}` : item.full}
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                {ganji ? `${ganji.stem.ko}${ganji.branch.ko}` : ""}
              </span>
              {item.startYear !== undefined && (
                <span className="font-label-sm text-[10px] leading-4 text-outline">{item.startYear}</span>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
