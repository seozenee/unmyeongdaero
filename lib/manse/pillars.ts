// 생년월일시 → 사주 네 기둥.
//
// 천문·달력 계산(절기 시각, 음↔양력 변환, 60갑자)은 검증된 lunar-typescript 에 맡기고,
// 한국 명리 관행에 맞추는 부분만 여기서 처리한다.
//
// 맞춰야 하는 것이 셋 있다.
//  1) 절기 시각: 라이브러리는 중국시(UTC+8) 기준으로 절기를 비교한다.
//     한국시로 태어난 사람은 1시간을 빼서 넘겨야 연주·월주 경계가 맞는다.
//  2) 진태양시: 시계 시각이 아니라 태양 위치로 시주를 정한다(서울 기준 약 -32분).
//  3) 야자시: 23시부터 다음 날로 넘긴다(한국 만세력 다수 관행).
import { Lunar, Solar } from "lunar-typescript";
import { cityInfo } from "./cities";
import { koreanClock } from "./korea-time";

export interface BirthInput {
  year: number;
  month: number;
  day: number;
  /** null 이면 시간 미상 — 시주를 만들지 않는다 */
  hour: number | null;
  minute?: number;
  isLunar?: boolean;
  /** 음력이면서 윤달인 경우 */
  isLeapMonth?: boolean;
  city?: string;
  /** 진태양시 보정 사용 여부. 기본값 true(한국 만세력 관행) */
  useTrueSolarTime?: boolean;
}

export interface Pillar {
  /** 한글 간지 (예: "병인") */
  full: string;
  /** 천간 한글 */
  stem: string;
  /** 지지 한글 */
  branch: string;
  /** 한자 간지 (예: "丙寅") */
  hanja: string;
}

export interface FourPillars {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  /** 출생 시간을 모르면 null */
  hour: Pillar | null;
}

const STEM_KO: Record<string, string> = {
  甲: "갑", 乙: "을", 丙: "병", 丁: "정", 戊: "무",
  己: "기", 庚: "경", 辛: "신", 壬: "임", 癸: "계",
};

const BRANCH_KO: Record<string, string> = {
  子: "자", 丑: "축", 寅: "인", 卯: "묘", 辰: "진", 巳: "사",
  午: "오", 未: "미", 申: "신", 酉: "유", 戌: "술", 亥: "해",
};

function toPillar(ganzhi: string): Pillar {
  const stemHanja = ganzhi[0]!;
  const branchHanja = ganzhi[1]!;
  const stem = STEM_KO[stemHanja] ?? stemHanja;
  const branch = BRANCH_KO[branchHanja] ?? branchHanja;
  return { full: stem + branch, stem, branch, hanja: ganzhi };
}

/** 분 단위로 더한 날짜·시각을 돌려준다 (달력 경계를 넘어가도 안전하게) */
function shiftMinutes(year: number, month: number, day: number, hour: number, minute: number, delta: number) {
  const base = Date.UTC(year, month - 1, day, hour, minute) + delta * 60_000;
  const d = new Date(base);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
  };
}

/**
 * 입력을 양력 시각으로 정규화한다.
 * 음력이면 양력으로 바꾸고, 시간 미상이면 정오로 둔다(연·월·일주에는 영향이 없다).
 */
function toSolarDateTime(input: BirthInput) {
  const minute = input.minute ?? 0;
  const hour = input.hour ?? 12;

  if (!input.isLunar) {
    return { year: input.year, month: input.month, day: input.day, hour, minute };
  }

  // lunar-typescript 는 윤달을 음수 월로 표기한다
  const month = input.isLeapMonth ? -input.month : input.month;
  const solar = Lunar.fromYmdHms(input.year, month, input.day, hour, minute, 0).getSolar();
  return { year: solar.getYear(), month: solar.getMonth(), day: solar.getDay(), hour, minute };
}

export interface PillarsResult extends FourPillars {
  /** 계산에 쓰인 값들 — 화면과 프롬프트에서 근거로 보여 준다 */
  basis: {
    solarDate: string;
    clockTime: string | null;
    trueSolarTime: string | null;
    solarTimeOffsetMinutes: number;
    /** 그때 쓰던 표준자오선(동경, 도) */
    standardMeridian: number;
    /** 서머타임이 돌던 해에 태어났는가 */
    summerTime: boolean;
    city: string;
    dayChangedByNightZi: boolean;
  };
}

export function computeFourPillars(input: BirthInput): PillarsResult {
  const city = cityInfo(input.city);
  const useTrue = input.useTrueSolarTime !== false;

  const solar = toSolarDateTime(input);

  // 시계가 가리키던 기준은 역사적으로 바뀌었다. 지금 기준(동경 135도)만 놓고 계산하면
  // 1954~1961년생과 서머타임 해(1948~51·1955~60·1987~88)의 시주가 통째로 틀린다.
  // 한국 바깥에서 태어난 경우에는 그 지역의 표준시를 그대로 쓴다.
  const inKorea = city.utcOffset === 9 || city.utcOffset === 8.5;
  const clock = inKorea ? koreanClock(solar.year, solar.month, solar.day) : null;
  const meridian = clock ? clock.meridian : city.utcOffset * 15;
  const dstMinutes = clock ? clock.dstMinutes : 0;

  // 진태양시 = (출생지 경도 − 그때의 표준자오선) × 4분. 서머타임이면 한 시간을 먼저 뺀다.
  const offset = (useTrue ? (city.longitude - meridian) * 4 : 0) + dstMinutes;

  // 진태양시로 옮긴 시각 — 일주·시주의 기준이 된다
  const trueTime = shiftMinutes(solar.year, solar.month, solar.day, solar.hour, solar.minute, offset);

  // 절기 경계는 중국시 기준이므로, 지역 표준시와의 차이만큼 당겨서 넘긴다
  const toChina = (meridian / 15 - 8) * 60;
  const forTerms = shiftMinutes(trueTime.year, trueTime.month, trueTime.day, trueTime.hour, trueTime.minute, -toChina);

  const termLunar = Solar.fromYmdHms(forTerms.year, forTerms.month, forTerms.day, forTerms.hour, forTerms.minute, 0).getLunar();
  const localLunar = Solar.fromYmdHms(trueTime.year, trueTime.month, trueTime.day, trueTime.hour, trueTime.minute, 0).getLunar();

  // 연주·월주는 절기로 갈리고, 일주·시주는 현지 시각으로 갈린다
  const year = toPillar(termLunar.getYearInGanZhiExact());
  const month = toPillar(termLunar.getMonthInGanZhiExact());
  const day = toPillar(localLunar.getDayInGanZhiExact());
  const hour = input.hour === null ? null : toPillar(localLunar.getTimeInGanZhi());

  const pad = (n: number) => String(n).padStart(2, "0");
  const dayChanged = localLunar.getSolar().getDay() !== trueTime.day;

  return {
    year,
    month,
    day,
    hour,
    basis: {
      solarDate: `${solar.year}-${pad(solar.month)}-${pad(solar.day)}`,
      clockTime: input.hour === null ? null : `${pad(solar.hour)}:${pad(solar.minute)}`,
      trueSolarTime: input.hour === null ? null : `${pad(trueTime.hour)}:${pad(trueTime.minute)}`,
      solarTimeOffsetMinutes: Math.round(offset),
      standardMeridian: meridian,
      summerTime: dstMinutes !== 0,
      city: input.city ?? "서울",
      dayChangedByNightZi: dayChanged,
    },
  };
}
