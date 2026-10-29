"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { formatKRW } from "@/lib/format";

interface ManseConfirmProps {
  readingId: string;
  slug: string;
  title: string;
  categoryLabel: string;
  price: number;
  originalPrice: number | null;
  chapterCount: number;
}

/**
 * 만세력을 확인한 뒤 결제로 넘어가는 자리.
 *
 * 화면 아래에 붙어 따라다닌다. 만세력이 길어 스크롤이 생기는데, 끝까지 내려야만 결제할 수
 * 있게 하면 이미 마음을 정한 사람을 붙잡아 두는 셈이 된다.
 */
export function ManseConfirm({
  readingId,
  slug,
  title,
  categoryLabel,
  price,
  originalPrice,
  chapterCount,
}: ManseConfirmProps) {
  const router = useRouter();
  const [moving, setMoving] = useState(false);

  return (
    // 하단 내비게이션(h-16) 위에 얹는다. bottom-0 으로 두면 내비 뒤로 들어가 버튼이 가려진다.
    <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] z-20 -mx-margin mt-space-md bg-gradient-to-t from-surface via-surface to-transparent px-margin pb-space-sm pt-space-lg">
      <div className="flex flex-col gap-space-sm rounded-xl bg-surface-container-lowest/95 p-space-md shadow-2xl ring-1 ring-outline-variant/40 backdrop-blur-xl motion-safe:animate-fade-up">
        {/* 상품과 금액을 한 줄에 — 아래 칸이 두꺼우면 정작 확인해야 할 명식이 가려진다 */}
        <div className="flex items-baseline gap-space-sm">
          <div className="min-w-0 flex-1">
            <p className="truncate font-label-md text-label-md text-on-surface">{title}</p>
            <p className="font-label-sm text-label-sm text-outline">
              {categoryLabel} · 12개월 열람
            </p>
          </div>
          <div className="flex shrink-0 items-baseline gap-1.5">
            {originalPrice && (
              <span className="font-label-sm text-label-sm text-outline line-through">{formatKRW(originalPrice)}</span>
            )}
            <span className="font-price-display text-price-display text-secondary">{formatKRW(price)}</span>
          </div>
        </div>

        <button
          type="button"
          disabled={moving}
          onClick={() => {
            setMoving(true);
            router.push(`/checkout/${slug}?reading=${readingId}`);
          }}
          className="group flex w-full items-center justify-center gap-2 rounded-lg bg-on-surface py-3.5 font-label-md text-label-md text-surface shadow-lg transition-[transform,opacity] active:scale-[0.99] disabled:opacity-60"
        >
          {moving ? "결제 화면으로 가는 중…" : "이 명식이 맞아요 · 풀이 받기"}
          {!moving && (
            <Icon
              name="arrow_forward"
              className="text-[18px] transition-transform duration-200 group-hover:translate-x-0.5"
            />
          )}
        </button>
      </div>
    </div>
  );
}
