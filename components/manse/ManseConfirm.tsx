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
    <div className="pb-safe sticky bottom-0 z-20 -mx-margin mt-space-md bg-gradient-to-t from-surface via-surface to-transparent px-margin pb-space-md pt-space-lg">
      <div className="flex flex-col gap-space-sm rounded-xl bg-surface-container-lowest/95 p-space-md shadow-2xl ring-1 ring-outline-variant/40 backdrop-blur-xl">
        <div className="flex flex-col gap-0.5">
          <span className="font-label-sm text-label-sm text-secondary">{categoryLabel}</span>
          <p className="font-label-md text-label-md text-on-surface">{title}</p>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="font-price-display text-price-display text-secondary">{formatKRW(price)}</span>
          {originalPrice && (
            <span className="font-body-sm text-body-sm text-outline line-through">{formatKRW(originalPrice)}</span>
          )}
          <span className="ml-auto font-label-sm text-label-sm text-outline">
            {chapterCount}장 보고서 · 영구 소장
          </span>
        </div>

        <button
          type="button"
          disabled={moving}
          onClick={() => {
            setMoving(true);
            router.push(`/checkout/${slug}?reading=${readingId}`);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-on-surface py-3.5 font-label-md text-label-md text-surface shadow-lg transition-transform active:scale-[0.99] disabled:opacity-60"
        >
          {moving ? "결제 화면으로 가는 중…" : "이 명식으로 풀이 받기"}
          {!moving && <Icon name="arrow_forward" className="text-[18px]" />}
        </button>

        <p className="text-center font-label-sm text-label-sm text-outline">
          위 만세력이 맞는지 확인하신 뒤 눌러 주세요. 결제 후에는 이 명식으로 풀이가 만들어져요.
        </p>
      </div>
    </div>
  );
}
