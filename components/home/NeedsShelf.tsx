"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getPoster } from "@/components/home/posters";
import { GuideAvatar } from "@/components/story/GuideAvatar";
import { Icon } from "@/components/ui/Icon";
import { WebtoonMedia } from "@/components/webtoon/WebtoonMedia";
import { cn } from "@/lib/cn";
import { formatKRW } from "@/lib/format";
import type { ReportCategory, ReportProduct } from "@/lib/reports/catalog";
import { productFont } from "@/lib/reports/fonts";
import { getGuide } from "@/lib/story/guides";
import { STITCH_ASSETS } from "./assets";

export const CATEGORY_EVENT = "sazudaero:category";

/**
 * 상단 카테고리 탭과 연동되는 "고민별로 찾는 풀이".
 *
 * 작은 카드를 두 줄로 깔면 열여덟 개가 한 덩어리로 보인다. 그림이 상품마다 다른데도
 * 눈에 들어오지 않는다. 한 줄에 하나씩, 그림을 크게 세워 차례로 보여 준다. 끝까지
 * 가려면 여러 번 밀어야 하지만, 미는 동안 상품 하나하나가 눈에 남는다.
 *
 * 좌우를 번갈아 눕혀 같은 모양이 반복되는 지루함을 던다.
 */
export function NeedsShelf({ products }: { products: ReportProduct[] }) {
  const [category, setCategory] = useState<"all" | ReportCategory>("all");

  useEffect(() => {
    const onChange = (event: Event) => setCategory((event as CustomEvent<"all" | ReportCategory>).detail);
    window.addEventListener(CATEGORY_EVENT, onChange);
    return () => window.removeEventListener(CATEGORY_EVENT, onChange);
  }, []);

  // 상품은 서버에서 받아 온다. 운영 화면에서 만든 상품도 함께 오려면 여기서 직접 읽으면 안 된다.
  const reports = products.filter((report) => category === "all" || report.category === category);

  return (
    <section id="needs" className="mt-space-xl flex scroll-mt-20 flex-col gap-space-lg">
      <div className="flex items-end justify-between px-space-xs">
        <div>
          <span className="font-label-sm text-label-sm tracking-widest text-tertiary">BY YOUR NEEDS</span>
          <h3 className="mt-0.5 font-headline-lg-mobile text-headline-lg-mobile text-on-surface">고민별로 찾는 풀이</h3>
        </div>
        <span className="font-label-sm text-label-sm text-outline">{reports.length}개</span>
      </div>

      <ol className="flex flex-col gap-space-lg">
        {reports.map((report, index) => {
          const guide = getGuide(report.guide);
          const poster = getPoster(report.slug, report.guide);
          const font = productFont(report.slug);
          const flip = index % 2 === 1;

          return (
            <li key={report.slug}>
              <Link
                href={`/reports/${report.slug}`}
                className={cn(
                  "group flex gap-space-md overflow-hidden rounded-2xl bg-surface-container p-space-sm transition-transform active:scale-[0.99]",
                  flip && "flex-row-reverse",
                )}
              >
                {/* 그림을 크게 — 카드의 절반 가까이가 그림이다 */}
                <div className="relative aspect-[3/4] w-[42%] shrink-0 overflow-hidden rounded-xl">
                  {poster ? (
                    <WebtoonMedia asset={poster} still className="absolute inset-0" />
                  ) : (
                    <div
                      role="img"
                      aria-label=""
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                      style={{ backgroundImage: `url('${STITCH_ASSETS[report.cover]}')` }}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-container/80 to-transparent" />
                  <span className="absolute left-space-sm top-space-sm rounded-full bg-surface-container-lowest/75 px-2 py-0.5 font-label-sm text-label-sm text-secondary backdrop-blur">
                    {report.categoryLabel}
                  </span>
                  {report.discountLabel && (
                    <span className="absolute bottom-space-sm left-space-sm rounded bg-secondary px-1.5 py-0.5 font-label-sm text-label-sm font-bold text-on-secondary">
                      {report.discountLabel}
                    </span>
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-center gap-space-xs py-space-sm">
                  <span className="flex items-center gap-1.5">
                    <GuideAvatar guide={guide} size="sm" />
                    <span className="truncate font-label-sm text-label-sm text-outline">{guide.title}</span>
                  </span>

                  <span
                    className="text-[1.5rem] leading-tight text-on-surface"
                    style={font ? { fontFamily: font } : undefined}
                  >
                    {report.title}
                  </span>
                  <span className="line-clamp-2 font-body-md text-body-md leading-snug text-on-surface-variant">
                    {report.tagline}
                  </span>

                  <span className="mt-space-xs flex items-baseline gap-1.5">
                    {report.originalPrice && (
                      <span className="font-label-sm text-label-sm text-outline line-through">
                        {formatKRW(report.originalPrice)}
                      </span>
                    )}
                    <span className="font-label-md text-label-md text-on-surface">{formatKRW(report.price)}</span>
                    <Icon
                      name="chevron_right"
                      className="ml-auto text-[18px] text-outline transition-transform duration-200 group-hover:translate-x-0.5"
                    />
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
