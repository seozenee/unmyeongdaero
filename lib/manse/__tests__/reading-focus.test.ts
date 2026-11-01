import { describe, expect, it } from "vitest";
import { computeManse } from "..";
import { buildReadingFocus } from "../reading-focus";
import { readRomance } from "../romance";
import { cheoneulBranches } from "../sinsal";
import type { FourPillars } from "../pillars";
import type { Stem } from "../tables";

const p = (full: string) => ({ full, stem: full[0]!, branch: full[1]!, hanja: "" });
const pillars: FourPillars = { year: p("갑인"), month: p("병오"), day: p("갑자"), hour: null };

describe("개인별 강점과 사람 운", () => {
  it("같은 지지가 들어오는 해를 합으로 세지 않는다", () => {
    const reading = readRomance(pillars, false, [{ year: 2032, age: 30, ganji: "임자" }]);
    expect(reading.meetings).toEqual([]);
  });
  it("지지 두 글자만으로 삼합 완성이라고 설명하지 않는다", () => {
    const reading = readRomance(pillars, false, [{ year: 2028, age: 30, ganji: "무신" }]);
    expect(reading.meetings[0]!.reasons.some(r => r.includes("반합"))).toBe(true);
    expect(reading.meetings[0]!.reasons.join(" ")).not.toContain("삼합");
  });
  it("배우자 후보는 성인 기간에서 서로 다른 단서가 겹칠 때만 고른다", () => {
    const focus = buildReadingFocus({ pillars, strength: "중화", isFemale: false, birthYear: 2012,
      years: [{ year: 2028, full: "무신" }, { year: 2033, full: "계축" }], months: [] });
    expect(focus.partnership.map(p => p.year)).toEqual([2033]);
    expect(focus.partnership[0]!.reasons.length).toBeGreaterThanOrEqual(2);
  });
  it("귀인 기간은 같은 원국 귀인 표에 맞고 근거 글자를 남긴다", () => {
    const profile = { name: "가상검증", birthYear: 1995, birthMonth: 5, birthDay: 19, birthHour: 12,
      birthMinute: 30, isFemale: true, isLunar: false, birthCity: "서울" };
    const result = computeManse(profile, new Date("2026-11-02T03:00:00Z"));
    const focus = result.modules.readingFocus;
    expect(focus.benefactor.length).toBeGreaterThan(0);
    for (const period of focus.benefactor) {
      expect(cheoneulBranches(result.pillars.day.stem as Stem)).toContain(period.ganji[1]);
      expect(period.age).toBe(period.year - profile.birthYear + 1);
      if (period.month) expect(period.period).toContain("절입 이후");
    }
    expect(focus.business.basis.length).toBeGreaterThan(0);
    expect(focus.expression.lead).not.toContain("성공");
    expect(focus.unknownHour).toBe(false);
  });
  it("원국이 다르면 같은 사업 강점과 표현 강점을 붙이지 않는다", () => {
    const a = buildReadingFocus({ pillars, strength: "신약", isFemale: false, birthYear: 1995, years: [], months: [] });
    const b = buildReadingFocus({ pillars: { year: p("계해"), month: p("임자"), day: p("갑인"), hour: null }, strength: "신강", isFemale: false, birthYear: 1995, years: [], months: [] });
    expect(a.business.lead).not.toBe(b.business.lead);
    expect(a.expression.lead).not.toBe(b.expression.lead);
    expect(a.unknownHour).toBe(true);
  });
});
