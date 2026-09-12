import { describe, expect, it } from "vitest";
import realManse from "../../sazu/__fixtures__/manse.strong-male.json";
import realToday from "../../sazu/__fixtures__/today.strong-male.json";
import { SAMPLE_MODULES } from "../__fixtures__/sample-reading";
import { buildBasisFacts, pickGlossary } from "../basis";
import { parseGanji, toFiveElement } from "../ganji";
import {
  findCurrentDecadeIndex,
  internationalAge,
  parseDecadeFortune,
  parseElementCounts,
  parseFourPillars,
  resolveCurrentAge,
} from "../modules";

const realModules = realManse.data.modules as Record<string, unknown>;

describe("ganji", () => {
  it("한자·한글 간지 표기를 모두 해석한다", () => {
    expect(parseGanji("甲子")).toMatchObject({
      stem: { han: "甲", ko: "갑", element: "wood", yinYang: "yang" },
      branch: { han: "子", ko: "자", element: "water" },
    });
    expect(parseGanji("신유")).toMatchObject({ stem: { han: "辛" }, branch: { han: "酉", element: "metal" } });
    expect(parseGanji("甲")).toBeNull();
    expect(parseGanji("子甲")).toBeNull();
  });

  it("오행 표기를 정규화한다", () => {
    expect(toFiveElement("木")).toBe("wood");
    expect(toFiveElement("화(火)")).toBe("fire");
    expect(toFiveElement("metal")).toBe("metal");
    expect(toFiveElement("기타")).toBeNull();
  });
});

describe("modules 파서 · 실제 sazu 응답(strong-male 샘플)", () => {
  it("한글 로케일 원국을 읽고 모든 기둥이 간지로 해석된다", () => {
    const pillars = parseFourPillars(realModules)!;
    expect(pillars).toMatchObject({ year: "무인", hour: "계사" });
    for (const full of [pillars.year, pillars.month, pillars.day, pillars.hour!]) {
      expect(parseGanji(full)).not.toBeNull();
    }
  });

  it("wood/fire… 키의 오행 분포를 읽고 합이 8자다", () => {
    const counts = parseElementCounts(realModules)!;
    expect(counts.wood).toBe(2);
    expect(Object.values(counts).reduce((sum, count) => sum + count, 0)).toBe(8);
  });

  it("대운 13개를 읽는다", () => {
    const decade = parseDecadeFortune(realModules)!;
    expect(decade.direction).toBe("순행");
    expect(decade.items).toHaveLength(13);
    expect(decade.items[0]).toMatchObject({ startAge: 6, full: "무오" });
  });

  it("today 응답의 seun.currentSeun.internationalAge 로 현재 대운을 고른다", () => {
    const todayModules = realToday.data.modules as Record<string, unknown>;
    const age = resolveCurrentAge(todayModules, { year: 1998, month: 5, day: 19 }, { year: 2026, month: 7, day: 15 });
    expect(age).toBe(28);
    expect(findCurrentDecadeIndex(parseDecadeFortune(realModules)!.items, age)).toBe(2);
  });

  it("근거 사실을 뽑는다", () => {
    const facts = buildBasisFacts(realModules);
    expect(facts.map((fact) => fact.label)).toEqual(expect.arrayContaining(["원국", "일간", "오행", "신강약", "신살"]));
    expect(facts.find((fact) => fact.label === "신강약")?.value).toBe("신강");
  });
});

describe("modules 파서 · 경계", () => {
  it("시주가 비어 있으면 null, 원국이 없으면 null", () => {
    expect(parseFourPillars({ fourPillars: { ...SAMPLE_MODULES.fourPillars, hour: { full: "" } } })?.hour).toBeNull();
    expect(parseFourPillars({})).toBeNull();
  });

  it("name 만 있는 오행 항목도 매핑하고, 형태가 틀리면 null", () => {
    expect(parseElementCounts({ elements: { a: { name: "수", total: { count: 4 } } } })?.water).toBe(4);
    expect(parseElementCounts({ elements: "broken" })).toBeNull();
  });

  it("만 나이는 생일 전후를 구분한다", () => {
    expect(internationalAge({ year: 1998, month: 5, day: 19 }, { year: 2026, month: 5, day: 18 })).toBe(27);
    expect(internationalAge({ year: 1998, month: 5, day: 19 }, { year: 2026, month: 5, day: 19 })).toBe(28);
    expect(resolveCurrentAge({}, { year: 1998, month: 5, day: 19 }, { year: 2026, month: 9, day: 11 })).toBe(28);
  });

  it("현재 대운 인덱스 — 첫 대운 전이면 -1", () => {
    const items = parseDecadeFortune(SAMPLE_MODULES)!.items;
    expect(findCurrentDecadeIndex(items, 28)).toBe(2);
    expect(findCurrentDecadeIndex(items, 33)).toBe(3);
    expect(findCurrentDecadeIndex(items, 2)).toBe(-1);
  });
});

describe("basis", () => {
  it("샘플 modules 에서 근거 사실을 뽑는다", () => {
    expect(buildBasisFacts(SAMPLE_MODULES)).toEqual([
      { label: "원국", value: "戊寅 · 丁巳 · 甲子 · 己巳" },
      { label: "일간", value: "甲(갑) · 목" },
      { label: "오행", value: "목 2 · 화 3 · 토 2 · 금 0 · 수 1" },
      { label: "신강약", value: "신약" },
      { label: "용신", value: "용신 수 · 희신 금 · 기신 화" },
      { label: "신살", value: "천을귀인, 도화살" },
    ]);
  });

  it("본문에 등장한 용어만 고르고, 없으면 앞에서부터 채운다", () => {
    const glossary = { 일간: "본인", 용신: "도움 오행", 대운: "10년 흐름" };
    expect(pickGlossary(glossary, ["당신의 일간은 갑목입니다."])).toEqual({ 일간: "본인" });
    expect(pickGlossary(glossary, ["용어 없음"], 2)).toEqual({ 일간: "본인", 용신: "도움 오행" });
  });
});
