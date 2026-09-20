import { describe, expect, it } from "vitest";
import { computeSinsal, SINSAL_MEANING } from "../sinsal";
import { computeFourPillars } from "../pillars";
import { SAZU_SAMPLE_PROFILES } from "../../sazu/sample-profiles";

describe("신살 뜻풀이", () => {
  it("표본에서 나온 신살은 모두 뜻이 붙는다", () => {
    const missing: string[] = [];
    for (const sample of SAZU_SAMPLE_PROFILES) {
      const p = sample.profile;
      const pillars = computeFourPillars({
        year: p.birthYear, month: p.birthMonth, day: p.birthDay,
        hour: p.birthHour, minute: p.birthMinute ?? 0, isLunar: p.isLunar, city: p.birthCity,
      });
      for (const hit of computeSinsal(pillars)) if (!hit.description && !missing.includes(hit.name)) missing.push(hit.name);
    }
    expect(missing).toEqual([]);
  });

  it("겁주는 말을 쓰지 않는다", () => {
    const scary = /형사|수술|재앙|사고|장애|과부|단명|파산|죽/;
    const offenders = Object.entries(SINSAL_MEANING).filter(([, text]) => scary.test(text));
    expect(offenders).toEqual([]);
  });
});
