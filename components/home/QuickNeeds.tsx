"use client";

import { Icon } from "@/components/ui/Icon";
import type { ReportCategory } from "@/lib/reports/catalog";

/**
 * 고민 바로가기.
 *
 * 첫 화면에 포스터만 깔면 "구경"은 되는데 "찾기"가 안 된다. 재회가 궁금해서 들어온
 * 사람이 재회 카드를 만나려면 몇 번을 밀어야 하는지 알 수 없다. 위쪽 탭은 글자만
 * 있어서 훑고 지나가기 쉽다.
 *
 * 아홉 칸을 한눈에 깔아, 자기 고민을 손으로 짚고 바로 그 줄로 내려가게 한다.
 *
 * 칸마다 상품이 몇 개인지 적어 두었는데, "1개" 가 붙은 칸이 여럿이라 고르기 전에 김이
 * 샜다. 몇 개인지는 내려가면 바로 보인다 — 여기서는 길만 가리킨다.
 */
const NEEDS: ReadonlyArray<{ id: ReportCategory; icon: string; label: string; question: string }> = [
  { id: "child", icon: "child_care", label: "우리 아이", question: "입시 · 공부 · 진로" },
  { id: "reunion", icon: "link_off", label: "재회", question: "그 사람 속마음" },
  { id: "romance", icon: "favorite", label: "연애", question: "인연이 드는 때" },
  { id: "chemistry", icon: "handshake", label: "궁합", question: "우리 둘의 결" },
  { id: "destiny", icon: "timeline", label: "평생", question: "인생의 큰 흐름" },
  { id: "year", icon: "calendar_month", label: "신년", question: "달마다의 운" },
  { id: "wealth", icon: "savings", label: "재물", question: "돈의 길목" },
  { id: "work", icon: "work", label: "일 · 사업", question: "적성과 때" },
  { id: "study", icon: "menu_book", label: "공부", question: "붙는 시기" },
];

export function QuickNeeds() {
  // 누르면 그 주제의 가로 줄로 데려다 준다
  const go = (id: ReportCategory) => {
    document.getElementById(`rail-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="mt-space-lg flex flex-col gap-space-sm">
      <h3 className="px-space-xs font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
        무엇이 궁금해서 오셨어요?
      </h3>
      <ul className="grid grid-cols-3 gap-space-xs">
        {NEEDS.map((need) => (
          <li key={need.id}>
            <button
              type="button"
              onClick={() => go(need.id)}
              className="flex h-full w-full flex-col items-center gap-1 rounded-xl bg-surface-container-high px-1 py-space-md transition-colors hover:bg-surface-bright active:scale-[0.98]"
            >
              <Icon name={need.icon} className="text-[26px] text-secondary" />
              <span className="font-label-md text-label-md text-on-surface">{need.label}</span>
              <span className="text-center font-label-sm text-label-sm leading-tight text-outline">
                {need.question}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
