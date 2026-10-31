import { cn } from "@/lib/cn";
import type { HomeChart } from "@/lib/manse/home-chart";

/** 오행 색. 목은 푸르고 화는 붉고 토는 누렇고 금은 희고 수는 검다 */
const ELEMENT_BAR: Record<string, string> = {
  wood: "bg-[#4fb286]",
  fire: "bg-[#f0522e]",
  earth: "bg-[#d4a017]",
  metal: "bg-[#c9c9c9]",
  water: "bg-[#5b8dd9]",
};

/** 오행이 가진 빛깔. 일주를 부르는 이름에 쓴다 */
const ELEMENT_COLOR_KO: Record<string, string> = {
  wood: "푸른",
  fire: "붉은",
  earth: "누런",
  metal: "흰",
  water: "검은",
};

/** 열두 지지의 짐승 */
const BRANCH_ANIMAL: Record<string, string> = {
  子: "쥐", 丑: "소", 寅: "호랑이", 卯: "토끼", 辰: "용", 巳: "뱀",
  午: "말", 未: "양", 申: "원숭이", 酉: "닭", 戌: "개", 亥: "돼지",
};

/**
 * 일주를 부르는 이름.
 *
 * "임자일주" 라고 적으면 아는 사람만 읽는다. 같은 글자를 빛깔과 짐승으로 바꾸면
 * "검은 쥐 사주" 가 된다 — 처음 보는 사람도 자기 것을 한 번에 부를 수 있고,
 * 무엇보다 기억에 남는다. 지어낸 말이 아니라 일간의 오행과 일지의 짐승을 그대로
 * 옮긴 것이다.
 */
export function dayPillarNickname(chart: HomeChart): string | null {
  const day = chart.pillars.find((pillar) => pillar.slot === "일");
  const color = chart.dayMaster ? ELEMENT_COLOR_KO[chart.dayMaster.element] : null;
  const animal = day ? BRANCH_ANIMAL[day.branchHanja] : null;
  if (!color || !animal) return null;
  return `${color} ${animal} 사주`;
}

/**
 * 사주판.
 *
 * 여덟 글자를 네 칸에 세운다. 오른쪽부터 년·월·일·시로 읽는 한국 만세력 차례를
 * 그대로 따라 시·일·월·년 순으로 놓는다. 가운데 일주만 테를 둘러 둔다 — 여덟 중
 * 어느 글자가 나인지 모르면 판은 그냥 한자 여덟 개다.
 */
export function ChartBoard({ chart, className }: { chart: HomeChart; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-space-md", className)}>
      <ol className="grid grid-cols-4 gap-space-xs">
        {chart.pillars.map((pillar) => {
          const mine = pillar.slot === "일";
          return (
            <li
              key={pillar.slot}
              className={cn(
                "flex flex-col items-center gap-1 rounded-2xl py-space-sm",
                mine
                  ? "bg-[rgb(var(--accent)/0.16)] ring-1 ring-[rgb(var(--accent)/0.55)]"
                  : "bg-surface-container-lowest",
              )}
            >
              <span className={cn("font-label-sm text-label-sm", mine ? "text-[rgb(var(--accent))]" : "text-outline")}>
                {pillar.slot}주
              </span>
              <span className="text-[1.6rem] font-extrabold leading-none text-on-surface">{pillar.stemHanja}</span>
              <span className="text-[1.6rem] font-extrabold leading-none text-on-surface">{pillar.branchHanja}</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                {pillar.stem}
                {pillar.branch}
              </span>
            </li>
          );
        })}
      </ol>

      {chart.elements.length > 0 && (
        <div className="flex flex-col gap-space-xs">
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-surface-container-lowest">
            {chart.elements.map((element) => (
              <span
                key={element.key}
                className={cn("h-full", ELEMENT_BAR[element.key])}
                style={{ width: `${element.percent}%` }}
              />
            ))}
          </div>
          <ul className="flex flex-wrap gap-x-space-sm gap-y-0.5">
            {chart.elements.map((element) => (
              <li key={element.key} className="flex items-center gap-1 font-label-sm text-label-sm">
                <span className={cn("h-2 w-2 rounded-full", ELEMENT_BAR[element.key])} />
                <span className="text-on-surface-variant">{element.ko}</span>
                <span className={element.percent === 0 ? "text-outline" : "text-on-surface"}>{element.percent}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
