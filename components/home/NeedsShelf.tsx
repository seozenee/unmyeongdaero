"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GuideAvatar } from "@/components/story/GuideAvatar";
import { Icon } from "@/components/ui/Icon";
import { formatKRW } from "@/lib/format";
import type { ReportCategory, ReportProduct } from "@/lib/reports/catalog";
import { getGuide } from "@/lib/story/guides";
import { STITCH_ASSETS } from "./assets";

export const CATEGORY_EVENT = "sazudaero:category";

/** 상단 카테고리 탭과 연동되는 "고민별로 찾는 풀이" 목록 */
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
    <section id="needs" className="mt-space-xl flex scroll-mt-20 flex-col gap-space-md">
      <div className="flex items-end justify-between px-space-xs">
        <div>
          <span className="font-label-sm text-label-sm tracking-widest text-tertiary">BY YOUR NEEDS</span>
          <h3 className="mt-0.5 font-headline-lg-mobile text-headline-lg-mobile text-on-surface">고민별로 찾는 풀이</h3>
        </div>
        <span className="font-label-sm text-label-sm text-outline">{reports.length}개</span>
      </div>
      <div className="grid grid-cols-2 gap-space-sm">
        {reports.map((report) => {
          const guide = getGuide(report.guide);
          return (
            <Link
              key={report.slug}
              href={`/reports/${report.slug}`}
              className="group relative flex flex-col overflow-hidden rounded-xl bg-surface-container transition-transform active:scale-[0.98] motion-safe:animate-fade-up"
            >
              {/* 표지 — 글자가 읽히도록 아래로 갈수록 어둡게 덮는다 */}
              <div className="relative h-24 w-full overflow-hidden">
                <div
                  role="img"
                  aria-label=""
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                  style={{ backgroundImage: `url('${STITCH_ASSETS[report.cover]}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-surface-container/50 to-transparent" />
                <span className="absolute left-space-md top-space-sm rounded-full bg-surface-container-lowest/70 px-2 py-0.5 font-label-sm text-label-sm text-secondary backdrop-blur">
                  {report.categoryLabel}
                </span>
                <div className="absolute right-space-sm top-space-sm">
                  <GuideAvatar guide={guide} size="sm" />
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-space-xs p-space-md pt-space-sm">
                <span className="font-label-sm text-label-sm text-secondary">{report.title}</span>
                <span className="line-clamp-2 font-label-md text-label-md leading-snug text-on-surface">{report.tagline}</span>
                <span className="mt-auto flex items-baseline justify-between pt-space-xs">
                  <span className="flex items-baseline gap-1.5">
                    {report.originalPrice && (
                      <span className="font-label-sm text-label-sm text-outline line-through">
                        {formatKRW(report.originalPrice)}
                      </span>
                    )}
                    <span className="font-label-md text-label-md text-on-surface">{formatKRW(report.price)}</span>
                  </span>
                  <Icon
                    name="chevron_right"
                    className="text-[16px] text-outline transition-transform duration-200 group-hover:translate-x-0.5"
                  />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
