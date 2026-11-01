import { describe, expect, it } from "vitest";
import { koreanLunarToSolar } from "../calendar";
import { computeManse } from "..";
import { computeFourPillars } from "../pillars";
import { buildPreviewContext } from "../preview";
import { getReport } from "../../reports/catalog";

// 한국천문연구원 음력-양력 대조표 및 2026년 월력요항의 명절 날짜.
// https://astro.kasi.re.kr/life/pageView/1
// https://www.kasi.re.kr/kor/post/newsMaterial/32031
const KOREAN_REFERENCE = [
  [2017, 5, 1, false, 2017, 5, 26],
  [2017, 5, 1, true, 2017, 6, 24],
  [2017, 6, 1, false, 2017, 7, 23],
  [2017, 8, 1, false, 2017, 9, 20],
  [2004, 2, 1, true, 2004, 3, 21],
  [2004, 12, 1, false, 2005, 1, 10],
  [2026, 1, 1, false, 2026, 2, 17],
  [2026, 5, 5, false, 2026, 6, 19],
  [2026, 7, 7, false, 2026, 8, 19],
  [2026, 8, 15, false, 2026, 9, 25],
] as const;

describe("한국 음력과 윤달", () => {
  it.each(KOREAN_REFERENCE)("한국천문연구원 대조: 음력 %i.%i.%i (윤달 %s)", (y, m, d, leap, sy, sm, sd) => {
    expect(koreanLunarToSolar(y, m, d, leap)).toEqual({ year: sy, month: sm, day: sd });
  });
  it.each([[2017, 6, 1, true], [2017, 5, 30, true], [2026, 9, 1, true], [2051, 1, 1, false]] as const)(
    "없는 날짜·윤달은 다른 날로 바꾸지 않고 거절한다: %i.%i.%i %s", (y, m, d, leap) => {
      expect(koreanLunarToSolar(y, m, d, leap)).toBeNull();
    });
  it("중국 달력에만 있는 윤달로 명식을 계산하지 않는다", () => {
    expect(() => computeFourPillars({ year: 2017, month: 6, day: 1, hour: 12, isLunar: true, isLeapMonth: true })).toThrow("한국 음력");
  });
  it.each([
    [2023, 2, 15, false, 2023, 3, 6],
    [2023, 2, 15, true, 2023, 4, 5],
    [2004, 12, 1, false, 2005, 1, 10],
  ] as const)("같은 생일이면 음력·양력 입력의 원국·대운·나이가 같다: %i.%i.%i %s", (y, m, d, leap, sy, sm, sd) => {
    const common = { name: "가상검증", birthHour: 12, birthMinute: 30, isFemale: true, birthCity: "서울" };
    const lunar = { ...common, birthYear: y, birthMonth: m, birthDay: d, isLunar: true, isLeapMonth: leap };
    const solar = { ...common, birthYear: sy, birthMonth: sm, birthDay: sd, isLunar: false };
    const now = new Date("2026-11-02T03:00:00Z");
    const a = computeManse(lunar, now);
    const b = computeManse(solar, now);
    expect(a.pillars).toEqual(b.pillars);
    expect(a.decade).toEqual(b.decade);
    expect(a.modules).toEqual(b.modules);
    const product = getReport("factbomb")!;
    expect(buildPreviewContext(a.modules, lunar, product, now).age).toBe(buildPreviewContext(b.modules, solar, product, now).age);
  });
});
