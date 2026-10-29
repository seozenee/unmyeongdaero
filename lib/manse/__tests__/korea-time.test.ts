import { describe, expect, it } from "vitest";
import { isKoreanDst, standardMeridian } from "../korea-time";
import { computeFourPillars } from "../pillars";

describe("한국 표준시 이력", () => {
  it("1954~1961년에는 동경 127.5도를 썼다", () => {
    expect(standardMeridian(1953, 12, 31)).toBe(135);
    expect(standardMeridian(1954, 3, 21)).toBe(127.5);
    expect(standardMeridian(1960, 6, 1)).toBe(127.5);
    expect(standardMeridian(1961, 8, 9)).toBe(127.5);
    expect(standardMeridian(1961, 8, 10)).toBe(135);
    expect(standardMeridian(1995, 3, 12)).toBe(135);
  });

  it("서머타임이 돌던 해를 가린다", () => {
    expect(isKoreanDst(1987, 7, 15)).toBe(true);
    expect(isKoreanDst(1988, 9, 1)).toBe(true);
    expect(isKoreanDst(1988, 11, 1)).toBe(false);
    expect(isKoreanDst(1957, 6, 1)).toBe(true);
    expect(isKoreanDst(1962, 6, 1)).toBe(false);
    expect(isKoreanDst(1995, 7, 1)).toBe(false);
  });
});

describe("진태양시 보정", () => {
  const seoul = (year: number, month: number, day: number, hour: number) =>
    computeFourPillars({ year, month, day, hour, minute: 0, isLunar: false, city: "서울" });

  it("지금은 서울이 약 -32분", () => {
    expect(seoul(1995, 3, 12, 9).basis.solarTimeOffsetMinutes).toBe(-32);
  });

  it("127.5도를 쓰던 시기에는 보정이 거의 없다", () => {
    const born = seoul(1958, 11, 1, 9); // 서머타임이 끝난 뒤
    expect(born.basis.standardMeridian).toBe(127.5);
    expect(born.basis.summerTime).toBe(false);
    // 서울 126.98 − 127.5 = −0.52도 → 약 −2분
    expect(born.basis.solarTimeOffsetMinutes).toBe(-2);
  });

  it("서머타임 해에는 한 시간을 뺀다", () => {
    const summer = seoul(1987, 7, 15, 9);
    expect(summer.basis.summerTime).toBe(true);
    // 135도 기준 -32분에 서머타임 -60분이 더해진다
    expect(summer.basis.solarTimeOffsetMinutes).toBe(-92);
    expect(summer.basis.trueSolarTime).toBe("07:27");
  });

  it("서머타임을 빼면 시주가 달라지는 자리가 있다", () => {
    // 1987-07-15 11:00 은 보정 뒤 09:27 — 오시(11~13시)가 아니라 사시(09~11시)가 된다
    const naive = seoul(1987, 7, 15, 11);
    expect(naive.basis.trueSolarTime).toBe("09:27");
    expect(naive.hour?.branch).toBe("사");
  });
});
