// 흘러 들어오는 운 — 세운(한 해)과 월운(한 달).
//
// 대운이 십 년 단위의 큰 결이라면, 세운·월운은 그 안에서 해와 달을 나눈다.
// 계산 자체는 단순하다. 그 해·그 달의 간지를 구하고, 일간을 기준으로 십성과 십이운성을 붙이고,
// 원국과 어떤 관계를 맺는지 본다.
//
// 까다로운 건 달력과 절기가 어긋난다는 점이다. 10월 1일은 아직 유월(酉月)이고
// 한로(8일쯤)가 지나야 술월(戌月)이 된다. 달력의 한 달은 늘 두 월주에 걸쳐 있으므로,
// 절입 뒤의 월주를 그 달의 이름으로 삼되 앞부분(firstHalf)도 함께 남긴다.
import { Solar } from "lunar-typescript";
import { incomingRelations, type Relation } from "./relations";
import type { FourPillars } from "./pillars";
import {
  BRANCH_ELEMENT,
  BRANCH_HANJA,
  DIRECTIONAL_HARMONY,
  STEM_ELEMENT,
  STEM_HANJA,
  branchTenGod,
  tenGod,
  twelveStage,
  type Branch,
  type Element,
  type Stem,
  type TenGod,
  type TwelveStage,
} from "./tables";

const STEM_KO: Record<string, Stem> = {
  甲: "갑", 乙: "을", 丙: "병", 丁: "정", 戊: "무",
  己: "기", 庚: "경", 辛: "신", 壬: "임", 癸: "계",
};
const BRANCH_KO: Record<string, Branch> = {
  子: "자", 丑: "축", 寅: "인", 卯: "묘", 辰: "진", 巳: "사",
  午: "오", 未: "미", 申: "신", 酉: "유", 戌: "술", 亥: "해",
};

// ─── 결을 옮기는 말 ──────────────────────────────────────────────────────────

/** 십성이 한 해·한 달로 들어올 때의 결 */
const TEN_GOD_FLAVOR: Record<TenGod, { keyword: string; incoming: string }> = {
  비견: { keyword: "자립", incoming: "내 힘으로 밀고 나가는" },
  겁재: { keyword: "경쟁", incoming: "사람과 어깨를 겨루게 되는" },
  식신: { keyword: "표현", incoming: "만들고 내보내는 일이 늘어나는" },
  상관: { keyword: "재능", incoming: "재능이 드러나되 말이 앞서기 쉬운" },
  편재: { keyword: "기회", incoming: "큰 기회와 변동이 함께 오는" },
  정재: { keyword: "성실", incoming: "쌓아 온 만큼 돌아오는" },
  편관: { keyword: "돌파", incoming: "밀려오는 압박을 밀어내는" },
  정관: { keyword: "책임", incoming: "자리와 책임이 주어지는" },
  편인: { keyword: "사색", incoming: "혼자 생각을 깊이 하게 되는" },
  정인: { keyword: "배움", incoming: "배우고 기대게 되는" },
};

/** 십이운성 — 일간이 그 지지에서 갖는 힘의 단계 */
const STAGE_PHASE: Record<TwelveStage, { keyword: string; phase: string }> = {
  장생: { keyword: "시작", phase: "자라는 때 — 시작과 배움에 힘이 붙는다" },
  목욕: { keyword: "흔들림", phase: "다듬는 때 — 시행착오를 겪으며 자리를 찾는다" },
  관대: { keyword: "준비", phase: "나설 채비를 하는 때 — 내놓을 것이 갖춰진다" },
  건록: { keyword: "독립", phase: "제 몫을 하는 때 — 일한 만큼 돌아온다" },
  제왕: { keyword: "절정", phase: "힘이 가장 찬 때 — 벌여 놓은 일이 앞으로 나간다" },
  쇠: { keyword: "여유", phase: "한풀 꺾이는 때 — 벌이기보다 지키는 편이 낫다" },
  병: { keyword: "돌봄", phase: "쉬어 가는 때 — 몸과 마음을 먼저 챙길 일이 생긴다" },
  사: { keyword: "정리", phase: "매듭짓는 때 — 오래 끌던 것을 마무리하게 된다" },
  묘: { keyword: "갈무리", phase: "거두어 두는 때 — 드러내기보다 안으로 쌓는다" },
  절: { keyword: "전환", phase: "끊기고 이어지는 때 — 자리를 옮길 일이 생기기 쉽다" },
  태: { keyword: "씨앗", phase: "품는 때 — 아직 보이지 않는 것이 자리를 잡는다" },
  양: { keyword: "기다림", phase: "기르는 때 — 서두르지 않을수록 단단해진다" },
};

/** 십이운성의 힘을 세 갈래로 — 타임라인의 tone 으로 쓴다 */
const STAGE_TONE: Record<TwelveStage, "good" | "neutral" | "caution"> = {
  장생: "good", 목욕: "neutral", 관대: "good", 건록: "good", 제왕: "good", 쇠: "neutral",
  병: "caution", 사: "caution", 묘: "neutral", 절: "caution", 태: "neutral", 양: "neutral",
};

function seasonOf(branch: Branch): string {
  return DIRECTIONAL_HARMONY.find((entry) => entry.branches.includes(branch))?.season ?? "";
}

// ─── 한 칸의 운 ──────────────────────────────────────────────────────────────

export interface LuckPillar {
  ganji: string;
  ganjiHan: string;
  gan: Stem;
  ji: Branch;
  ganHan: string;
  jiHan: string;
  ganElement: Element;
  jiElement: Element;
  sipseongRelation: { gan: TenGod; ji: TenGod };
  twelveFortune: { name: TwelveStage; keyword: string; phase: string; season: string };
  tone: "good" | "neutral" | "caution";
  hapChungRelations: Relation[];
  /** 한 문장으로 옮긴 결 */
  interpretation: string;
}

function luckPillar(pillars: FourPillars, gan: Stem, ji: Branch, label: string): LuckPillar {
  const dayStem = pillars.day.stem as Stem;
  const stage = twelveStage(dayStem, ji);
  const ganGod = tenGod(dayStem, gan);
  const jiGod = branchTenGod(dayStem, ji);
  return {
    ganji: `${gan}${ji}`,
    ganjiHan: `${STEM_HANJA[gan]}${BRANCH_HANJA[ji]}`,
    gan, ji,
    ganHan: STEM_HANJA[gan],
    jiHan: BRANCH_HANJA[ji],
    ganElement: STEM_ELEMENT[gan],
    jiElement: BRANCH_ELEMENT[ji],
    sipseongRelation: { gan: ganGod, ji: jiGod },
    twelveFortune: { name: stage, keyword: STAGE_PHASE[stage].keyword, phase: STAGE_PHASE[stage].phase, season: seasonOf(ji) },
    tone: STAGE_TONE[stage],
    hapChungRelations: incomingRelations(pillars, { stem: gan, branch: ji, label }),
    interpretation: `${TEN_GOD_FLAVOR[ganGod].incoming} 결 — ${STAGE_PHASE[stage].phase}`,
  };
}

// ─── 세운 ────────────────────────────────────────────────────────────────────

export interface Seun extends LuckPillar {
  year: number;
  /** 만 나이 */
  internationalAge: number;
  /** 세는나이 */
  age: number;
}

/** 그 해의 연주. 입춘 경계를 피해 한여름을 기준으로 잡는다 */
function yearGanZhi(year: number): [Stem, Branch] {
  const ganzhi = Solar.fromYmd(year, 6, 1).getLunar().getYearInGanZhiExact();
  return [STEM_KO[ganzhi[0]!]!, BRANCH_KO[ganzhi[1]!]!];
}

export function computeSeun(pillars: FourPillars, birthYear: number, year: number): Seun {
  const [gan, ji] = yearGanZhi(year);
  return {
    ...luckPillar(pillars, gan, ji, `${year} 세운`),
    year,
    internationalAge: year - birthYear,
    age: year - birthYear + 1,
  };
}

// ─── 월운 ────────────────────────────────────────────────────────────────────

export interface Weolun extends LuckPillar {
  year: number;
  month: number;
  monthLabel: string;
  monthBranchLabel: string;
  isCurrentMonth: boolean;
  /** 절입 전, 즉 이 달의 앞부분을 지배하는 월주 */
  firstHalf: { ganji: string; gan: Stem; ji: Branch; monthBranchLabel: string } | null;
}

/** 그 날짜가 속한 월주 */
function monthGanZhi(year: number, month: number, day: number): [Stem, Branch] {
  const ganzhi = Solar.fromYmd(year, month, day).getLunar().getMonthInGanZhiExact();
  return [STEM_KO[ganzhi[0]!]!, BRANCH_KO[ganzhi[1]!]!];
}

export function computeWeolun(pillars: FourPillars, year: number, month: number, now: Date): Weolun {
  // 20일이면 그 달의 절입(보통 4~8일)을 지난 뒤라, 달을 대표하는 월주가 된다
  const [gan, ji] = monthGanZhi(year, month, 20);
  // 1일은 아직 지난 절기에 속한다 — 다르면 이 달은 두 월주에 걸쳐 있다
  const [firstGan, firstJi] = monthGanZhi(year, month, 1);
  const split = firstGan !== gan || firstJi !== ji;
  return {
    ...luckPillar(pillars, gan, ji, `${year}년 ${month}월 월운`),
    year,
    month,
    monthLabel: `${year}년 ${month}월`,
    monthBranchLabel: `${ji}월(${BRANCH_HANJA[ji]}月)`,
    isCurrentMonth: now.getFullYear() === year && now.getMonth() + 1 === month,
    firstHalf: split
      ? {
          ganji: `${firstGan}${firstJi}`,
          gan: firstGan,
          ji: firstJi,
          monthBranchLabel: `${firstJi}월(${BRANCH_HANJA[firstJi]}月)`,
        }
      : null,
  };
}

// ─── 일진 ────────────────────────────────────────────────────────────────────

export interface Iljin extends LuckPillar {
  date: string;
  /** 오늘 들어온 기운이 일간에게 어떻게 닿는가 */
  toDayMaster: { stemSipseong: TenGod; branchSipseong: TenGod };
  ilju: { ganji: string };
  summary: string;
}

/** 그 날의 일주 */
function dayGanZhi(date: Date): [Stem, Branch] {
  const ganzhi = Solar.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate())
    .getLunar()
    .getDayInGanZhiExact();
  return [STEM_KO[ganzhi[0]!]!, BRANCH_KO[ganzhi[1]!]!];
}

/** 오늘 하루의 운 — 무료 '오늘의 운세'가 여기서 나온다 */
export function computeIljin(pillars: FourPillars, now = new Date()): Iljin {
  const [gan, ji] = dayGanZhi(now);
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const base = luckPillar(pillars, gan, ji, `${date} 일진`);
  const met = base.hapChungRelations[0];
  return {
    ...base,
    date,
    ilju: { ganji: base.ganji },
    toDayMaster: { stemSipseong: base.sipseongRelation.gan, branchSipseong: base.sipseongRelation.ji },
    summary: `오늘은 ${base.ganji} 일진이 들어오는 날이다. ${base.interpretation}.${
      met ? ` 원국의 ${met.targetPosition}와 ${met.type}으로 만나, ${met.meaning}.` : ""
    }`,
  };
}

// ─── 한 벌로 묶기 ────────────────────────────────────────────────────────────

export interface LuckResult {
  iljin: Iljin;
  seun: {
    previousSeun: Seun;
    currentSeun: Seun;
    nextSeun: Seun;
    /** 작년부터 여섯 해. 연도별 흐름표는 한두 해로는 그릴 수 없다. */
    years: Seun[];
  };
  weolun: {
    currentWeolun: Weolun;
    nextWeolun: Weolun;
    /** 이번 달부터 열두 달 */
    upcomingWeoluns: Weolun[];
    /** 기준 연도의 1~12월 */
    yearWeoluns: Weolun[];
  };
}

/** 세운 여섯 해와, 앞으로 열두 달의 월운 */
export function computeLuck(pillars: FourPillars, birthYear: number, now = new Date()): LuckResult {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const upcoming: Weolun[] = [];
  for (let step = 0; step < 12; step += 1) {
    const absolute = month - 1 + step;
    upcoming.push(computeWeolun(pillars, year + Math.floor(absolute / 12), (absolute % 12) + 1, now));
  }

  return {
    iljin: computeIljin(pillars, now),
    seun: {
      previousSeun: computeSeun(pillars, birthYear, year - 1),
      currentSeun: computeSeun(pillars, birthYear, year),
      nextSeun: computeSeun(pillars, birthYear, year + 1),
      years: Array.from({ length: 6 }, (_, index) => computeSeun(pillars, birthYear, year - 1 + index)),
    },
    weolun: {
      currentWeolun: upcoming[0]!,
      nextWeolun: upcoming[1]!,
      upcomingWeoluns: upcoming,
      yearWeoluns: Array.from({ length: 12 }, (_, index) => computeWeolun(pillars, year, index + 1, now)),
    },
  };
}
