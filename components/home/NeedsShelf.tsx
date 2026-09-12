"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GuideAvatar } from "@/components/story/GuideAvatar";
import { Icon } from "@/components/ui/Icon";
import { formatKRW } from "@/lib/format";
import { listReports, type ReportCategory } from "@/lib/reports/catalog";
import { getGuide } from "@/lib/story/guides";

export const CATEGORY_EVENT = "sazudaero:category";

/** 상단 카테고리 탭과 연동되는 "고민별로 찾는 풀이" 목록 */
export function NeedsShelf() {
  const [category, setCategory] = useState<"all" | ReportCategory>("all");

  useEffect(() => {
    const onChange = (event: Event) => setCategory((event as CustomEvent<"all" | ReportCategory>).detail);
    window.addEventListener(CATEGORY_EVENT, onChange);
    return () => window.removeEventListener(CATEGORY_EVENT, onChange);
  }, []);

  const reports = listReports("report").filter((report) => category === "all" || report.category === category);

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
              className="flex flex-col gap-space-xs rounded-xl bg-surface-container p-space-md transition-transform active:scale-[0.98] motion-safe:animate-fade-up"
            >
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-secondary">{report.categoryLabel}</span>
                <GuideAvatar guide={guide} size="sm" />
              </div>
              <span className="line-clamp-3 font-label-md text-label-md text-on-surface">{report.title}</span>
              <span className="mt-auto flex items-center justify-between pt-space-xs font-label-md text-label-md text-on-surface">
                {formatKRW(report.price)}
                <Icon name="chevron_right" className="text-[16px] text-outline" />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
