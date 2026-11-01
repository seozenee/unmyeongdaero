import type { FourPillars } from "./pillars";
import type { Strength } from "./strength";
import type { Weolun } from "./luck";
import { readRomance } from "./romance";
import { cheoneulBranches } from "./sinsal";
import { incomingRelations } from "./relations";
import { branchTenGod, tenGod, type Branch, type Stem } from "./tables";

/** 해석의 결론과 실제 근거를 함께 보낸다. 능력 검사나 사건 발생 확률이 아니다. */
export interface AptitudeReading {
  lead: string;
  reason: string;
  basis: string[];
  caution: string;
}
export interface ReadingWindow {
  period: string;
  year: number;
  month?: number;
  age: number;
  ganji: string;
  reasons: string[];
  cautions: string[];
}

export function buildReadingFocus(input: {
  pillars: FourPillars; strength: Strength; isFemale: boolean; birthYear: number;
  years: ReadonlyArray<{ year: number; full: string }>;
  months: readonly Weolun[];
}) {
  const { pillars, strength, isFemale, birthYear, years, months } = input;
  const stem = pillars.day.stem as Stem;
  const positions = (["year", "month", "day", "hour"] as const).flatMap((slot) => {
    const p = pillars[slot];
    if (!p) return [];
    const label = { year: "년", month: "월", day: "일", hour: "시" }[slot];
    return [
      ...(slot === "day" ? [] : [{ god: tenGod(stem, p.stem as Stem), basis: `${label}간 ${p.stem}` }]),
      { god: branchTenGod(stem, p.branch as Branch), basis: `${label}지 ${p.branch}의 본기` },
    ];
  });
  const pick = (gods: readonly string[]) => positions.filter(p => gods.includes(p.god)).map(p => `${p.basis} ${p.god}`);
  const output = pick(["식신", "상관"]);
  const wealth = pick(["정재", "편재"]);
  const resource = pick(["정인", "편인"]);
  const authority = pick(["정관", "편관"]);
  const burden = strength === "신약"
    ? "일을 키울 때 혼자 책임질 양도 함께 늘기 쉬워, 동료의 지원과 맡는 범위가 중요해요."
    : "자기 판단을 밀어붙이는 힘이 고객의 반응이나 동료의 의견보다 앞서지 않게 조율해야 해요.";
  const business: AptitudeReading = output.length && wealth.length ? {
    lead: "만들어 낸 것을 사람에게 설명하고, 실제 거래로 연결하는 사업 방식과 잘 맞는 사주예요.",
    reason: "생각을 결과물로 꺼내는 자리와, 그 결과를 보상으로 연결하는 자리가 함께 보여요. 아이디어만 내는 역할보다 무엇을 누구에게 제공할지까지 맡는 쪽에 강점이 모여요.",
    basis: [...output, ...wealth], caution: burden,
  } : wealth.length ? {
    lead: "새로운 것을 계속 벌이기보다, 고객이 원하는 것과 돌아올 몫을 맞추는 운영 방식이 어울려요.",
    reason: "거래와 결과를 살피는 자리가 드러나 있어요. 다만 제품을 만드는 힘까지 같은 방식으로 드러난 것은 아니어서, 기획·제작을 함께 맡을 사람과의 역할 분담도 중요해요.",
    basis: wealth, caution: burden,
  } : output.length ? {
    lead: "자신의 기술이나 콘텐츠를 먼저 보여 주고, 그다음 수익 구조를 붙이는 방식이 어울려요.",
    reason: "표현하고 만들어 내는 자리가 드러나 있어요. 다만 결과물을 잘 만드는 일과 값을 정하고 수금하는 일은 별개라서, 두 역할을 따로 챙겨야 장점이 남아요.",
    basis: output, caution: burden,
  } : {
    lead: resource.length ? "충분히 익힌 지식과 경험을 쌓아 자기 분야를 만드는 방식이 어울려요." : "직접 모든 것을 만들기보다 역할과 기준을 세워 일을 이어 가는 방식부터 살펴볼 사주예요.",
    reason: "겉으로 드러난 자리만으로 사업 수완을 강하게 단정하기보다, 반복해서 맡을 수 있는 일과 지원받을 조건을 함께 읽어야 해요. 사업가가 될 수 없다는 뜻은 아니에요.",
    basis: [...resource, ...authority], caution: burden,
  };
  const expression: AptitudeReading = output.length ? {
    lead: resource.length ? "배운 것을 자기 말로 풀어 설명하는 데 장점을 살릴 수 있는 사주예요." : "생각을 말이나 결과물로 꺼내 보여 주는 쪽에 힘이 실리는 사주예요.",
    reason: resource.length
      ? "받아들이고 이해하는 자리와 밖으로 표현하는 자리가 함께 있어요. 지식을 그대로 외워 전하기보다, 상대가 알아듣게 다시 구성하는 설명·기획과 연결해서 읽어요."
      : "자기 안의 생각을 밖으로 꺼내는 자리가 보여요. 단순히 말이 많다는 뜻보다, 직접 설명하거나 보여 줄 몫이 있을 때 성향이 살아나는 쪽이에요.",
    basis: [...output, ...resource],
    caution: pick(["상관"]).length ? "문제점을 빨리 짚는 말이 상대에게는 평가로 들릴 수 있어요. 맞는 말을 하는 힘과 상대가 받아들일 여지는 함께 살펴야 해요." : "표현하는 자리가 있다고 실제 말솜씨가 측정된 것은 아니에요. 준비한 설명이 상대에게 어떻게 전달되는지도 함께 봐야 해요.",
  } : {
    lead: resource.length ? "즉석에서 말을 쏟기보다, 충분히 이해한 뒤 정리해서 전하는 쪽이 어울려요." : "즉흥적인 말솜씨보다 약속과 행동으로 신뢰를 쌓는 쪽부터 읽는 사주예요.",
    reason: "겉으로 드러난 표현의 자리만으로 말을 잘하거나 못한다고 판정할 수는 없어요. 준비할 시간과 익숙한 주제가 있을 때 설명이 어떻게 달라지는지를 함께 봐요.",
    basis: [...resource, ...authority], caution: "표현의 별이 적다는 이유로 발표·영업·창작의 가능성을 닫지 않아요. 배워 익힌 능력과 원국의 표시는 구별해요.",
  };
  const periods = [
    ...years.map(y => ({ year: y.year, age: y.year - birthYear + 1, ganji: y.full, period: `${y.year}년`, month: undefined as number | undefined })),
    ...months.map(m => ({ year: m.year, month: m.month, age: m.year - birthYear + 1, ganji: m.ganji, period: `${m.monthLabel} 절입 이후` })),
  ];
  const cautionFor = (ganji: string) => incomingRelations(pillars, { stem: ganji[0] as Stem, branch: ganji[1] as Branch, label: "들어오는 운" })
    .filter(r => ["충", "형", "자형", "파", "해"].includes(r.type) && (r.sourcePosition === "일지" || r.targetPosition === "일지"))
    .map(r => `${r.type}: ${r.meaning}`);
  const benefactor: ReadingWindow[] = periods.filter(p => cheoneulBranches(stem).includes(p.ganji[1] as Branch)).map(p => ({
    ...p, reasons: [`일간 ${stem}의 천을귀인 지지 ${p.ganji[1]}가 들어와요`, "전통적으로 조언·소개·중재처럼 사람을 통한 도움을 살펴보는 때예요"],
    cautions: cautionFor(p.ganji),
  }));
  // 미성년자의 이른 연애 시점을 배우자 시기처럼 고르지 않는다. 후보 선정 전 나이를 제한한다.
  const partnership: ReadingWindow[] = periods.filter(p => p.age >= 20).flatMap(p => {
    const match = readRomance(pillars, isFemale, [p]).meetings[0];
    if (!match || match.weight < 2) return [];
    return [{ ...p, reasons: match.reasons.map(r => r.replaceAll("그 해", p.month ? "이 달" : "그 해").replaceAll("해예요", p.month ? "달이에요" : "해예요")), cautions: cautionFor(p.ganji) }];
  });
  return {
    tradition: "전통 명리의 해석이며 실제 능력의 측정이나 사건 발생의 보장이 아닙니다.",
    business, expression, benefactor, partnership,
    timingBasis: "연도는 입춘 이후의 세운, 월은 해당 월 절입 이후의 월운입니다. 달력의 1일부터 끝날까지로 확대하지 않습니다.",
    relationshipScope: "배우자별·배우자 자리·도화 중 서로 다른 단서가 둘 이상 겹친 기간만 제시합니다. 이미 만나는 사람이 있으면 새 만남보다 관계의 구체화로 해석할 수 있습니다. 결혼일·상대의 이름·외모는 계산하지 않습니다.",
    unknownHour: pillars.hour === null,
  };
}
export type ReadingFocus = ReturnType<typeof buildReadingFocus>;
