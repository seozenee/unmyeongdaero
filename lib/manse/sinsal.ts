// 신살(神煞) 판정.
//
// 이름과 걸린 자리만 계산한다. 뜻풀이 문장은 두지 않는다 —
// 해석은 계산된 사실을 근거로 AI 가 쓴다.
//
// 기준축이 신살마다 다르다.
//   · 십이신살: 삼합국 기준. 년지와 일지 두 축으로 각각 돌린다.
//   · 귀인류: 일간(때로는 년간) 기준.
//   · 괴강·백호·현침: 일주 자체의 간지 조합.
//   · 공망: 일주가 속한 순(旬)에서 비는 두 지지.
import type { FourPillars, Pillar } from "./pillars";
import { BRANCHES, STEMS, THREE_HARMONY, type Branch, type Stem } from "./tables";

export type PillarSlot = "년" | "월" | "일" | "시";
export type SinsalGroup = "길신" | "흉살" | "십이신살";

export interface SinsalHit {
  name: string;
  group: SinsalGroup;
  /** 걸린 자리 — "년지", "일주" 처럼 자리와 대상을 함께 적는다 */
  positions: string[];
}

const SLOTS: PillarSlot[] = ["년", "월", "일", "시"];

function pillarsOf(p: FourPillars): Array<{ slot: PillarSlot; pillar: Pillar | null }> {
  return [
    { slot: "년", pillar: p.year },
    { slot: "월", pillar: p.month },
    { slot: "일", pillar: p.day },
    { slot: "시", pillar: p.hour },
  ];
}

// ─── 십이신살 ────────────────────────────────────────────────────────────────

const TWELVE_SINSAL = [
  "겁살", "재살", "천살", "지살", "년살", "월살",
  "망신살", "장성살", "반안살", "역마살", "육해살", "화개살",
] as const;

/** 삼합국의 마지막 글자(묘지) 다음이 겁살 자리가 된다 */
function robberyStart(base: Branch): Branch {
  const group = THREE_HARMONY.find((g) => g.branches.includes(base));
  if (!group) throw new Error(`[manse] 삼합국을 찾지 못했습니다: ${base}`);
  const last = group.branches.at(-1)!;
  return BRANCHES[(BRANCHES.indexOf(last) + 1) % 12]!;
}

/** 기준 지지로 본 각 지지의 십이신살 이름 */
export function twelveSinsalOf(base: Branch, target: Branch): string {
  const start = BRANCHES.indexOf(robberyStart(base));
  const distance = (BRANCHES.indexOf(target) - start + 12) % 12;
  return TWELVE_SINSAL[distance]!;
}

// ─── 일간 기준 귀인 ──────────────────────────────────────────────────────────

/** 천을귀인 — 일간이 만나면 귀한 도움을 얻는 자리 */
const CHEONEUL: Record<Stem, readonly Branch[]> = {
  갑: ["축", "미"], 무: ["축", "미"], 경: ["축", "미"],
  을: ["자", "신"], 기: ["자", "신"],
  병: ["해", "유"], 정: ["해", "유"],
  임: ["묘", "사"], 계: ["묘", "사"],
  신: ["인", "오"],
};

/** 문창귀인 — 일간이 생하는 오행의 왕지 */
const MUNCHANG: Record<Stem, Branch> = {
  갑: "사", 을: "오", 병: "신", 정: "유", 무: "신",
  기: "유", 경: "해", 신: "자", 임: "인", 계: "묘",
};

/** 학당귀인 — 일간의 장생지 */
const HAKDANG: Record<Stem, Branch> = {
  갑: "해", 을: "오", 병: "인", 정: "유", 무: "인",
  기: "유", 경: "사", 신: "자", 임: "신", 계: "묘",
};

/** 문곡귀인 — 학당의 충 자리 */
const MUNGOK: Record<Stem, Branch> = {
  갑: "사", 을: "자", 병: "신", 정: "묘", 무: "신",
  기: "묘", 경: "해", 신: "오", 임: "인", 계: "유",
};

/** 금여 — 일간의 녹 다음다음 자리. 배우자 덕을 본다고 읽는다 */
const GEUMYEO: Record<Stem, Branch> = {
  갑: "진", 을: "사", 병: "미", 정: "신", 무: "미",
  기: "신", 경: "술", 신: "해", 임: "축", 계: "인",
};

/** 암록 — 일간의 녹과 육합하는 자리 */
const AMROK: Record<Stem, Branch> = {
  갑: "해", 을: "술", 병: "신", 정: "미", 무: "신",
  기: "미", 경: "사", 신: "진", 임: "인", 계: "축",
};

/** 건록 — 일간이 제 힘을 온전히 쓰는 자리 */
const GEONROK: Record<Stem, Branch> = {
  갑: "인", 을: "묘", 병: "사", 정: "오", 무: "사",
  기: "오", 경: "신", 신: "유", 임: "해", 계: "자",
};

/** 천주귀인 — 먹을 복 */
const CHEONJU: Record<Stem, Branch> = {
  갑: "사", 을: "오", 병: "사", 정: "오", 무: "신",
  기: "유", 경: "해", 신: "자", 임: "인", 계: "묘",
};

/** 관귀학관 — 벼슬길에 오르는 자리 */
const GWANGWI: Record<Stem, Branch> = {
  갑: "사", 을: "사", 병: "신", 정: "신", 무: "해",
  기: "해", 경: "인", 신: "인", 임: "신", 계: "신",
};

/** 재고귀인 — 재물을 쌓아 두는 창고 */
const JAEGO: Record<Stem, Branch> = {
  갑: "진", 을: "진", 병: "축", 정: "축", 무: "축",
  기: "축", 경: "미", 신: "미", 임: "술", 계: "술",
};

/** 천관귀인 */
const CHEONGWAN: Record<Stem, Branch> = {
  갑: "미", 을: "진", 병: "사", 정: "유", 무: "술",
  기: "묘", 경: "해", 신: "인", 임: "오", 계: "축",
};

/** 천의귀인 — 월지 기준. 의약·활인의 자리 */
const CHEONUI: Record<Branch, Branch> = {
  자: "해", 축: "자", 인: "축", 묘: "인", 진: "묘", 사: "진",
  오: "사", 미: "오", 신: "미", 유: "신", 술: "유", 해: "술",
};

// ─── 흉살 ────────────────────────────────────────────────────────────────────

/** 괴강살 — 일주가 이 넷이면 성립 */
const GOEGANG = ["경진", "경술", "임진", "무술"] as const;

/** 백호살 — 피를 보는 자리로 읽는 일곱 간지 */
const BAEKHO = ["갑진", "을미", "병술", "정축", "무진", "임술", "계축"] as const;

/** 현침살 — 획이 바늘처럼 날카로운 글자 */
const HYEONCHIM_STEMS: readonly Stem[] = ["갑", "신"];
const HYEONCHIM_BRANCHES: readonly Branch[] = ["묘", "오", "신", "미"];

/** 양인살 — 일간의 녹 다음 자리. 양간에만 본다 */
const YANGIN: Partial<Record<Stem, Branch>> = {
  갑: "묘", 병: "오", 무: "오", 경: "유", 임: "자",
};

/** 비인살 — 양인의 충 */
const BIIN: Partial<Record<Stem, Branch>> = {
  갑: "유", 병: "자", 무: "자", 경: "묘", 임: "오",
};

/** 원진살 — 서로 미워하는 짝 */
const WONJIN: ReadonlyArray<readonly [Branch, Branch]> = [
  ["자", "미"], ["축", "오"], ["인", "유"], ["묘", "신"], ["진", "해"], ["사", "술"],
];

/** 귀문관살 — 예민함이 극에 달하는 짝 */
const GWIMUN: ReadonlyArray<readonly [Branch, Branch]> = [
  ["자", "유"], ["축", "오"], ["인", "미"], ["묘", "신"], ["진", "해"], ["사", "술"],
];

/** 탕화살 — 일지 기준 */
const TANGHWA: Partial<Record<Branch, readonly Branch[]>> = {
  인: ["사", "신", "인"],
  오: ["오", "축", "진"],
  축: ["오", "미", "술"],
};

/** 고신살 — 년지 기준, 홀로 되기 쉬운 자리 */
const GOSIN: Record<Branch, Branch> = {
  해: "인", 자: "인", 축: "인",
  인: "사", 묘: "사", 진: "사",
  사: "신", 오: "신", 미: "신",
  신: "해", 유: "해", 술: "해",
};

/** 과숙살 — 년지 기준 */
const GWASUK: Record<Branch, Branch> = {
  해: "술", 자: "술", 축: "술",
  인: "축", 묘: "축", 진: "축",
  사: "진", 오: "진", 미: "진",
  신: "미", 유: "미", 술: "미",
};

/** 급각살 — 월지 계절 기준 */
const GEUPGAK: ReadonlyArray<{ months: readonly Branch[]; hits: readonly Branch[] }> = [
  { months: ["인", "묘", "진"], hits: ["해", "자"] },
  { months: ["사", "오", "미"], hits: ["묘", "미"] },
  { months: ["신", "유", "술"], hits: ["인", "술"] },
  { months: ["해", "자", "축"], hits: ["축", "진"] },
];

/** 낙정관살 — 일간 기준, 물·구덩이에 빠지는 자리 */
const NAKJEONG: Record<Stem, Branch> = {
  갑: "사", 을: "자", 병: "신", 정: "술", 무: "묘",
  기: "사", 경: "자", 신: "신", 임: "술", 계: "묘",
};

/** 유하살 — 년간 기준 */
const YUHA: Record<Stem, Branch> = {
  갑: "유", 을: "술", 병: "미", 정: "신", 무: "사",
  기: "오", 경: "진", 신: "묘", 임: "해", 계: "인",
};

/** 홍염살 — 은근한 매력 */
const HONGYEOM: Record<Stem, Branch> = {
  갑: "오", 을: "오", 병: "인", 정: "미", 무: "진",
  기: "진", 경: "술", 신: "유", 임: "자", 계: "신",
};

/** 천문성 — 영적 감각이 열린 자리 */
const CHEONMUN: readonly Branch[] = ["묘", "미", "술", "해"];

/** 협록 — 일간의 녹을 양옆에서 끼고 있는 자리 */
const HYEOPROK: Record<Stem, readonly Branch[]> = {
  갑: ["축", "묘"], 을: ["인", "진"], 병: ["진", "오"], 정: ["사", "미"],
  무: ["진", "오"], 기: ["사", "미"], 경: ["미", "유"], 신: ["신", "술"],
  임: ["술", "자"], 계: ["해", "축"],
};

// ─── 공망 ────────────────────────────────────────────────────────────────────

/** 일주가 속한 순(旬)에서 빠진 두 지지 */
export function voidBranches(dayStem: Stem, dayBranch: Branch): Branch[] {
  const s = STEMS.indexOf(dayStem);
  const b = BRANCHES.indexOf(dayBranch);
  let index = -1;
  for (let i = 0; i < 60; i += 1) {
    if (i % 10 === s && i % 12 === b) {
      index = i;
      break;
    }
  }
  if (index < 0) throw new Error(`[manse] 존재하지 않는 간지: ${dayStem}${dayBranch}`);
  const headBranch = (b - s + 12) % 12; // 순의 첫 간지가 가진 지지
  return [BRANCHES[(headBranch + 10) % 12]!, BRANCHES[(headBranch + 11) % 12]!];
}

// ─── 판정 ────────────────────────────────────────────────────────────────────

export function computeSinsal(pillars: FourPillars): SinsalHit[] {
  const list = pillarsOf(pillars);
  const dayStem = pillars.day.stem as Stem;
  const dayBranch = pillars.day.branch as Branch;
  const yearStem = pillars.year.stem as Stem;
  const yearBranch = pillars.year.branch as Branch;
  const monthBranch = pillars.month.branch as Branch;

  const hits = new Map<string, { group: SinsalGroup; positions: Set<string> }>();
  const add = (name: string, group: SinsalGroup, position: string) => {
    if (!hits.has(name)) hits.set(name, { group, positions: new Set() });
    hits.get(name)!.positions.add(position);
  };

  // 십이신살 — 년지·일지 두 축
  for (const base of [yearBranch, dayBranch]) {
    for (const { slot, pillar } of list) {
      if (!pillar) continue;
      add(twelveSinsalOf(base, pillar.branch as Branch), "십이신살", `${slot}지`);
    }
  }

  const branchAt = (branch: Branch, slot: PillarSlot) => `${slot}지`;

  for (const { slot, pillar } of list) {
    if (!pillar) continue;
    const branch = pillar.branch as Branch;
    const stem = pillar.stem as Stem;

    // 일간 기준 길신
    if (CHEONEUL[dayStem].includes(branch)) add("천을귀인", "길신", branchAt(branch, slot));
    if (MUNCHANG[dayStem] === branch) add("문창귀인", "길신", branchAt(branch, slot));
    if (HAKDANG[dayStem] === branch) add("학당귀인", "길신", branchAt(branch, slot));
    if (MUNGOK[dayStem] === branch) add("문곡귀인", "길신", branchAt(branch, slot));
    if (GEUMYEO[dayStem] === branch) add("금여", "길신", branchAt(branch, slot));
    if (AMROK[dayStem] === branch) add("암록", "길신", branchAt(branch, slot));
    if (GEONROK[dayStem] === branch) add("건록", "길신", branchAt(branch, slot));
    if (CHEONJU[dayStem] === branch) add("천주귀인", "길신", branchAt(branch, slot));
    if (GWANGWI[dayStem] === branch) add("관귀학관", "길신", branchAt(branch, slot));
    if (JAEGO[dayStem] === branch) add("재고귀인", "길신", branchAt(branch, slot));
    if (CHEONGWAN[dayStem] === branch) add("천관귀인", "길신", branchAt(branch, slot));
    if (HYEOPROK[dayStem].includes(branch)) add("협록", "길신", branchAt(branch, slot));
    if (HONGYEOM[dayStem] === branch) add("홍염살", "길신", branchAt(branch, slot));
    if (CHEONMUN.includes(branch)) add("천문성", "길신", branchAt(branch, slot));
    if (CHEONUI[monthBranch] === branch) add("천의귀인", "길신", branchAt(branch, slot));

    // 흉살
    if (YANGIN[dayStem] === branch) add("양인살", "흉살", branchAt(branch, slot));
    if (BIIN[dayStem] === branch) add("비인살", "흉살", branchAt(branch, slot));
    if (NAKJEONG[dayStem] === branch) add("낙정관살", "흉살", branchAt(branch, slot));
    if (YUHA[yearStem] === branch) add("유하살", "흉살", branchAt(branch, slot));
    if (GOSIN[yearBranch] === branch) add("고신살", "흉살", branchAt(branch, slot));
    if (GWASUK[yearBranch] === branch) add("과숙살", "흉살", branchAt(branch, slot));
    if ((TANGHWA[dayBranch] ?? []).includes(branch)) add("탕화살", "흉살", branchAt(branch, slot));

    const geupgak = GEUPGAK.find((g) => g.months.includes(monthBranch));
    if (geupgak?.hits.includes(branch)) add("급각살", "흉살", branchAt(branch, slot));

    // 일주 자체로 보는 것
    if (slot === "일") {
      if (GOEGANG.includes(pillar.full as (typeof GOEGANG)[number])) add("괴강살", "흉살", "일주");
      if (BAEKHO.includes(pillar.full as (typeof BAEKHO)[number])) add("백호살", "흉살", "일주");
    }
    if (HYEONCHIM_STEMS.includes(stem) || HYEONCHIM_BRANCHES.includes(branch)) {
      add("현침살", "흉살", `${slot}주`);
    }

    // 관계로 보는 것 — 다른 자리와 짝이 맞는지
    for (const other of list) {
      if (!other.pillar || other.slot === slot) continue;
      const pair = [branch, other.pillar.branch as Branch];
      if (WONJIN.some(([a, b]) => (a === pair[0] && b === pair[1]) || (a === pair[1] && b === pair[0]))) {
        add("원진살", "흉살", branchAt(branch, slot));
      }
      if (GWIMUN.some(([a, b]) => (a === pair[0] && b === pair[1]) || (a === pair[1] && b === pair[0]))) {
        add("귀문살", "흉살", branchAt(branch, slot));
      }
    }
  }

  // 공망 — 일주 기준으로 비는 자리가 원국에 있는가
  const voids = voidBranches(dayStem, dayBranch);
  for (const { slot, pillar } of list) {
    if (!pillar) continue;
    if (voids.includes(pillar.branch as Branch)) add("공망", "흉살", `${slot}지`);
  }

  const order: SinsalGroup[] = ["길신", "십이신살", "흉살"];
  return Array.from(hits.entries())
    .map(([name, info]) => ({
      name,
      group: info.group,
      positions: SLOTS.flatMap((s) => Array.from(info.positions).filter((p) => p.startsWith(s))),
    }))
    .sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group) || a.name.localeCompare(b.name));
}
