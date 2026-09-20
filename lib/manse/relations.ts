// 글자끼리 맺는 관계 — 합·충·형·파·해.
//
// 원국 안에서도 보고(네 기둥끼리), 밖에서 들어오는 운과도 보고(세운·대운 대 원국),
// 두 사람 사이에서도 본다(궁합). 셋 다 "지지 목록을 받아 짝을 훑는다"는 같은 일이므로
// 한 벌의 판정기를 쓰고, 자리 이름만 바꿔 넘긴다.
//
// 전통적으로 형·충·파·해는 재앙의 언어로 쓰이지만, 여기서는 겁주지 않는 생활 언어로 옮긴다.
// meaning 문장은 그대로 프롬프트에 들어가므로 이 파일의 어조가 곧 결과물의 어조가 된다.
import {
  BRANCH_ELEMENT,
  DESTRUCTION,
  DIRECTIONAL_HARMONY,
  HARM,
  PUNISHMENT,
  SIX_CLASH,
  SIX_HARMONY,
  STEM_ELEMENT,
  STEM_HARMONY,
  THREE_HARMONY,
  type Branch,
  type Element,
  type Stem,
} from "./tables";
import type { FourPillars } from "./pillars";

export type RelationType = "천간합" | "천간충" | "육합" | "삼합" | "반합" | "방합" | "충" | "형" | "자형" | "파" | "해";

export interface Relation {
  type: RelationType;
  /** 관계를 맺은 글자 (예: "인") */
  source: string;
  target: string;
  /** 그 글자가 놓인 자리 (예: "일지", "2026 세운") */
  sourcePosition: string;
  targetPosition: string;
  /** 합이 만들어 내는 오행 */
  element?: Element;
  /** 붙어 있는 자리끼리인지. 떨어져 있으면 같은 관계라도 힘이 약하다 */
  isAdjacent?: boolean;
  /** 이 관계가 삶에서 어떤 결로 나타나는지 한 문장 */
  meaning: string;
}

/** 판정에 넣을 한 글자 — 어느 자리의 무슨 글자인지 */
export interface Token<T extends string = string> {
  position: string;
  char: T;
  /** 원국에서의 자리 순서(년0·월1·일2·시3). 인접 판정에만 쓴다 */
  order?: number;
}

// ─── 결을 옮기는 말 ──────────────────────────────────────────────────────────

const HARMONY_MEANING: Record<Element, string> = {
  목: "뻗어 나가려는 마음이 한데 모여, 새로 벌이는 일에 힘이 실린다",
  화: "드러내고 표현하려는 기운이 모여, 사람 앞에 나설 일이 늘어난다",
  토: "자리를 지키려는 기운이 모여, 흩어졌던 것이 한곳에 쌓인다",
  금: "매듭짓고 정리하려는 기운이 모여, 결정을 미루기 어려워진다",
  수: "안으로 살피는 기운이 모여, 깊이 생각하고 배우는 쪽으로 기운다",
};

const CLASH_MEANING: Record<string, string> = {
  "자오": "쉴 자리와 나설 자리가 맞부딪혀, 마음과 일정이 함께 흔들리기 쉽다",
  "축미": "묵혀 둔 것과 내놓을 것이 부딪혀, 오래된 문제를 꺼내 정리하게 된다",
  "인신": "움직임이 맞부딪혀, 이동·이사·직장 변화처럼 자리를 옮길 일이 생기기 쉽다",
  "묘유": "들이는 쪽과 거두는 쪽이 부딪혀, 관계와 계약을 다시 살피게 된다",
  "진술": "쌓아 둔 창고끼리 부딪혀, 정리해 두었던 일이 다시 열린다",
  "사해": "나아가려는 힘과 물러서려는 힘이 부딪혀, 결정을 서두르면 되돌리기 쉽다",
};

const PUNISHMENT_MEANING: Record<string, string> = {
  "인사신": "각자 서두르는 마음이 엇갈려, 일을 벌이기 전에 순서를 정해 두면 좋다",
  "축술미": "쌓아 둔 것을 두고 입장이 갈려, 사람 사이의 몫을 분명히 해 두면 편하다",
  "자묘": "가까운 사이일수록 예의가 흐려져, 말의 온도를 살피면 마찰이 준다",
};

/** 삼형 안의 두 글자만 만나도 형으로 본다 (인사·사신·인신, 축술·술미·축미) */
const PARTIAL_PUNISHMENT: ReadonlyArray<{ pair: readonly [Branch, Branch]; group: string }> = PUNISHMENT.filter(
  (group) => group.length === 3,
).flatMap((group) =>
  ([
    [group[0]!, group[1]!],
    [group[1]!, group[2]!],
    [group[0]!, group[2]!],
  ] as ReadonlyArray<readonly [Branch, Branch]>).map((pair) => ({ pair, group: group.join("") })),
);

const SELF_PUNISHMENT_MEANING = "자기 기준이 높아 스스로를 몰아붙이기 쉽다 — 잘 쉬는 것도 일의 일부로 두면 좋다";
const HARM_MEANING = "가까운 곳에서 어긋나기 쉬운 결 — 서운함이 쌓이기 전에 짚고 넘어가면 가벼워진다";
const DESTRUCTION_MEANING = "흐름이 한 번 끊겼다 이어지는 결 — 처음 계획을 조금 고쳐야 할 수 있다";

const STEM_HARMONY_MEANING = "마음이 한쪽으로 묶이는 결 — 끌리는 대상이나 일에 몰입하기 쉽다";
const STEM_CLASH_MEANING = "생각의 방향이 정면으로 갈리는 결 — 밀어붙이기보다 근거를 나란히 놓아야 풀린다";

/** 천간충 — 오행이 서로 극하면서 음양이 같은 짝 (갑경·을신·병임·정계) */
const STEM_CLASH: ReadonlyArray<readonly [Stem, Stem]> = [
  ["갑", "경"], ["을", "신"], ["병", "임"], ["정", "계"],
];

// ─── 판정 ────────────────────────────────────────────────────────────────────

/** 원국에서 바로 옆 기둥끼리인지. 자리 순서를 모르면(운·궁합) 판정하지 않는다 */
function adjacent(a: Token, b: Token): boolean | undefined {
  if (a.order === undefined || b.order === undefined) return undefined;
  return Math.abs(a.order - b.order) === 1;
}

const pairKey = (a: string, b: string) => [a, b].sort().join("");
const matches = (pair: readonly string[], a: string, b: string) =>
  (pair[0] === a && pair[1] === b) || (pair[0] === b && pair[1] === a);

/** 서로 다른 자리의 글자를 두 개씩 짝지어 준다 */
function pairs<T extends string>(tokens: readonly Token<T>[]): [Token<T>, Token<T>][] {
  const out: [Token<T>, Token<T>][] = [];
  for (let i = 0; i < tokens.length; i += 1) {
    for (let j = i + 1; j < tokens.length; j += 1) out.push([tokens[i]!, tokens[j]!]);
  }
  return out;
}

/** 천간끼리 — 합과 충 */
export function stemRelations(tokens: readonly Token<Stem>[]): Relation[] {
  const found: Relation[] = [];
  for (const [a, b] of pairs(tokens)) {
    const harmony = STEM_HARMONY.find((entry) => matches(entry.pair, a.char, b.char));
    if (harmony) {
      found.push({
        type: "천간합",
        source: a.char, target: b.char,
        sourcePosition: a.position, targetPosition: b.position,
        isAdjacent: adjacent(a, b),
        element: harmony.element,
        meaning: `${STEM_HARMONY_MEANING}. 둘이 만나 ${harmony.element}의 결로 화한다`,
      });
      continue;
    }
    if (STEM_CLASH.some((pair) => matches(pair, a.char, b.char))) {
      found.push({
        type: "천간충",
        source: a.char, target: b.char,
        sourcePosition: a.position, targetPosition: b.position,
        isAdjacent: adjacent(a, b),
        meaning: STEM_CLASH_MEANING,
      });
    }
  }
  return found;
}

/**
 * 세 글자가 모여야 성립하는 관계 — 삼합·방합·삼형.
 * 삼형이 온전히 모였으면 그 조합의 이름을 함께 돌려주어, 짝끼리 다시 세지 않게 한다.
 */
function tripleRelations(tokens: readonly Token<Branch>[]): { found: Relation[]; fullPunishments: Set<string> } {
  const found: Relation[] = [];
  const fullPunishments = new Set<string>();
  const has = (branch: Branch) => tokens.find((token) => token.char === branch);

  for (const { branches, element } of THREE_HARMONY) {
    const hits = branches.map(has).filter((token): token is Token<Branch> => Boolean(token));
    // 세 글자가 다 모이면 삼합, 왕지(가운데 글자)를 낀 두 글자면 반합
    const full = hits.length >= 3;
    const half = hits.length === 2 && hits.some((token) => token.char === branches[1]);
    if (!full && !half) continue;
    const [first, second] = hits;
    found.push({
      type: full ? "삼합" : "반합",
      source: first!.char, target: hits.slice(1).map((token) => token.char).join("·"),
      sourcePosition: first!.position, targetPosition: hits.slice(1).map((token) => token.position).join("·"),
      element,
      meaning: `${HARMONY_MEANING[element]}${full ? "" : " (반합이라 힘은 절반)"}`,
    });
    void second;
  }

  for (const { branches, element, season } of DIRECTIONAL_HARMONY) {
    const hits = branches.map(has).filter((token): token is Token<Branch> => Boolean(token));
    if (hits.length < 3) continue;
    found.push({
      type: "방합",
      source: hits[0]!.char, target: hits.slice(1).map((token) => token.char).join("·"),
      sourcePosition: hits[0]!.position, targetPosition: hits.slice(1).map((token) => token.position).join("·"),
      element,
      meaning: `${season}의 기운이 통째로 들어온 결 — ${HARMONY_MEANING[element]}`,
    });
  }

  for (const group of PUNISHMENT) {
    if (group.length < 3) continue;
    const hits = group.map(has).filter((token): token is Token<Branch> => Boolean(token));
    if (hits.length < 3) continue;
    fullPunishments.add(group.join(""));
    found.push({
      type: "형",
      source: hits[0]!.char, target: hits.slice(1).map((token) => token.char).join("·"),
      sourcePosition: hits[0]!.position, targetPosition: hits.slice(1).map((token) => token.position).join("·"),
      meaning: PUNISHMENT_MEANING[group.join("")] ?? SELF_PUNISHMENT_MEANING,
    });
  }
  return { found, fullPunishments };
}

/** 지지끼리 — 육합·충·형·파·해, 그리고 세 글자 관계 */
export function branchRelations(tokens: readonly Token<Branch>[]): Relation[] {
  const { found, fullPunishments } = tripleRelations(tokens);

  for (const [a, b] of pairs(tokens)) {
    const base = {
      source: a.char, target: b.char,
      sourcePosition: a.position, targetPosition: b.position,
      isAdjacent: adjacent(a, b),
    };

    if (SIX_HARMONY.some((pair) => matches(pair, a.char, b.char))) {
      // 육합은 화하는 오행이 관점마다 갈려, 여기서는 묶인다는 사실만 말한다
      found.push({ ...base, type: "육합", meaning: "두 자리가 한 몸처럼 묶이는 결 — 서로를 붙잡아 흐름이 느긋해진다" });
    }
    if (SIX_CLASH.some((pair) => matches(pair, a.char, b.char))) {
      found.push({ ...base, type: "충", meaning: CLASH_MEANING[pairKey(a.char, b.char)] ?? "맞부딪혀 흔들리는 결" });
    }
    // 두 글자 형 — 자묘형처럼 둘로 완결되는 것과, 삼형에서 둘만 만난 것.
    // 삼형이 이미 온전히 모였다면 짝으로 다시 세지 않는다.
    const twoWay = PUNISHMENT.find((group) => group.length === 2 && matches(group, a.char, b.char));
    const partial = PARTIAL_PUNISHMENT.find(
      (entry) => !fullPunishments.has(entry.group) && matches(entry.pair, a.char, b.char),
    );
    if (twoWay || partial) {
      const group = twoWay ? twoWay.join("") : partial!.group;
      found.push({ ...base, type: "형", meaning: PUNISHMENT_MEANING[group] ?? SELF_PUNISHMENT_MEANING });
    }
    if (a.char === b.char && PUNISHMENT.some((group) => group.length === 1 && group[0] === a.char)) {
      found.push({ ...base, type: "자형", meaning: SELF_PUNISHMENT_MEANING });
    }
    if (DESTRUCTION.some((pair) => matches(pair, a.char, b.char))) {
      found.push({ ...base, type: "파", meaning: DESTRUCTION_MEANING });
    }
    if (HARM.some((pair) => matches(pair, a.char, b.char))) {
      found.push({ ...base, type: "해", meaning: HARM_MEANING });
    }
  }
  return found;
}

// ─── 원국 ────────────────────────────────────────────────────────────────────

const SLOTS = ["년", "월", "일", "시"] as const;

export function pillarStems(pillars: FourPillars, suffix = "간"): Token<Stem>[] {
  return SLOTS.map((slot, index): Token<Stem> | null => {
    const pillar = pillars[slot === "년" ? "year" : slot === "월" ? "month" : slot === "일" ? "day" : "hour"];
    return pillar ? { position: `${slot}${suffix}`, char: pillar.stem as Stem, order: index } : null;
  }).filter((token): token is Token<Stem> => token !== null);
}

export function pillarBranches(pillars: FourPillars, suffix = "지"): Token<Branch>[] {
  return SLOTS.map((slot, index): Token<Branch> | null => {
    const pillar = pillars[slot === "년" ? "year" : slot === "월" ? "month" : slot === "일" ? "day" : "hour"];
    return pillar ? { position: `${slot}${suffix}`, char: pillar.branch as Branch, order: index } : null;
  }).filter((token): token is Token<Branch> => token !== null);
}

export interface NatalRelations {
  relations: Relation[];
  summary: string;
}

/** 원국 안에서 글자끼리 맺는 관계를 모두 모은다 */
export function computeNatalRelations(pillars: FourPillars): NatalRelations {
  const relations = [...stemRelations(pillarStems(pillars)), ...branchRelations(pillarBranches(pillars))];
  return { relations, summary: summarize(relations) };
}

const BOND_TYPES: readonly RelationType[] = ["천간합", "육합", "삼합", "반합", "방합"];

function summarize(relations: readonly Relation[]): string {
  if (relations.length === 0) return "네 기둥이 서로 부딪히거나 묶이는 자리 없이 담담하게 놓여 있다.";
  const bonds = relations.filter((relation) => BOND_TYPES.includes(relation.type));
  const frictions = relations.filter((relation) => !BOND_TYPES.includes(relation.type));
  const parts: string[] = [];
  if (bonds.length > 0) {
    parts.push(`묶이는 자리가 ${bonds.length}곳 있다(${bonds.map((relation) => relation.type).join("·")}).`);
  }
  if (frictions.length > 0) {
    parts.push(`부딪히거나 어긋나는 자리가 ${frictions.length}곳 있다(${frictions.map((relation) => relation.type).join("·")}).`);
  }
  parts.push(
    bonds.length > frictions.length
      ? "한번 맺은 인연과 일을 오래 끌고 가는 쪽에 가깝다."
      : frictions.length > bonds.length
        ? "자리를 옮기고 바꾸며 나아가는 쪽에 가깝다."
        : "묶이는 힘과 움직이는 힘이 엇비슷해, 때에 따라 결이 달라진다.",
  );
  return parts.join(" ");
}

// ─── 들어오는 운과 원국 ──────────────────────────────────────────────────────

/**
 * 운(대운·세운·월운)의 간지가 원국과 맺는 관계.
 * 운끼리의 관계는 보지 않고, 들어온 글자와 원국 네 기둥 사이만 본다.
 */
export function incomingRelations(
  pillars: FourPillars,
  incoming: { stem: Stem; branch: Branch; label: string },
): Relation[] {
  const stems = stemRelations([{ position: incoming.label, char: incoming.stem }, ...pillarStems(pillars)]);
  const branches = branchRelations([{ position: incoming.label, char: incoming.branch }, ...pillarBranches(pillars)]);
  const involves = (relation: Relation) =>
    relation.sourcePosition.includes(incoming.label) || relation.targetPosition.includes(incoming.label);
  return [...stems, ...branches].filter(involves);
}

// ─── 두 사람 사이 ────────────────────────────────────────────────────────────

export interface CrossRelations {
  relations: Relation[];
  /** 오행을 서로 얼마나 채워 주는지 */
  elementComplement: { element: Element; mine: number; theirs: number; note: string }[];
  summary: string;
}

/**
 * 두 명식 사이의 관계. 자기 원국 안의 관계는 빼고, 나와 상대 사이만 남긴다.
 * 일지(배우자 자리)끼리의 관계를 가장 앞에 둔다.
 */
export function computeCrossRelations(
  mine: FourPillars,
  theirs: FourPillars,
  names: { mine: string; theirs: string },
): CrossRelations {
  const mineStems = pillarStems(mine, `간(${names.mine})`);
  const theirStems = pillarStems(theirs, `간(${names.theirs})`);
  const mineBranches = pillarBranches(mine, `지(${names.mine})`);
  const theirBranches = pillarBranches(theirs, `지(${names.theirs})`);

  const between = (relation: Relation) => {
    const left = relation.sourcePosition.includes(names.mine);
    const right = relation.targetPosition.includes(names.mine);
    // 한쪽만 내 자리여야 두 사람 사이의 관계다
    return left !== right;
  };

  const relations = [
    ...stemRelations([...mineStems, ...theirStems]),
    ...branchRelations([...mineBranches, ...theirBranches]),
  ].filter(between);

  // 일지끼리가 가장 중요하다 — 앞으로 끌어 올린다
  relations.sort((a, b) => Number(isDayPair(b)) - Number(isDayPair(a)));

  return {
    relations,
    elementComplement: complement(mine, theirs),
    summary: crossSummary(relations, names),
  };
}

const isDayPair = (relation: Relation) =>
  relation.sourcePosition.startsWith("일") && relation.targetPosition.startsWith("일");

const ELEMENTS: readonly Element[] = ["목", "화", "토", "금", "수"];

function elementTally(pillars: FourPillars): Record<Element, number> {
  const tally: Record<Element, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  for (const pillar of [pillars.year, pillars.month, pillars.day, pillars.hour]) {
    if (!pillar) continue;
    tally[STEM_ELEMENT[pillar.stem as Stem]] += 1;
    tally[BRANCH_ELEMENT[pillar.branch as Branch]] += 1;
  }
  return tally;
}

function complement(mine: FourPillars, theirs: FourPillars) {
  const a = elementTally(mine);
  const b = elementTally(theirs);
  return ELEMENTS.map((element) => ({
    element,
    mine: a[element],
    theirs: b[element],
    note:
      a[element] === 0 && b[element] > 0
        ? "내게 없는 기운을 상대가 가지고 있어, 곁에 있으면 채워지는 자리"
        : b[element] === 0 && a[element] > 0
          ? "상대에게 없는 기운을 내가 가지고 있어, 내가 채워 줄 수 있는 자리"
          : a[element] >= 3 && b[element] >= 3
            ? "둘 다 넉넉해 같은 방향을 보지만, 한쪽으로 치우치기도 쉬운 자리"
            : "서로 비슷하게 가진 자리",
  }));
}

function crossSummary(relations: readonly Relation[], names: { mine: string; theirs: string }): string {
  const day = relations.find(isDayPair);
  const bonds = relations.filter((relation) => BOND_TYPES.includes(relation.type)).length;
  const frictions = relations.length - bonds;
  const head = day
    ? `배우자 자리인 일지끼리 ${day.type}으로 만난다. ${day.meaning}.`
    : `일지끼리 직접 맺는 관계는 없고, 다른 자리에서 서로에게 닿는다.`;
  const body =
    relations.length === 0
      ? `${names.mine}님과 ${names.theirs}님의 글자는 서로 부딪히지도, 묶이지도 않는다. 각자의 결을 유지한 채 만나는 사이다.`
      : bonds > frictions
        ? `전체로는 묶이는 자리(${bonds}곳)가 부딪히는 자리(${frictions}곳)보다 많아, 함께 있을수록 편안해지는 결이다.`
        : bonds < frictions
          ? `전체로는 부딪히는 자리(${frictions}곳)가 묶이는 자리(${bonds}곳)보다 많아, 서로 다른 속도를 인정해야 오래간다.`
          : `묶이는 자리와 부딪히는 자리가 ${bonds}곳씩으로 엇비슷해, 끌림과 마찰이 함께 오는 사이다.`;
  return `${head} ${body}`;
}
