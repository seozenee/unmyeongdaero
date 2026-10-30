import { describe, expect, it } from "vitest";
import { buildManseTopics } from "@/lib/manse";
import { buildHomeChart } from "@/lib/manse/home-chart";
import { buildReadingTeaser } from "@/lib/manse/teaser";

const SUBJECT = {
  name: "김하늘", birthYear: 1995, birthMonth: 3, birthDay: 12,
  birthHour: 9, birthMinute: 30, isFemale: true, isLunar: false, birthCity: "서울",
};

const sazu = buildManseTopics(["today"], SUBJECT, null);
const modules = (sazu.today?.modules ?? {}) as Record<string, unknown>;

describe("첫 화면 원국", () => {
  const chart = buildHomeChart(sazu, SUBJECT.name);

  it("네 기둥이 시·일·월·년 차례로 나온다", () => {
    expect(chart.pillars.map((p) => p.slot)).toEqual(["시", "일", "월", "년"]);
    expect(chart.pillars.map((p) => `${p.stem}${p.branch}`)).toEqual(["갑진", "임인", "기묘", "을해"]);
    // 한자가 비어 있으면 화면에 네모만 네 개 뜬다
    for (const pillar of chart.pillars) {
      expect(pillar.stemHanja, pillar.slot).toMatch(/^[一-鿿]$/);
      expect(pillar.branchHanja, pillar.slot).toMatch(/^[一-鿿]$/);
    }
  });

  it("일간을 집어낸다", () => {
    expect(chart.dayMaster).toEqual({ hanja: "壬", ko: "임수", element: "water", elementKo: "수" });
  });

  it("오행 백분율의 합이 정확히 100 이다", () => {
    // 그냥 반올림하면 99 나 101 이 된다. 다섯 칸을 보여 주면서 합이 안 맞으면 틀린 표다
    expect(chart.elements.reduce((sum, e) => sum + e.percent, 0)).toBe(100);
  });

  it("가린 값은 응답에 담기지 않는다", () => {
    // 화면에서만 가리면 개발자 도구를 연 사람에게는 공짜로 보인다
    const best = buildReadingTeaser(modules as never, SUBJECT.name).best;
    expect(best).not.toBeNull();
    expect(JSON.stringify(chart)).not.toContain(best!.label);
  });
});

describe("달의 결", () => {
  it("좋은 달과 조심할 달을 실제로 집어낸다", () => {
    // 전에는 없는 필드(twelveFortune.level)를 읽어 모든 달이 neutral 로 떨어졌다.
    // 에러도 없이 "문이 열리는 달"이 통째로 비어 있었다 — 그래서 여기서 못 박는다.
    const teaser = buildReadingTeaser(modules as never, SUBJECT.name);
    expect(teaser.months.length).toBeGreaterThan(0);
    expect(teaser.months.every((m) => m.tone === "neutral"), "모든 달이 neutral 이면 결을 못 읽은 것이다").toBe(false);
    expect(teaser.best).not.toBeNull();
  });
});
