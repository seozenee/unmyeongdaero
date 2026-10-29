// 대운 — 10년 단위로 바뀌는 큰 흐름.
//
// 세 가지를 정해야 한다.
//  1) 방향: 양남·음녀는 순행, 음남·양녀는 역행
//  2) 시작 나이: 태어난 날부터 기준 절기까지의 거리를 3일 = 1년으로 환산
//  3) 간지: 월주에서 방향대로 한 칸씩 옮겨 간다
//
// 절기는 24절기 가운데 '절(節)' 12개만 쓴다. 중기(中氣)는 대운을 가르지 않는다.
import { Solar } from "lunar-typescript";
import { koreanClock } from "./korea-time";
import type { FourPillars } from "./pillars";
import { BRANCHES, STEM_POLARITY, STEMS, type Branch, type Stem } from "./tables";

// 대운을 가르는 12절(節). 중기(中氣)는 대운을 가르지 않으므로 넣지 않는다.
//
// 절기표의 키는 두 가지 형태로 온다.
//  - 해당 해의 절기는 간체자 (예: 芒种, 惊蛰)
//  - 다음 해로 넘어가는 절기는 로마자 (예: LI_CHUN, XIAO_HAN)
// 둘 다 같은 절기를 가리키므로 함께 등록한다.
const TERM_KO = new Map<string, string>([
  ["立春", "입춘"], ["LI_CHUN", "입춘"],
  ["惊蛰", "경칩"], ["JING_ZHE", "경칩"],
  ["清明", "청명"], ["QING_MING", "청명"],
  ["立夏", "입하"], ["LI_XIA", "입하"],
  ["芒种", "망종"], ["MANG_ZHONG", "망종"],
  ["小暑", "소서"], ["XIAO_SHU", "소서"],
  ["立秋", "입추"], ["LI_QIU", "입추"],
  ["白露", "백로"], ["BAI_LU", "백로"],
  ["寒露", "한로"], ["HAN_LU", "한로"],
  ["立冬", "입동"], ["LI_DONG", "입동"],
  ["大雪", "대설"], ["DA_XUE", "대설"],
  ["小寒", "소한"], ["XIAO_HAN", "소한"],
]);

export interface DecadeItem {
  startAge: number;
  full: string;
  startYear: number;
}

export interface DecadeResult {
  direction: "순행" | "역행";
  startAge: number;
  /** 시작 나이의 근거가 된 절기 */
  basisTerm: string;
  /** 그 절기까지 걸린 날수 (소수점 포함) */
  basisDays: number;
  items: DecadeItem[];
}

/** 해당 시각 주변의 12절 목록을 빠른 순서로 모은다 */
function majorTermsAround(year: number): Array<{ ko: string; time: number }> {
  const found: Array<{ ko: string; time: number }> = [];

  // 절기표는 해가 바뀌는 근처에서 잘리므로 앞뒤 해까지 훑는다
  for (const y of [year - 1, year, year + 1]) {
    const table = Solar.fromYmd(y, 6, 1).getLunar().getJieQiTable();
    for (const [hanja, solar] of Object.entries(table)) {
      const ko = TERM_KO.get(hanja);
      if (!ko || !solar) continue;
      const time = Date.UTC(solar.getYear(), solar.getMonth() - 1, solar.getDay(), solar.getHour(), solar.getMinute());
      found.push({ ko, time });
    }
  }

  found.sort((a, b) => a.time - b.time);
  // 같은 절기가 여러 해에서 중복으로 잡히므로 걸러 낸다
  return found.filter((item, index) => index === 0 || item.time !== found[index - 1]!.time);
}

export interface DecadeInput {
  pillars: FourPillars;
  /**
   * 양력 기준 생년월일시 (진태양시 보정 이전의 현지 시각).
   * 시간을 모르면 hour 를 null 로 둔다 — 자정 기준으로 절기까지의 거리를 잰다.
   */
  birth: { year: number; month: number; day: number; hour: number | null; minute?: number };
  isFemale: boolean;
  /** 만들 대운 개수. 기본 9칸 — 시작 나이에 따라 아흔 몇 살까지 덮는다 */
  count?: number;
}

export function computeDecadeFortune(input: DecadeInput): DecadeResult {
  const { pillars, birth, isFemale } = input;
  const count = input.count ?? 9;

  // 1) 방향 — 연간의 음양과 성별이 같은 편이면 순행
  const yearPolarity = STEM_POLARITY[pillars.year.stem as Stem];
  const forward = (yearPolarity === "양") !== isFemale;
  const direction: "순행" | "역행" = forward ? "순행" : "역행";

  // 2) 시작 나이 — 절기까지의 거리를 3일 = 1년으로 환산
  //
  //    절기 시각은 중국시(동경 120도) 기준이므로 출생 시각을 같은 기준으로 옮긴다.
  //    한동안 무조건 한 시간을 뺐는데, 그건 지금의 한국 표준시(동경 135도)만 맞는 값이다.
  //    1954-03-21 ~ 1961-08-09 에는 동경 127.5도를 써서 차이가 30분이었고, 서머타임이
  //    돌던 해에는 적힌 시각 자체가 한 시간 앞서 있다. 둘을 빼먹으면 대운수가 한 살
  //    어긋나는 자리가 생긴다.
  const clock = koreanClock(birth.year, birth.month, birth.day);
  const toChinaMinutes = clock.meridian / 15 - 8; // 지금은 1시간, 1954~61 은 30분
  const birthUtc =
    Date.UTC(birth.year, birth.month - 1, birth.day, birth.hour ?? 0, birth.minute ?? 0) +
    clock.dstMinutes * 60_000 -
    toChinaMinutes * 60 * 60_000;
  const terms = majorTermsAround(birth.year);

  const target = forward
    ? terms.find((t) => t.time > birthUtc)
    : [...terms].reverse().find((t) => t.time <= birthUtc);

  if (!target) throw new Error("[manse] 대운 기준 절기를 찾지 못했습니다");

  const basisDays = Math.abs(target.time - birthUtc) / 86_400_000;
  const startAge = Math.max(1, Math.round(basisDays / 3));

  // 3) 간지 — 월주에서 방향대로 옮긴다
  const stemIndex = STEMS.indexOf(pillars.month.stem as Stem);
  const branchIndex = BRANCHES.indexOf(pillars.month.branch as Branch);
  const step = forward ? 1 : -1;

  const items: DecadeItem[] = Array.from({ length: count }, (_, i) => {
    const move = step * (i + 1);
    const stem = STEMS[(((stemIndex + move) % 10) + 10) % 10]!;
    const branch = BRANCHES[(((branchIndex + move) % 12) + 12) % 12]!;
    return {
      startAge: startAge + i * 10,
      full: stem + branch,
      startYear: birth.year + startAge + i * 10,
    };
  });

  return {
    direction,
    startAge,
    basisTerm: target.ko,
    basisDays: Math.round(basisDays * 100) / 100,
    items,
  };
}
