import type { StoredSazu } from "@/lib/db/types";
import { ELEMENT_LABEL, FIVE_ELEMENTS, type FiveElement } from "../saju/ganji";
import { parseElementCounts, type SazuModules } from "../saju/modules";
import { buildReadingTeaser } from "./teaser";

/**
 * 첫 화면에 펼치는 내 원국.
 *
 * 용용사주를 보면 들어오자마자 자기 여덟 글자와 오행이 깔려 있고, 그 아래에 한 줄이
 * 있다 — "가장 강하게 열리는 달은 ●●월이에요". 답을 아는 사람이 일부러 가려 둔 모양이라,
 * 목록을 훑는 것과는 다른 마음이 된다. 고르는 게 아니라 확인하러 들어가게 된다.
 *
 * 우리도 같은 것을 한다. 다만 가린 값은 응답에 아예 담지 않는다. 화면에서만 가리면
 * 개발자 도구를 연 사람에게는 공짜로 보인다 — 가린 척이 되는 것이다.
 *
 * 여기 나오는 숫자는 전부 계산 결과다. 매력 점수나 상위 몇 퍼센트처럼 우리가 세지 않는
 * 숫자는 만들지 않는다.
 */

export interface HomePillar {
  /** 시·일·월·년 */
  slot: string;
  stem: string;
  branch: string;
  stemHanja: string;
  branchHanja: string;
}

export interface HomeChart {
  name: string;
  /** 일간 — 壬 水 임수 */
  dayMaster: { hanja: string; ko: string; element: FiveElement; elementKo: string } | null;
  /** 오른쪽부터 년·월·일·시로 읽는 한국 만세력 차례대로 시·일·월·년 */
  pillars: HomePillar[];
  /** 오행 비율. 합이 100 이 되게 반올림한다 */
  elements: Array<{ key: FiveElement; ko: string; percent: number }>;
  /** 답을 가린 한 줄. 가린 값은 서버에만 둔다 */
  masked: { prefix: string; suffix: string } | null;
}

const SLOTS = [
  { key: "hour", label: "시" },
  { key: "day", label: "일" },
  { key: "month", label: "월" },
  { key: "year", label: "년" },
] as const;

const str = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : null);

function pillarsFrom(modules: SazuModules): HomePillar[] {
  const four = modules.fourPillars as Record<string, Record<string, unknown>> | undefined;
  if (!four) return [];
  return SLOTS.flatMap(({ key, label }) => {
    const cell = four[key];
    if (!cell) return [];
    // 엔진은 천간을 sky, 지지를 earth 로 둔다(한자는 skyFull·earthFull)
    const stem = str(cell.sky);
    const branch = str(cell.earth);
    if (!stem || !branch) return [];
    return [
      {
        slot: label,
        stem,
        branch,
        stemHanja: str(cell.skyFull) ?? stem,
        branchHanja: str(cell.earthFull) ?? branch,
      },
    ];
  });
}

/**
 * 오행을 백분율로.
 *
 * 그냥 반올림하면 합이 99 나 101 이 된다. 다섯 칸을 보여 주면서 합이 100 이 아니면
 * 세어 본 사람에게는 틀린 표로 보인다. 가장 큰 칸이 나머지를 떠안는다.
 */
function elementPercents(counts: Record<FiveElement, number>) {
  const total = FIVE_ELEMENTS.reduce((sum, key) => sum + counts[key], 0);
  if (total === 0) return FIVE_ELEMENTS.map((key) => ({ key, ko: ELEMENT_LABEL[key].ko, percent: 0 }));

  const raw = FIVE_ELEMENTS.map((key) => ({ key, ko: ELEMENT_LABEL[key].ko, exact: (counts[key] / total) * 100 }));
  const rounded = raw.map((item) => ({ ...item, percent: Math.round(item.exact) }));
  const drift = 100 - rounded.reduce((sum, item) => sum + item.percent, 0);
  if (drift !== 0) {
    const biggest = rounded.reduce((a, b) => (b.exact > a.exact ? b : a));
    biggest.percent += drift;
  }
  return rounded.map(({ key, ko, percent }) => ({ key, ko, percent }));
}

export function buildHomeChart(sazu: StoredSazu, name: string): HomeChart {
  const modules = (sazu.today?.modules ?? sazu.manse?.modules ?? {}) as SazuModules;

  const pillars = pillarsFrom(modules);
  const day = pillars.find((pillar) => pillar.slot === "일") ?? null;
  const counts = parseElementCounts(modules);

  const dayElement = day ? elementOfStem(day.stem) : null;
  const teaser = buildReadingTeaser(modules, name);

  return {
    name,
    dayMaster:
      day && dayElement
        ? {
            hanja: day.stemHanja,
            ko: `${day.stem}${ELEMENT_LABEL[dayElement].ko}`,
            element: dayElement,
            elementKo: ELEMENT_LABEL[dayElement].ko,
          }
        : null,
    pillars,
    elements: counts ? elementPercents(counts) : [],
    // 달 이름은 빼고 앞뒤만 보낸다 — 가린 값은 서버에 남는다
    masked: teaser.best ? { prefix: `${name}님의 기운이 가장 강하게 열리는 달은`, suffix: "이에요" } : null,
  };
}

/** 천간 한 글자의 오행 */
const STEM_ELEMENT: Record<string, FiveElement> = {
  갑: "wood", 을: "wood", 병: "fire", 정: "fire", 무: "earth",
  기: "earth", 경: "metal", 신: "metal", 임: "water", 계: "water",
};

function elementOfStem(stem: string): FiveElement | null {
  return STEM_ELEMENT[stem] ?? null;
}
