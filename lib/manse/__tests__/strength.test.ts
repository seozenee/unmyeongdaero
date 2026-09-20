import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SAZU_SAMPLE_PROFILES } from "../../sazu/sample-profiles";
import { computeFourPillars } from "../pillars";
import { countElements, judgeStrength } from "../strength";

const FIXTURES = path.join(__dirname, "../../sazu/__fixtures__");

const ELEMENT_KEY = { 목: "wood", 화: "fire", 토: "earth", 금: "metal", 수: "water" } as const;

function modules(id: string) {
  return JSON.parse(readFileSync(path.join(FIXTURES, `manse.${id}.json`), "utf8")).data.modules;
}

function pillarsFor(id: string) {
  const p = SAZU_SAMPLE_PROFILES.find((s) => s.id === id)!.profile;
  return computeFourPillars({
    year: p.birthYear, month: p.birthMonth, day: p.birthDay,
    hour: p.birthHour, minute: p.birthMinute, isLunar: p.isLunar, city: p.birthCity,
  });
}

describe("오행 분포 — sazu 실제 응답과 대조", () => {
  for (const sample of SAZU_SAMPLE_PROFILES) {
    it(`${sample.id}: 천간·지지·합계가 일치한다`, () => {
      const truth = modules(sample.id).elements;
      const counts = countElements(pillarsFor(sample.id));

      for (const row of counts) {
        const want = truth[ELEMENT_KEY[row.element]];
        expect(row.total, `${row.element} 합계`).toBe(want.total.count);
        expect(row.sky, `${row.element} 천간`).toBe(want.skyOnly.count);
        expect(row.earth, `${row.element} 지지`).toBe(want.earthOnly.count);
      }
    });
  }
});

describe("신강약 — 득령·득지·득세와 최종 판정", () => {
  for (const sample of SAZU_SAMPLE_PROFILES) {
    it(`${sample.id}: 판정 근거와 결론이 일치한다`, () => {
      const truth = modules(sample.id).sinStrength;
      const got = judgeStrength(pillarsFor(sample.id));

      expect(got.deukryeong, "득령").toBe(truth.deukryeong);
      expect(got.deukji, "득지").toBe(truth.deukji);
      expect(got.deukse, "득세").toBe(truth.deukse);
      expect(got.strength, "신강약").toBe(truth.strength);
    });
  }
});
