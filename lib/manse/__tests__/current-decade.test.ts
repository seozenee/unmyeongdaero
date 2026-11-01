import { describe, expect, it } from "vitest";
import { buildManseTopics } from "..";
import { currentDecadeFrom } from "../current-decade";
import { buildReadingTeaser } from "../teaser";
import { teaserFacts } from "../teaser-ai";
import type { SazuModules } from "../../saju/modules";

const list = [
  { startAge: 7, full: "갑자" },
  { startAge: 17, full: "을축" },
  { startAge: 27, full: "병인" },
  { startAge: 37, full: "정묘" },
  { startAge: 87, full: "계유" },
];
const atAge = (age: number): SazuModules => ({ lifeTimeline: { 나이: age }, decadeFortune: { list } });

describe("현재의 열 해 흐름", () => {
  it("마지막 구간이 아닌 현재 나이의 구간을 두 미리보기에 똑같이 쓴다", () => {
    const modules = atAge(32);
    expect(currentDecadeFrom(modules)?.startAge).toBe(27);
    expect(buildReadingTeaser(modules, "하늘").decade?.label).toContain("27세");
    expect(teaserFacts(modules, "하늘").지금지나는열해?.몇세부터).toBe(27);
  });

  it("경계에서는 새 구간으로 바뀌며 첫 구간 전에는 아직 없다고 본다", () => {
    expect(currentDecadeFrom(atAge(36))?.startAge).toBe(27);
    expect(currentDecadeFrom(atAge(37))?.startAge).toBe(37);
    expect(currentDecadeFrom(atAge(6))).toBeNull();
  });

  it("나이를 모르거나 기록의 범위를 벗어나면 현재 구간을 꾸미지 않는다", () => {
    expect(currentDecadeFrom({ decadeFortune: { list } })).toBeNull();
    expect(currentDecadeFrom(atAge(100))).toBeNull();
  });

  it("실제 엔진의 나이와 목록에서도 두 경로의 선택이 일치한다", () => {
    const profile = { name: "검토", birthYear: 1990, birthMonth: 3, birthDay: 14, birthHour: 7,
      birthMinute: 20, isFemale: false, isLunar: false, birthCity: "서울" };
    const modules = buildManseTopics(["life"], profile, null, new Date("2026-11-01")).manse!.modules;
    const current = currentDecadeFrom(modules)!;
    const age = (modules.lifeTimeline as { 나이: number }).나이;
    expect(Number(current.startAge)).toBeLessThanOrEqual(age);
    expect(Number(current.startAge) + 10).toBeGreaterThan(age);
    expect(teaserFacts(modules, profile.name).지금지나는열해?.몇세부터).toBe(current.startAge);
  });
});
