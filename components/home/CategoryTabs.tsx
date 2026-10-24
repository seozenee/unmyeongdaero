"use client";

import { useState } from "react";
import type { ReportCategory } from "@/lib/reports/catalog";

type TabId = "all" | ReportCategory;

const TABS: ReadonlyArray<{ id: TabId; label: string }> = [
  { id: "all", label: "전체" },
  { id: "child", label: "우리 아이" },
  { id: "reunion", label: "재회" },
  { id: "romance", label: "연애" },
  { id: "chemistry", label: "궁합" },
  { id: "destiny", label: "평생" },
  { id: "year", label: "신년" },
  { id: "wealth", label: "재물" },
  { id: "work", label: "일·사업" },
  { id: "study", label: "공부" },
];

// code.html 바닐라 JS 가 토글하던 두 className 그대로
const INACTIVE_CLASS =
  "px-space-md py-1.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-md text-label-md hover:text-on-surface transition-colors";
const ACTIVE_CLASS =
  "px-space-md py-1.5 rounded-full bg-on-surface text-surface font-label-md text-label-md shadow-md shadow-primary/20 transition-all flex items-center gap-1.5";

interface CategoryTabsProps {
  defaultTab?: TabId;
}

export function CategoryTabs({ defaultTab = "all" }: CategoryTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab);

  return (
    <section className="no-scrollbar -mx-margin w-full overflow-x-auto px-margin py-space-sm">
      <div className="flex min-w-max items-center gap-space-xs">
        {TABS.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setActiveTab(tab.id);
                window.dispatchEvent(new CustomEvent("sazudaero:category", { detail: tab.id }));
                if (tab.id !== "all") document.getElementById("needs")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={active ? ACTIVE_CLASS : INACTIVE_CLASS}
            >
              {active && <span className="h-1.5 w-1.5 rounded-full bg-secondary" />}
              {tab.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
