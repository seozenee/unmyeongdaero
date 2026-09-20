import { describe, expect, it } from "vitest";
import { buildManseTopics } from "..";
import { buildFreeInsight } from "../../free/insights";
import { buildBasisFacts } from "../../saju/basis";
import { findCurrentDecadeIndex, parseDecadeFortune, parseElementCounts, parseFourPillars } from "../../saju/modules";
import { mergedModules } from "../../sazu/readings";

// 표본이 아닌 진짜 생년월일 — sazu 샌드박스로는 계산할 수 없던 사람이다
const real = {
  name: "김서진", birthYear: 1993, birthMonth: 11, birthDay: 2,
  birthHour: 7, birthMinute: 40, isFemale: true, isLunar: false, birthCity: "부산",
};
const partner = {
  name: "이재호", birthYear: 1991, birthMonth: 2, birthDay: 14,
  birthHour: 22, birthMinute: 10, isFemale: false, isLunar: false, birthCity: "서울",
};

describe("샘플이 아닌 실제 생년월일로도 끝까지 간다", () => {
  const sazu = buildManseTopics(["life", "yearly"], real, null);

  it("요청한 토픽과 manse 가 함께 담긴다", () => {
    expect(Object.keys(sazu).sort()).toEqual(["life", "manse", "yearly"]);
  });

  it("샌드박스 표시가 붙지 않는다", () => {
    expect(Object.values(sazu).every((topic) => topic!.sample === false)).toBe(true);
  });

  it("차트 세 개가 모두 값을 얻는다", () => {
    const modules = mergedModules(sazu);
    expect(parseFourPillars(modules)).not.toBeNull();
    expect(parseElementCounts(modules)).not.toBeNull();
    const decade = parseDecadeFortune(modules);
    expect(decade).not.toBeNull();
    expect(findCurrentDecadeIndex(decade!.items, 32)).toBeGreaterThanOrEqual(0);
  });

  it("'해석 근거 보기'가 원국·일간·오행·신강약·용신·신살을 모두 채운다", () => {
    const labels = buildBasisFacts(mergedModules(sazu)).map((fact) => fact.label);
    expect(labels).toEqual(expect.arrayContaining(["원국", "일간", "오행", "신강약", "용신", "신살"]));
  });

  it("시기를 다루는 토픽에만 세운·월운이 붙는다", () => {
    expect(sazu.yearly!.modules.seun).toBeDefined();
    expect(sazu.life!.modules.seun).toBeUndefined();
  });
});

describe("두 사람", () => {
  const sazu = buildManseTopics(["compatibility"], real, partner);

  it("상대의 명식을 함께 싣는다", () => {
    const partners = sazu.compatibility!.partners as Array<{ name: string; modules: Record<string, unknown> }>;
    expect(partners[0]!.name).toBe("이재호");
    expect(partners[0]!.modules.fourPillars).toBeDefined();
  });

  it("두 사람 사이의 관계와 오행 보완을 싣는다", () => {
    const modules = sazu.compatibility!.modules;
    expect(Array.isArray(modules.crossRelations)).toBe(true);
    expect(modules.elementComplement).toHaveLength(5);
    expect(typeof modules.crossSummary).toBe("string");
  });
});

describe("무료 콘텐츠", () => {
  it("오늘의 운세가 빈 껍데기로 나오지 않는다", () => {
    const insight = buildFreeInsight("today", buildManseTopics(["today"], real, null));
    expect(insight.highlights.length).toBeGreaterThanOrEqual(3);
    expect(insight.highlights.every((item) => item.text.length > 0)).toBe(true);
    expect(insight.headline).toContain("일진");
    expect(insight.sample).toBe(false);
  });

  it("도화살 콘텐츠가 신살 뜻을 읽어 온다", () => {
    const insight = buildFreeInsight("dohwa", buildManseTopics([], real, null));
    expect(insight.headline.length).toBeGreaterThan(0);
    expect(insight.highlights.every((item) => item.text.length > 0)).toBe(true);
  });

  it("성향 유형이 신강약 설명을 읽어 온다", () => {
    const insight = buildFreeInsight("mbti", buildManseTopics([], real, null));
    expect(insight.highlights.some((item) => item.label.includes("신강약"))).toBe(true);
  });
});

describe("점수는 어디에도 새지 않는다", () => {
  it("modules 전체에 점수 필드가 없다", () => {
    const json = JSON.stringify(buildManseTopics(["life", "yearly", "compatibility"], real, partner));
    expect(json).not.toMatch(/"score"|"level"|\d+점/);
  });
});
