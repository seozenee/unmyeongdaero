import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SAZU_SAMPLE_PROFILES } from "../../sazu/sample-profiles";
import { computeDecadeFortune } from "../decade";
import { computeFourPillars } from "../pillars";

const FIXTURES = path.join(__dirname, "../../sazu/__fixtures__");

function truth(id: string) {
  return JSON.parse(readFileSync(path.join(FIXTURES, `manse.${id}.json`), "utf8")).data.modules.decadeFortune;
}

describe("대운 — sazu 실제 응답과 대조", () => {
  for (const sample of SAZU_SAMPLE_PROFILES) {
    const p = sample.profile;

    it(`${sample.id}: 방향·시작나이·기준절기·간지가 일치한다`, () => {
      const want = truth(sample.id);
      const pillars = computeFourPillars({
        year: p.birthYear, month: p.birthMonth, day: p.birthDay,
        hour: p.birthHour, minute: p.birthMinute, isLunar: p.isLunar, city: p.birthCity,
      });
      const got = computeDecadeFortune({
        pillars,
        birth: {
          year: p.birthYear, month: p.birthMonth, day: p.birthDay,
          hour: p.birthHour, minute: p.birthMinute,
        },
        isFemale: p.isFemale,
      });

      expect(got.direction, "방향").toBe(want.direction);
      expect(got.startAge, "시작 나이").toBe(want.startAge);
      expect(got.basisTerm, "기준 절기").toBe(want.basisTermsName);

      // 앞 다섯 개 대운의 나이와 간지
      const wantList = (want.list as Array<{ startAge: number; full: string }>).slice(0, 5);
      const gotList = got.items.slice(0, 5);
      expect(gotList.map((x) => x.startAge), "대운 나이").toEqual(wantList.map((x) => x.startAge));
      expect(gotList.map((x) => x.full), "대운 간지").toEqual(wantList.map((x) => x.full));
    });
  }
});
