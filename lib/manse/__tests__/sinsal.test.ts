import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SAZU_SAMPLE_PROFILES } from "../../sazu/sample-profiles";
import { computeFourPillars } from "../pillars";
import { computeSinsal, twelveSinsalOf, voidBranches } from "../sinsal";
import type { Branch, Stem } from "../tables";

const FIXTURES = path.join(__dirname, "../../sazu/__fixtures__");

function sazuSinsal(id: string) {
  const s = JSON.parse(readFileSync(path.join(FIXTURES, `manse.${id}.json`), "utf8")).data.modules.sinsal;
  const names = new Set<string>();
  for (const group of ["angels", "devils", "twelve"] as const) {
    for (const item of s[group] ?? []) names.add(item.name);
  }
  return { names, byPillar: s.byPillar as Record<string, { twelve: string }> };
}

function pillarsFor(id: string) {
  const p = SAZU_SAMPLE_PROFILES.find((s) => s.id === id)!.profile;
  return computeFourPillars({
    year: p.birthYear, month: p.birthMonth, day: p.birthDay,
    hour: p.birthHour, minute: p.birthMinute, isLunar: p.isLunar, city: p.birthCity,
  });
}

describe("십이신살 — 년지 기준 배정이 sazu 와 일치한다", () => {
  const SLOT = { year: "년", month: "월", day: "일", hour: "시" } as const;

  // sazu 는 unknown-hour 의 일지만 일지 기준으로 계산한다(미 → 화개살).
  // 같은 응답의 rich-sinsal 일지는 년지 기준이라 sazu 쪽 일관성 문제로 본다.
  // 우리는 표준대로 년지 기준을 따르고, 그 한 칸만 비교에서 뺀다.
  const KNOWN_DEVIATION: Record<string, string[]> = { "unknown-hour": ["day"] };

  for (const sample of SAZU_SAMPLE_PROFILES) {
    it(`${sample.id}: 네 자리 모두 일치`, () => {
      const pillars = pillarsFor(sample.id);
      const { byPillar } = sazuSinsal(sample.id);
      const yearBranch = pillars.year.branch as Branch;

      for (const key of ["year", "month", "day", "hour"] as const) {
        const pillar = pillars[key];
        const want = byPillar[key]?.twelve;
        if (!pillar || !want) continue;
        if (KNOWN_DEVIATION[sample.id]?.includes(key)) continue;
        expect(twelveSinsalOf(yearBranch, pillar.branch as Branch), `${SLOT[key]}지`).toBe(want);
      }
    });
  }
});

describe("공망 — 일주가 속한 순에서 비는 두 지지", () => {
  it("갑자순은 술·해가 빈다", () => {
    expect(voidBranches("갑" as Stem, "자" as Branch)).toEqual(["술", "해"]);
  });
  it("갑술순은 신·유가 빈다", () => {
    expect(voidBranches("갑" as Stem, "술" as Branch)).toEqual(["신", "유"]);
  });
  it("병인일주는 갑자순에 속해 술·해가 빈다", () => {
    expect(voidBranches("병" as Stem, "인" as Branch)).toEqual(["술", "해"]);
  });
});

describe("신살 판정 — sazu 와 겹치는 정도", () => {
  for (const sample of SAZU_SAMPLE_PROFILES) {
    it(`${sample.id}: sazu 가 찾은 신살을 대부분 함께 찾는다`, () => {
      const got = new Set(computeSinsal(pillarsFor(sample.id)).map((h) => h.name));
      const { names: want } = sazuSinsal(sample.id);

      const matched = Array.from(want).filter((n) => got.has(n));
      const missed = Array.from(want).filter((n) => !got.has(n));
      const ratio = matched.length / want.size;

      // 유파 차이로 완전 일치는 어렵다. 겹치는 비율만 지킨다.
      expect(ratio, `놓친 신살: ${missed.join(", ")}`).toBeGreaterThan(0.6);
    });
  }
});
