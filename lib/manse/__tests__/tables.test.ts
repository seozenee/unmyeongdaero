import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { computeFourPillars } from "../pillars";
import { SAZU_SAMPLE_PROFILES } from "../../sazu/sample-profiles";
import {
  branchTenGod, HIDDEN_STEMS, naeum, tenGod, twelveStage,
  type Branch, type Stem,
} from "../tables";

const FIXTURES = path.join(__dirname, "../../sazu/__fixtures__");

function fixture(id: string) {
  return JSON.parse(readFileSync(path.join(FIXTURES, `manse.${id}.json`), "utf8")).data.modules.fourPillars;
}

describe("십성 · 십이운성 · 납음 · 지장간 — sazu 실제 응답과 대조", () => {
  for (const sample of SAZU_SAMPLE_PROFILES) {
    const id = sample.id;
    const p = sample.profile;

    it(`${id}: 네 기둥의 부속 값이 모두 일치한다`, () => {
      const truth = fixture(id);
      const pillars = computeFourPillars({
        year: p.birthYear, month: p.birthMonth, day: p.birthDay,
        hour: p.birthHour, minute: p.birthMinute, isLunar: p.isLunar, city: p.birthCity,
      });
      const dayStem = pillars.day.stem as Stem;

      for (const key of ["year", "month", "day", "hour"] as const) {
        const want = truth[key];
        const got = pillars[key];
        if (!want || !got) continue;

        // 천간의 십성
        expect(tenGod(dayStem, got.stem as Stem), `${key} 십성`).toBe(want.sippiSeong);

        // 이전 외부 응답은 지지 자체 음양을 썼다. 이제 본기의 오행·음양으로 통일한다.
        expect(branchTenGod(dayStem, got.branch as Branch), `${key} 지지십성`).toBe(tenGod(dayStem, HIDDEN_STEMS[got.branch as Branch].at(-1)!));

        // 십이운성
        expect(twelveStage(dayStem, got.branch as Branch), `${key} 십이운성`).toBe(want.twelveStage);

        // 납음
        expect(naeum(got.stem as Stem, got.branch as Branch), `${key} 납음`).toBe(want.naeeum);

        // 지장간 구성 (여기·중기·정기)
        const hidden = HIDDEN_STEMS[got.branch as Branch];
        const wantHidden = [want.jiJangGan?.residue?.stem, want.jiJangGan?.middle?.stem, want.jiJangGan?.main?.stem]
          .filter(Boolean);
        expect([...hidden], `${key} 지장간`).toEqual(wantHidden);
      }
    });
  }
});

// 자오사해의 음양을 지지 자체에서 가져오면 정·편이 뒤집힌다.
it("지지 십성은 본기를 기준으로 자오사해까지 계산한다", () => {
  expect(branchTenGod("계", "오")).toBe("편재");
  expect(branchTenGod("갑", "자")).toBe("정인");
  expect(branchTenGod("병", "사")).toBe("비견");
  expect(branchTenGod("임", "해")).toBe("비견");
});
