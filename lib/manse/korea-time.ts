// 한국의 표준시 이력과 서머타임.
//
// 진태양시 보정은 "시계 시각"에서 출발한다. 그런데 그 시계가 가리키던 기준이
// 역사적으로 두 번 바뀌었고, 그 사이 열두 해는 여름마다 한 시간씩 앞당겨져 있었다.
// 지금 기준(동경 135도)만 놓고 계산하면, 그 시기에 태어난 사람의 시주가 통째로 틀린다.
//
//  · 표준자오선 — 1954-03-21 ~ 1961-08-09 사이에는 동경 127.5도를 썼다.
//    135도와 7.5도 차이이므로 시계가 30분 달랐다.
//  · 서머타임 — 1948~1951, 1955~1960, 1987~1988 여름. 시계를 한 시간 앞당겼으므로
//    태어났다고 적힌 시각에서 한 시간을 빼야 실제 시각이 된다.
//
// ⚠️ 아래 날짜는 널리 쓰이는 값이지만, 파는 물건의 정확도가 걸린 자리다.
//    한국천문연구원 역서로 한 번 대조해 두는 편이 좋다.

/** 그 날짜에 한국이 쓰던 표준자오선(동경, 도) */
export function standardMeridian(year: number, month: number, day: number): number {
  const ymd = year * 10000 + month * 100 + day;
  // 1954-03-21 ~ 1961-08-09 : 동경 127.5도 (UTC+8:30)
  if (ymd >= 19540321 && ymd <= 19610809) return 127.5;
  return 135;
}

/**
 * 한국이 서머타임을 쓴 구간. [시작, 끝] 모두 포함.
 * 이 구간에 적힌 시각은 실제보다 한 시간 앞서 있다.
 */
const DST_RANGES: ReadonlyArray<readonly [number, number]> = [
  [19480601, 19480912],
  [19490403, 19490910],
  [19500401, 19500910],
  [19510506, 19510908],
  [19550505, 19550908],
  [19560520, 19560929],
  [19570505, 19570921],
  [19580504, 19580920],
  [19590503, 19590919],
  [19600501, 19600917],
  [19870510, 19871010],
  [19880508, 19881008],
];

/** 그 날짜에 서머타임이 돌고 있었는가 */
export function isKoreanDst(year: number, month: number, day: number): boolean {
  const ymd = year * 10000 + month * 100 + day;
  return DST_RANGES.some(([from, to]) => ymd >= from && ymd <= to);
}

export interface ClockCorrection {
  /** 시계 시각에 더할 분. 서머타임이면 -60 */
  dstMinutes: number;
  /** 그때 쓰던 표준자오선 */
  meridian: number;
}

/**
 * 태어난 날짜가 놓인 시간 제도를 돌려준다.
 *
 * 진태양시 보정은 (출생지 경도 − 표준자오선) × 4분이다. 표준자오선이 바뀌면
 * 보정값도 통째로 바뀐다 — 서울(127.0도)은 지금 −32분이지만, 127.5도를 쓰던
 * 1954~1961년에는 −2분에 가깝다.
 */
export function koreanClock(year: number, month: number, day: number): ClockCorrection {
  return {
    dstMinutes: isKoreanDst(year, month, day) ? -60 : 0,
    meridian: standardMeridian(year, month, day),
  };
}
