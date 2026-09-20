import { describe, expect, it } from "vitest";
import { computeManse } from "..";
import { SAZU_SAMPLE_PROFILES } from "../../sazu/sample-profiles";
import { buildBasisFacts } from "../../saju/basis";
import { findCurrentDecadeIndex, parseDecadeFortune, parseElementCounts, parseFourPillars } from "../../saju/modules";

describe("어댑터 — 앱의 기존 파서가 그대로 읽는다", () => {
  for (const sample of SAZU_SAMPLE_PROFILES) {
    const p = sample.profile;

    it(`${sample.id}: 원국표·오행·대운 파서가 값을 뽑아낸다`, () => {
      const { modules } = computeManse(p);

      const pillars = parseFourPillars(modules);
      expect(pillars, "원국표").not.toBeNull();
      expect(pillars!.day, "일주").toBeTruthy();

      const counts = parseElementCounts(modules);
      expect(counts, "오행 분포").not.toBeNull();
      const total = Object.values(counts!).reduce((a, b) => a + b, 0);
      expect(total, "여덟 글자(시주 없으면 여섯)").toBe(p.birthHour === null ? 6 : 8);

      const decade = parseDecadeFortune(modules);
      expect(decade, "대운").not.toBeNull();
      expect(decade!.items.length, "대운 개수").toBeGreaterThanOrEqual(8);
      expect(findCurrentDecadeIndex(decade!.items, 30), "현재 대운 위치").toBeGreaterThanOrEqual(0);

      const facts = buildBasisFacts(modules);
      expect(facts.length, "명식 요약 항목").toBeGreaterThan(0);
    });
  }
});

describe("어댑터 — 시간 미상", () => {
  it("시주를 만들지 않는다", () => {
    const p = SAZU_SAMPLE_PROFILES.find((s) => s.id === "unknown-hour")!.profile;
    const { modules, pillars } = computeManse(p);
    expect(pillars.hour).toBeNull();
    expect((modules.fourPillars as Record<string, unknown>).hour).toBeUndefined();
  });
});
