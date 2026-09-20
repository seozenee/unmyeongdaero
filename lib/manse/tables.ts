// 명리 기본 대조표. 계산에만 쓰이고 해석 문장은 담지 않는다.
// (해석은 계산된 사실을 근거로 AI 가 쓴다)

export type Stem = "갑" | "을" | "병" | "정" | "무" | "기" | "경" | "신" | "임" | "계";
export type Branch = "자" | "축" | "인" | "묘" | "진" | "사" | "오" | "미" | "신" | "유" | "술" | "해";
export type Element = "목" | "화" | "토" | "금" | "수";
export type Polarity = "양" | "음";

export const STEMS: readonly Stem[] = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
export const BRANCHES: readonly Branch[] = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];

export const STEM_HANJA: Record<Stem, string> = {
  갑: "甲", 을: "乙", 병: "丙", 정: "丁", 무: "戊",
  기: "己", 경: "庚", 신: "辛", 임: "壬", 계: "癸",
};

export const BRANCH_HANJA: Record<Branch, string> = {
  자: "子", 축: "丑", 인: "寅", 묘: "卯", 진: "辰", 사: "巳",
  오: "午", 미: "未", 신: "申", 유: "酉", 술: "戌", 해: "亥",
};

export const STEM_ELEMENT: Record<Stem, Element> = {
  갑: "목", 을: "목", 병: "화", 정: "화", 무: "토",
  기: "토", 경: "금", 신: "금", 임: "수", 계: "수",
};

export const BRANCH_ELEMENT: Record<Branch, Element> = {
  자: "수", 축: "토", 인: "목", 묘: "목", 진: "토", 사: "화",
  오: "화", 미: "토", 신: "금", 유: "금", 술: "토", 해: "수",
};

/** 천간의 음양 — 순서상 짝수번째(갑·병·무·경·임)가 양 */
export const STEM_POLARITY: Record<Stem, Polarity> = {
  갑: "양", 을: "음", 병: "양", 정: "음", 무: "양",
  기: "음", 경: "양", 신: "음", 임: "양", 계: "음",
};

export const BRANCH_POLARITY: Record<Branch, Polarity> = {
  자: "양", 축: "음", 인: "양", 묘: "음", 진: "양", 사: "음",
  오: "양", 미: "음", 신: "양", 유: "음", 술: "양", 해: "음",
};

/** 오행 상생: 목→화→토→금→수→목 */
export const GENERATES: Record<Element, Element> = { 목: "화", 화: "토", 토: "금", 금: "수", 수: "목" };

/** 오행 상극: 목→토→수→화→금→목 */
export const OVERCOMES: Record<Element, Element> = { 목: "토", 토: "수", 수: "화", 화: "금", 금: "목" };

/** 지장간 — 지지 속에 숨은 천간. 여기(餘氣)·중기(中氣)·정기(正氣) 순. */
export const HIDDEN_STEMS: Record<Branch, readonly Stem[]> = {
  자: ["임", "계"],
  축: ["계", "신", "기"],
  인: ["무", "병", "갑"],
  묘: ["갑", "을"],
  진: ["을", "계", "무"],
  사: ["무", "경", "병"],
  오: ["병", "기", "정"],
  미: ["정", "을", "기"],
  신: ["무", "임", "경"],
  유: ["경", "신"],
  술: ["신", "정", "무"],
  해: ["무", "갑", "임"],
};

/** 지지 삼합 — 세 글자가 모여 하나의 오행으로 뭉친다 */
export const THREE_HARMONY: ReadonlyArray<{ branches: readonly Branch[]; element: Element }> = [
  { branches: ["신", "자", "진"], element: "수" },
  { branches: ["해", "묘", "미"], element: "목" },
  { branches: ["인", "오", "술"], element: "화" },
  { branches: ["사", "유", "축"], element: "금" },
];

/** 지지 육합 */
export const SIX_HARMONY: ReadonlyArray<readonly [Branch, Branch]> = [
  ["자", "축"], ["인", "해"], ["묘", "술"], ["진", "유"], ["사", "신"], ["오", "미"],
];

/** 지지 충 — 마주 보는 자리끼리 부딪힌다 */
export const SIX_CLASH: ReadonlyArray<readonly [Branch, Branch]> = [
  ["자", "오"], ["축", "미"], ["인", "신"], ["묘", "유"], ["진", "술"], ["사", "해"],
];

/** 천간합 — 두 글자가 만나 새 오행으로 화한다 */
export const STEM_HARMONY: ReadonlyArray<{ pair: readonly [Stem, Stem]; element: Element }> = [
  { pair: ["갑", "기"], element: "토" },
  { pair: ["을", "경"], element: "금" },
  { pair: ["병", "신"], element: "수" },
  { pair: ["정", "임"], element: "목" },
  { pair: ["무", "계"], element: "화" },
];

/** 지지 형(刑) */
export const PUNISHMENT: ReadonlyArray<readonly Branch[]> = [
  ["인", "사", "신"],
  ["축", "술", "미"],
  ["자", "묘"],
  ["진"], ["오"], ["유"], ["해"], // 자형
];

/** 지지 해(害) */
export const HARM: ReadonlyArray<readonly [Branch, Branch]> = [
  ["자", "미"], ["축", "오"], ["인", "사"], ["묘", "진"], ["신", "해"], ["유", "술"],
];

/** 지지 파(破) */
export const DESTRUCTION: ReadonlyArray<readonly [Branch, Branch]> = [
  ["자", "유"], ["축", "진"], ["인", "해"], ["묘", "오"], ["사", "신"], ["미", "술"],
];

/** 십이운성 — 일간이 각 지지에서 갖는 기운의 세기 */
export const TWELVE_STAGES = [
  "장생", "목욕", "관대", "건록", "제왕", "쇠", "병", "사", "묘", "절", "태", "양",
] as const;
export type TwelveStage = (typeof TWELVE_STAGES)[number];

/** 십이운성의 시작점(장생) 지지. 양간은 순행, 음간은 역행한다. */
const STAGE_ORIGIN: Record<Stem, Branch> = {
  갑: "해", 병: "인", 무: "인", 경: "사", 임: "신",
  을: "오", 정: "유", 기: "유", 신: "자", 계: "묘",
};

export function twelveStage(dayStem: Stem, branch: Branch): TwelveStage {
  const origin = STAGE_ORIGIN[dayStem];
  const start = BRANCHES.indexOf(origin);
  const target = BRANCHES.indexOf(branch);
  const forward = STEM_POLARITY[dayStem] === "양";
  const distance = forward ? (target - start + 12) % 12 : (start - target + 12) % 12;
  return TWELVE_STAGES[distance]!;
}

/** 십성 — 일간과 다른 글자의 관계 */
export const TEN_GODS = [
  "비견", "겁재", "식신", "상관", "편재", "정재", "편관", "정관", "편인", "정인",
] as const;
export type TenGod = (typeof TEN_GODS)[number];

export function tenGod(dayStem: Stem, other: Stem): TenGod {
  const me = STEM_ELEMENT[dayStem];
  const target = STEM_ELEMENT[other];
  const sameParity = STEM_POLARITY[dayStem] === STEM_POLARITY[other];

  if (me === target) return sameParity ? "비견" : "겁재";
  if (GENERATES[me] === target) return sameParity ? "식신" : "상관";
  if (OVERCOMES[me] === target) return sameParity ? "편재" : "정재";
  if (OVERCOMES[target] === me) return sameParity ? "편관" : "정관";
  return sameParity ? "편인" : "정인"; // target 이 me 를 생하는 경우
}

/**
 * 지지의 십성.
 * 오행은 지장간의 정기(正氣)에서 가져오되, 음양은 지지 자체를 따른다.
 * (예: 일간 병[양] + 지지 사[음] — 정기가 병이라 같은 화지만 음양이 달라 겁재)
 */
export function branchTenGod(dayStem: Stem, branch: Branch): TenGod {
  const mainHidden = HIDDEN_STEMS[branch].at(-1)!;
  const me = STEM_ELEMENT[dayStem];
  const target = STEM_ELEMENT[mainHidden];
  const sameParity = STEM_POLARITY[dayStem] === BRANCH_POLARITY[branch];

  if (me === target) return sameParity ? "비견" : "겁재";
  if (GENERATES[me] === target) return sameParity ? "식신" : "상관";
  if (OVERCOMES[me] === target) return sameParity ? "편재" : "정재";
  if (OVERCOMES[target] === me) return sameParity ? "편관" : "정관";
  return sameParity ? "편인" : "정인";
}

/** 납음오행 — 60갑자를 두 칸씩 묶어 부르는 이름 */
const NAEUM = [
  "해중금", "노중화", "대림목", "노방토", "검봉금", "산두화", "간하수", "성두토", "백랍금", "양류목",
  "천중수", "옥상토", "벽력화", "송백목", "장류수", "사중금", "산하화", "평지목", "벽상토", "금박금",
  "복등화", "천하수", "대역토", "차천금", "상자목", "대계수", "사중토", "천상화", "석류목", "대해수",
] as const;

export function naeum(stem: Stem, branch: Branch): string {
  const s = STEMS.indexOf(stem);
  const b = BRANCHES.indexOf(branch);
  // 60갑자 순번: 천간 10 · 지지 12 의 최소공배수 주기
  let index = -1;
  for (let i = 0; i < 60; i += 1) {
    if (i % 10 === s && i % 12 === b) {
      index = i;
      break;
    }
  }
  if (index < 0) throw new Error(`[manse] 존재하지 않는 간지: ${stem}${branch}`);
  return NAEUM[Math.floor(index / 2)]!;
}
