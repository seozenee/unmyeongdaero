"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import type { ReportProduct } from "@/lib/reports/catalog";
import { getGuide } from "@/lib/story/guides";

export function SearchCatalog({ products }: { products: ReportProduct[] }) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return products;
    return products.filter((report) =>
      [report.title, report.categoryLabel, report.description, getGuide(report.guide).name]
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [query, products]);

  return (
    <div className="flex w-full flex-col gap-space-md py-space-md">
      <label className="flex items-center gap-space-sm rounded-xl bg-surface-container-high px-space-md py-3">
        <Icon name="search" className="text-[20px] text-outline" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="재회, 궁합, 이직, 건강…"
          className="flex-1 bg-transparent font-body-md text-body-md text-on-surface outline-none placeholder:text-outline"
          autoFocus
        />
      </label>

      <ul className="flex flex-col gap-space-sm">
        {results.map((report) => (
          <li key={report.slug}>
            <Link
              href={report.kind === "consult" ? "/consult" : `/reports/${report.slug}`}
              className="flex flex-col gap-1 rounded-xl bg-surface-container p-space-md transition-colors hover:bg-surface-container-high"
            >
              <span className="font-label-sm text-label-sm text-secondary">{report.categoryLabel}</span>
              <span className="font-label-md text-label-md text-on-surface">{report.title}</span>
              <span className="line-clamp-1 font-body-sm text-body-sm text-on-surface-variant">{report.description}</span>
              {/* 값은 결제 직전에만 — 찾는 자리에서는 들어올 이유를 적는다 */}
              <span className="flex items-center gap-1 font-label-sm text-label-sm text-tertiary">
                <Icon name="lock_open_right" className="text-[15px]" />
                명식까지 무료로 보기
              </span>
            </Link>
          </li>
        ))}
        {results.length === 0 && (
          <li className="rounded-xl bg-surface-container p-space-lg text-center font-body-sm text-body-sm text-on-surface-variant">
            찾는 풀이가 없어요. 다른 단어로 검색해 보세요.
          </li>
        )}
      </ul>
    </div>
  );
}
