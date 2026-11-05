import { describe, expect, it } from "vitest";
import { computeLuck, computeSeun, computeWeolun } from "../luck";
import { computeFourPillars } from "../pillars";

// 샘플 strong-male: 1998-05-19 10:00 서울 남 → 무인 정사 병인 계사
const pillars = computeFourPillars({ year: 1998, month: 5, day: 19, hour: 10, minute: 0, city: "서울" });

describe("세운 — sazu 표본(2026 병오)과 맞춰 보기", () => {
  const seun = computeSeun(pillars, 1998, 2026);

  it("2026년은 병오", () => {
    expect(seun.ganji).toBe("병오");
  });

  it("일간 병에게 천간은 비견", () => {
    expect(seun.sipseongRelation.gan).toBe("비견");
  });

  // 원국과 운 모두 지장간 본기의 음양을 따른다. 오의 본기는 정화다.
  it("병 일간에게 오의 본기 정은 겁재", () => {
    expect(seun.sipseongRelation.ji).toBe("겁재");
  });

  it("십이운성은 제왕", () => {
    expect(seun.twelveFortune.name).toBe("제왕");
  });

  it("나이는 만 28세, 세는나이 29세", () => {
    expect(seun.internationalAge).toBe(28);
    expect(seun.age).toBe(29);
  });

  it("원국과 맺는 관계를 함께 싣는다", () => {
    // 오는 원국의 인(년지·일지)과 반합, 사(월지·시지)와 방합
    expect(seun.hapChungRelations.length).toBeGreaterThan(0);
    expect(seun.hapChungRelations.every((relation) => `${relation.sourcePosition}${relation.targetPosition}`.includes("2026 세운"))).toBe(true);
  });

  it("점수가 아니라 말로 옮긴 해석을 싣는다", () => {
    expect(seun.interpretation).toContain("—");
    expect(seun.interpretation).not.toMatch(/\d+점|level/);
  });
});

describe("세운 — 연주는 입춘으로 갈린다", () => {
  it("1월생과 12월생이 같은 해의 세운을 본다", () => {
    expect(computeSeun(pillars, 1998, 2024).ganji).toBe("갑진");
    expect(computeSeun(pillars, 1998, 2025).ganji).toBe("을사");
  });
});

describe("월운 — 달력과 절기의 어긋남", () => {
  const now = new Date("2026-03-15T00:00:00+09:00");

  it("10월은 한로를 지나 술월이 된다", () => {
    expect(computeWeolun(pillars, 2026, 10, now).monthBranchLabel).toBe("술월(戌月)");
  });

  it("달 앞부분을 지배하는 월주를 따로 남긴다", () => {
    const october = computeWeolun(pillars, 2026, 10, now);
    // 10월 1일은 아직 유월이다
    expect(october.firstHalf?.ji).toBe("유");
  });

  it("이번 달이면 표시한다", () => {
    expect(computeWeolun(pillars, 2026, 3, now).isCurrentMonth).toBe(true);
    expect(computeWeolun(pillars, 2026, 4, now).isCurrentMonth).toBe(false);
  });
});

describe("한 벌로 묶기", () => {
  const luck = computeLuck(pillars, 1998, new Date("2026-11-20T00:00:00+09:00"));

  it("앞뒤 한 해씩의 세운", () => {
    expect([luck.seun.previousSeun.year, luck.seun.currentSeun.year, luck.seun.nextSeun.year]).toEqual([2025, 2026, 2027]);
  });

  it("이번 달부터 열두 달 — 해를 넘어가도 이어진다", () => {
    expect(luck.weolun.upcomingWeoluns).toHaveLength(12);
    expect(luck.weolun.upcomingWeoluns[0]).toMatchObject({ year: 2026, month: 11 });
    expect(luck.weolun.upcomingWeoluns[2]).toMatchObject({ year: 2027, month: 1 });
  });

  it("기준 연도의 1~12월도 따로 싣는다", () => {
    expect(luck.weolun.yearWeoluns.map((item) => item.month)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it("모든 칸에 tone 이 붙는다", () => {
    for (const item of luck.weolun.yearWeoluns) {
      expect(["good", "neutral", "caution"]).toContain(item.tone);
    }
  });
});
