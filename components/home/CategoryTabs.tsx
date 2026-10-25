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

// 알약 버튼은 저마다 테두리를 가져서 탭이 열 개쯤 되면 줄이 시끄러워진다.
// 글자만 두고 고른 것에만 밑줄을 긋는다 — 읽을 것은 글자고, 테두리가 아니다.
//
// 버튼에 좌우 여백을 주면 첫 글자가 본문 여백보다 한 칸 안쪽에서 시작하고, 마지막
// 글자도 오른쪽 끝과 어긋난다. 줄 하나가 어긋나면 화면 전체가 비뚜로 보인다.
// 여백은 버튼에서 걷어내고 글자 사이 간격으로만 벌린다 — 첫 글자와 마지막 글자가
// 아래 본문과 같은 선에서 시작하고 끝난다.
const INACTIVE_CLASS =
  "relative shrink-0 pb-2.5 pt-1 font-label-md text-label-md text-outline transition-colors hover:text-on-surface-variant";
const ACTIVE_CLASS =
  "relative shrink-0 pb-2.5 pt-1 font-label-md text-label-md text-on-surface after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-secondary";

interface CategoryTabsProps {
  defaultTab?: TabId;
}

/**
 * 위쪽 주제 탭.
 *
 * 예전에는 탭이 아래쪽 목록을 걸러 냈다. 목록을 없애고 주제마다 가로 줄을 세운 뒤로는
 * 걸러 낼 것이 없다 — 누르면 그 줄로 데려다 준다. 거르는 것보다 데려다 주는 쪽이
 * 낫다. 거르면 나머지가 사라지지만, 데려다 주면 그 뒤로도 계속 구경할 수 있다.
 */
export function CategoryTabs({ defaultTab = "all" }: CategoryTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab);

  return (
    <section className="-mx-margin w-full border-b border-outline-variant/30">
      {/* 오른쪽 끝을 흐리게 지워 "더 있다" 를 보여 준다. 스크롤 막대를 띄우는 것보다 조용하다 */}
      <div className="no-scrollbar overflow-x-auto px-margin [mask-image:linear-gradient(to_right,black_calc(100%-2.5rem),transparent)]">
        <div className="flex min-w-max items-end gap-space-lg">
          {TABS.map((tab) => {
            const active = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setActiveTab(tab.id);
                  document.getElementById(`rail-${tab.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={active ? ACTIVE_CLASS : INACTIVE_CLASS}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
