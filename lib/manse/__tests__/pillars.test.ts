import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SAZU_SAMPLE_PROFILES } from "../../sazu/sample-profiles";
import { computeFourPillars } from "../pillars";

const FIXTURES = path.join(__dirname, "../../sazu/__fixtures__");

function truthFor(id: string) {
  const data = JSON.parse(readFileSync(path.join(FIXTURES, `manse.${id}.json`), "utf8")).data;
  const fp = data.modules.fourPillars;
  return {
    year: fp.year?.full as string,
    month: fp.month?.full as string,
    day: fp.day?.full as string,
    hour: (fp.hour?.full ?? null) as string | null,
  };
}

describe("computeFourPillars · sazu 실제 응답과 대조", () => {
  for (const sample of SAZU_SAMPLE_PROFILES) {
    it(`${sample.id}: 네 기둥이 일치한다`, () => {
      const p = sample.profile;
      const truth = truthFor(sample.id);
      const got = computeFourPillars({
        year: p.birthYear,
        month: p.birthMonth,
        day: p.birthDay,
        hour: p.birthHour,
        minute: p.birthMinute,
        isLunar: p.isLunar,
        city: p.birthCity,
      });

      expect(got.year.full).toBe(truth.year);
      expect(got.month.full).toBe(truth.month);
      expect(got.day.full).toBe(truth.day);
      expect(got.hour?.full ?? null).toBe(truth.hour);
    });
  }
});

describe("절기 경계 · 한국시 기준", () => {
  // 2024 입춘: KST 2024-02-04 17:27 — 이 시각을 넘겨야 갑진년이 된다
  it("입춘 직전은 전년도 간지를 쓴다", () => {
    const before = computeFourPillars({ year: 2024, month: 2, day: 4, hour: 17, minute: 0, city: "서울", useTrueSolarTime: false });
    expect(before.year.full).toBe("계묘");
  });

  it("입춘 직후는 새 간지를 쓴다", () => {
    const after = computeFourPillars({ year: 2024, month: 2, day: 4, hour: 18, minute: 0, city: "서울", useTrueSolarTime: false });
    expect(after.year.full).toBe("갑진");
  });

  // 2024 입하: KST 2024-05-05 09:10 — 월지가 진(辰)에서 사(巳)로 바뀐다
  it("입하 직전은 진월이다", () => {
    const before = computeFourPillars({ year: 2024, month: 5, day: 5, hour: 8, minute: 30, city: "서울", useTrueSolarTime: false });
    expect(before.month.branch).toBe("진");
  });

  it("입하 직후는 사월이다", () => {
    const after = computeFourPillars({ year: 2024, month: 5, day: 5, hour: 9, minute: 30, city: "서울", useTrueSolarTime: false });
    expect(after.month.branch).toBe("사");
  });
});

describe("야자시 · 진태양시", () => {
  it("23시 이후는 다음 날 일주로 넘어간다", () => {
    const evening = computeFourPillars({ year: 2024, month: 6, day: 10, hour: 22, minute: 30, city: "서울", useTrueSolarTime: false });
    const nightZi = computeFourPillars({ year: 2024, month: 6, day: 10, hour: 23, minute: 30, city: "서울", useTrueSolarTime: false });
    expect(nightZi.day.full).not.toBe(evening.day.full);
    expect(nightZi.hour?.branch).toBe("자");
  });

  it("서울은 시계보다 약 32분 늦은 진태양시를 쓴다", () => {
    const seoul = computeFourPillars({ year: 1998, month: 5, day: 19, hour: 10, minute: 0, city: "서울" });
    expect(seoul.basis.solarTimeOffsetMinutes).toBe(-32);
    expect(seoul.basis.trueSolarTime).toBe("09:27");
  });

  it("보정을 끄면 시계 시각을 그대로 쓴다", () => {
    const raw = computeFourPillars({ year: 1998, month: 5, day: 19, hour: 10, minute: 0, city: "서울", useTrueSolarTime: false });
    expect(raw.basis.solarTimeOffsetMinutes).toBe(0);
    expect(raw.basis.trueSolarTime).toBe("10:00");
  });

  it("진태양시 보정으로 시주가 바뀌는 경계를 잡아낸다", () => {
    // 시계 09:20 은 사시지만, 서울 진태양시로는 08:48 이라 진시가 된다
    const corrected = computeFourPillars({ year: 1998, month: 5, day: 19, hour: 9, minute: 20, city: "서울" });
    const raw = computeFourPillars({ year: 1998, month: 5, day: 19, hour: 9, minute: 20, city: "서울", useTrueSolarTime: false });
    expect(corrected.hour?.branch).toBe("진");
    expect(raw.hour?.branch).toBe("사");
  });
});

describe("음력 입력", () => {
  it("음력을 양력으로 바꿔 계산한다", () => {
    const lunar = computeFourPillars({ year: 2023, month: 2, day: 15, hour: 10, minute: 0, isLunar: true, city: "서울" });
    expect(lunar.basis.solarDate).toBe("2023-03-06");
  });

  it("윤달을 평달과 다르게 다룬다", () => {
    const plain = computeFourPillars({ year: 2023, month: 2, day: 15, hour: 10, isLunar: true, city: "서울" });
    const leap = computeFourPillars({ year: 2023, month: 2, day: 15, hour: 10, isLunar: true, isLeapMonth: true, city: "서울" });
    expect(leap.basis.solarDate).not.toBe(plain.basis.solarDate);
    expect(leap.basis.solarDate).toBe("2023-04-05");
  });
});
