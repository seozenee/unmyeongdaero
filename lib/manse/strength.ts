// 오행 분포와 신강약 판정.
//
// 신강약은 유파마다 점수 기준이 달라 숫자를 맞추는 건 의미가 없다.
// 여기서는 고전적 판단 근거인 득령·득지·득세 세 가지를 그대로 계산하고,
// 셋이 모두 서면 신강, 하나도 못 서면 신약, 그 사이를 중화로 본다.
// (점수는 고객에게 보여 주지 않으므로 만들지 않는다)
import type { FourPillars } from "./pillars";
import {
  BRANCH_ELEMENT, GENERATES, HIDDEN_STEMS, STEM_ELEMENT,
  type Branch, type Element, type Stem,
} from "./tables";

export type Strength = "신강" | "중화" | "신약";

export interface ElementCount {
  element: Element;
  /** 천간에 드러난 수 */
  sky: number;
  /** 지지에 드러난 수 */
  earth: number;
  total: number;
  percentage: number;
}

export interface StrengthResult {
  strength: Strength;
  /** 월지가 일간을 돕는가 — 계절의 기운을 얻었는가 */
  deukryeong: boolean;
  /** 일지가 일간을 돕는가 — 발 딛은 자리를 얻었는가 */
  deukji: boolean;
  /** 나머지 글자 중 돕는 편이 많은가 — 세력을 얻었는가 */
  deukse: boolean;
  /** 일간을 돕는 글자 수 (일간 자신은 제외) */
  supporting: number;
  /** 일간의 힘을 빼는 글자 수 */
  draining: number;
}

/** 어떤 오행이 일간을 돕는가 — 같은 오행(비겁)이거나 일간을 생하는 오행(인성) */
function supports(dayElement: Element, other: Element): boolean {
  return other === dayElement || GENERATES[other] === dayElement;
}

function pillarList(pillars: FourPillars) {
  return [pillars.year, pillars.month, pillars.day, pillars.hour].filter((p) => p !== null);
}

export function countElements(pillars: FourPillars): ElementCount[] {
  const list = pillarList(pillars);
  const sky = new Map<Element, number>();
  const earth = new Map<Element, number>();

  for (const pillar of list) {
    const s = STEM_ELEMENT[pillar.stem as Stem];
    const e = BRANCH_ELEMENT[pillar.branch as Branch];
    sky.set(s, (sky.get(s) ?? 0) + 1);
    earth.set(e, (earth.get(e) ?? 0) + 1);
  }

  const total = list.length * 2;
  const order: Element[] = ["목", "화", "토", "금", "수"];

  return order.map((element) => {
    const s = sky.get(element) ?? 0;
    const e = earth.get(element) ?? 0;
    const sum = s + e;
    return {
      element,
      sky: s,
      earth: e,
      total: sum,
      percentage: total === 0 ? 0 : Math.round((sum / total) * 1000) / 10,
    };
  });
}

export function judgeStrength(pillars: FourPillars): StrengthResult {
  const dayElement = STEM_ELEMENT[pillars.day.stem as Stem];

  // 득령 — 태어난 계절(월지)이 일간을 돕는가
  const deukryeong = supports(dayElement, BRANCH_ELEMENT[pillars.month.branch as Branch]);

  // 득지 — 일간이 앉은 자리(일지)가 돕는가
  const deukji = supports(dayElement, BRANCH_ELEMENT[pillars.day.branch as Branch]);

  // 득세 — 일간을 뺀 나머지 글자들의 편이 어느 쪽으로 기우는가
  let supporting = 0;
  let draining = 0;
  for (const pillar of pillarList(pillars)) {
    const chars: Element[] = [STEM_ELEMENT[pillar.stem as Stem], BRANCH_ELEMENT[pillar.branch as Branch]];
    chars.forEach((element, index) => {
      // 일간 자신은 세력 계산에서 뺀다
      if (pillar === pillars.day && index === 0) return;
      if (supports(dayElement, element)) supporting += 1;
      else draining += 1;
    });
  }
  const deukse = supporting > draining;

  const standing = [deukryeong, deukji, deukse].filter(Boolean).length;
  const strength: Strength = standing === 3 ? "신강" : standing === 0 ? "신약" : "중화";

  return { strength, deukryeong, deukji, deukse, supporting, draining };
}

/**
 * 용신 후보 — 신강이면 힘을 덜어 내는 오행, 신약이면 북돋는 오행.
 * 실제 용신 선정은 격국·조후까지 봐야 하므로 여기서는 방향만 제시하고
 * 최종 해석은 AI 가 명식 전체를 보고 정리한다.
 */
export function yongsinDirection(pillars: FourPillars, strength: Strength): { need: Element[]; avoid: Element[] } {
  const me = STEM_ELEMENT[pillars.day.stem as Stem];
  const generatesMe = (Object.keys(GENERATES) as Element[]).find((e) => GENERATES[e] === me)!;
  const iGenerate = GENERATES[me];
  const iOvercome = (["목", "화", "토", "금", "수"] as Element[]).find((e) => GENERATES[me] !== e && e !== me && GENERATES[e] !== me && GENERATES[iGenerate] === e) ?? iGenerate;

  if (strength === "신강") {
    // 넘치는 힘은 내보내거나(식상) 눌러 주는(관성) 쪽이 좋다
    return { need: [iGenerate, iOvercome], avoid: [me, generatesMe] };
  }
  if (strength === "신약") {
    // 모자란 힘은 같은 편(비겁)과 생해 주는 쪽(인성)으로 채운다
    return { need: [me, generatesMe], avoid: [iGenerate, iOvercome] };
  }
  return { need: [], avoid: [] };
}

/** 지지에 숨은 천간까지 포함한 오행 분포 — 원국에 드러나지 않은 기운을 볼 때 쓴다 */
export function countElementsWithHidden(pillars: FourPillars): ElementCount[] {
  const list = pillarList(pillars);
  const tally = new Map<Element, number>();
  let total = 0;

  for (const pillar of list) {
    const add = (element: Element) => {
      tally.set(element, (tally.get(element) ?? 0) + 1);
      total += 1;
    };
    add(STEM_ELEMENT[pillar.stem as Stem]);
    for (const hidden of HIDDEN_STEMS[pillar.branch as Branch]) add(STEM_ELEMENT[hidden]);
  }

  const order: Element[] = ["목", "화", "토", "금", "수"];
  return order.map((element) => {
    const sum = tally.get(element) ?? 0;
    return {
      element,
      sky: 0,
      earth: 0,
      total: sum,
      percentage: total === 0 ? 0 : Math.round((sum / total) * 1000) / 10,
    };
  });
}
