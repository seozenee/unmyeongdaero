import { describe, expect, it } from "vitest";
import { buildManseTopics } from "..";
import { buildFallbackPreview, buildPreviewContext, validatePreview } from "../preview";
import { getReport } from "../../reports/catalog";

const profile = { name: "검토", birthYear: 2012, birthMonth: 5, birthDay: 19, birthHour: 12,
  birthMinute: 30, isFemale: true, isLunar: false, birthCity: "서울" };
const now = new Date("2026-11-01T03:00:00Z");
const product = getReport("destiny-full")!;
const modules = buildManseTopics([], profile, null, now).manse!.modules;
const context = buildPreviewContext(modules, profile, product, now);

describe("만세력 개인 풀이", () => {
  it("서로 다른 지난 두 해를 계산하며 나이와 연도가 맞는다", () => {
    expect(context.past).toHaveLength(2);
    for (const item of context.past) {
      expect(item.year).toBeLessThan(2026);
      expect(item.age).toBe(item.year - profile.birthYear + 1);
      expect(item.interpretation.length).toBeGreaterThan(10);
    }
    expect(context.past[0]!.year).toBeLessThan(context.past[1]!.year);
  });
  it("원국의 실제 글자와 용어의 뜻을 함께 전달한다", () => {
    expect(context.basis.dayMaster?.character).toBe((modules.fourPillars as { day: { sky: string } }).day.sky);
    expect(context.basis.placements.length).toBeGreaterThan(0);
    for (const item of context.basis.placements) {
      expect(item.character.length).toBe(1);
      expect(item.meaning.length).toBeGreaterThan(5);
    }
    const reading = buildFallbackPreview(context);
    expect(reading.personality.body.join(" ")).not.toMatch(/비겁|식상|관성|인성|재성|천간|편인|겁재/);
    expect(JSON.stringify(reading)).not.toContain("이 해석을 구체적인");
  });
  it("AI가 연결되지 않아도 성격·과거·두 분야·앞날 풀이가 모두 있다", () => {
    const reading = buildFallbackPreview(context);
    expect(() => validatePreview(reading, context)).not.toThrow();
    expect(reading.personality.body.length).toBeGreaterThanOrEqual(2);
    expect(reading.past).toHaveLength(2);
    expect(reading.areas).toHaveLength(2);
    expect(JSON.stringify(reading)).not.toMatch(/방금 계산했어요|문이 열립니다|맞죠\?|상위 \d+%|\d+억/);
    expect(reading.areas.some(area => /배우|배울|공부/.test(area.title))).toBe(true);
  });
  it("모델이 과거 연도나 근거를 만들어 내면 채택하지 않는다", () => {
    const reading = buildFallbackPreview(context);
    reading.past[0]!.year = 2030;
    expect(() => validatePreview(reading, context)).toThrow("과거 시기");
    const other = buildFallbackPreview(context);
    other.personality.evidenceIds = ["invented-fact"];
    expect(() => validatePreview(other, context)).toThrow("근거");
  });
  it("계산 내부 ID는 글에서 제거하고 생활 예시의 괄호는 유지한다", () => {
    const reading = buildFallbackPreview(context);
    reading.personality.body[0] = "역할을 맡을 때 힘이 나요(character + outside). 결과물(그림·발표)을 확인해 보세요.";
    reading.past[0]!.body[0] = "말의 속도를 조절하던 때로 읽어요(2022 reasons).";
    const cleaned = validatePreview(reading, context);
    expect(cleaned.personality.body[0]).toBe("역할을 맡을 때 힘이 나요. 결과물(그림·발표)을 확인해 보세요.");
    expect(cleaned.past[0]!.body[0]).not.toContain("reasons");
    expect(cleaned.personality.evidenceIds).toEqual(reading.personality.evidenceIds);
  });
  it("어린아이에게 태어나기 전이나 유아기의 사건을 붙이지 않는다", () => {
    const baby = { ...profile, birthYear: 2024 };
    const data = buildManseTopics([], baby, null, now).manse!.modules;
    expect(buildPreviewContext(data, baby, product, now).past).toEqual([]);
  });
  it("시간 미상은 표시하고 시주를 만들어 넣지 않는다", () => {
    const unknown = { ...profile, birthHour: null };
    const data = buildManseTopics([], unknown, null, now).manse!.modules;
    expect(buildPreviewContext(data, unknown, product, now).unknownHour).toBe(true);
    expect((data.fourPillars as { hour?: unknown }).hour).toBeFalsy();
  });
});
