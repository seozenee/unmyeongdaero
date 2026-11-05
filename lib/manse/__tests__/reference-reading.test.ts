import { describe, expect, it } from "vitest";
import { computeManse } from "..";
import { buildRenzulliReading } from "../renzulli";
import { parseFourPillars } from "../../saju/modules";
import { getReport } from "../../reports/catalog";
import { buildBookPages } from "../../story/book";

const profile = { name: "참고검증", birthYear: 2015, birthMonth: 6, birthDay: 26, birthHour: 16,
  birthMinute: 10, isFemale: true, isLunar: false, birthCity: "서울" };
const now = new Date("2026-11-03T03:00:00Z");

describe("사용자 참고 원국과 공통 재능 해석", () => {
  it.each([10, 25])("16:%i는 첨부 원국·오행·대운 연도와 일치한다", minute => {
    const result = computeManse({ ...profile, birthMinute: minute }, now);
    expect(parseFourPillars(result.modules)).toEqual({ year: "을미", month: "임오", day: "계유", hour: "경신" });
    expect(result.modules.fourPillars.month).toMatchObject({ earthSippiSeong: "편재" });
    expect(result.elements.map(item => item.total)).toEqual([1, 1, 1, 3, 2]);
    expect(result.decade.items[1]).toEqual({ full: "갑신", startYear: 2028, startAge: 14 });
  });
  it("일간 자신은 개인별 근거에서 제외하고 인성의 실제 위치를 남긴다", () => {
    const reading = buildRenzulliReading(parseFourPillars(computeManse(profile, now).modules)!)!;
    expect(reading.positions).toHaveLength(7);
    expect(reading.positions.some(item => item.label.startsWith("일간"))).toBe(false);
    expect(reading.dimensions[0]!.basis).toEqual(expect.arrayContaining(["일지 유 본기 편인", "시간 경 정인", "시지 신 본기 정인"]));
    expect(reading.learningStyle).toContain("원리를 이해");
    expect(reading.synthesis).toContain("인성과 밖으로 꺼내는 식상");
  });
  it("같은 입력은 같은 지수, 다른 원국은 다른 지수이며 이름으로 분기하지 않는다", () => {
    const first = buildRenzulliReading(parseFourPillars(computeManse(profile, now).modules)!)!;
    const renamed = buildRenzulliReading(parseFourPillars(computeManse({ ...profile, name: "다른 이름" }, now).modules)!)!;
    const other = buildRenzulliReading({ year: "갑인", month: "병오", day: "갑자", hour: "무진" })!;
    expect(first).toEqual(renamed);
    expect(first.dimensions.map(axis => axis.index)).not.toEqual(other.dimensions.map(axis => axis.index));
    for (const axis of first.dimensions) {
      const expected = Math.round(first.groups.reduce((sum, group) => sum + group.share * axis.weights[group.key], 0) * 100);
      expect(axis.index).toBe(expected);
      expect(axis.index).toBeGreaterThanOrEqual(0);
      expect(axis.index).toBeLessThanOrEqual(100);
    }
  });
  it("참고 사진의 핵심 성격을 일반 규칙으로 재현한다", () => {
    const character = computeManse(profile, now).modules.character;
    const text = JSON.stringify(character.핵심풀이);
    for (const phrase of ["납득해야", "새로운 해결책", "끝까지 파고", "자기 기준", "의료·보건"]) expect(text).toContain(phrase);
    const other = computeManse({ ...profile, birthYear: 1990, birthMonth: 3, birthDay: 14 }, now).modules.character;
    expect(other.핵심풀이).not.toEqual(character.핵심풀이);
  });
  it("시간을 모르면 시주를 채우지 않으며 영재 판정으로 바꾸지 않는다", () => {
    const reading = buildRenzulliReading({ year: "을미", month: "임오", day: "계유", hour: null })!;
    expect(reading.unknownHour).toBe(true);
    expect(reading.positions).toHaveLength(5);
    expect(reading.scope).toContain("영재 확률이 아닙니다");
  });
  it("확인된 참고 목차는 4개 장·15개 세부 설명으로 읽는다", () => {
    const product = getReport("child-talent")!;
    const sections = product.chapters.map(title => ({ title, lead: "", body: [], evidence: [], panel: null }));
    const pages = buildBookPages(sections, { chart: true, benefactor: false, partnership: false });
    expect(pages.filter(page => page.kind === "chapter")).toHaveLength(4);
    expect(pages.filter(page => page.kind === "section")).toHaveLength(15);
    expect(pages[4]!.sectionIndex).toBe(0);
    expect(pages[20]!.kind).toBe("chapter");
    expect(pages[21]!.label).toBe("아이의 속마음을 이해하는 양육법");
  });
});
