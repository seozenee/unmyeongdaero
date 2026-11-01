import { describe, expect, it } from "vitest";
import { buildManseTopics } from "../../manse";
import { getReport } from "../../reports/catalog";
import { buildTemplateReport } from "../report-template";
import { withCalculatedPeopleTiming } from "../report-timing";
import type { Reading } from "../../db/types";

const product = getReport("factbomb")!;
const subject = { name: "가상검증", birthYear: 1995, birthMonth: 5, birthDay: 19, birthHour: null,
  isFemale: true, isLunar: false, birthCity: "서울" };
const now = new Date("2026-11-02T03:00:00Z");
const sazu = buildManseTopics(product.topics, subject, null, now);
const report = buildTemplateReport(product, { subject, partner: null, answers: {} } as Reading, sazu, now);

describe("계산한 사람 운을 완성본에 연결", () => {
  it("모델이 연도만 쓰더라도 실제 계산한 가까운 월을 넣는다", () => {
    const result = withCalculatedPeopleTiming(report, product, sazu, "귀인과 인연", "2026-11-02");
    const added = result.timeline.filter(item => ["조언과 소개를 살펴볼 귀인운", "인연과 관계를 구체화할 때"].includes(item.title));
    expect(added.length).toBeGreaterThan(0);
    expect(added.some(i => i.period.includes("월 절입 이후"))).toBe(true);
    expect(added.some(i => i.title.includes("귀인"))).toBe(true);
    expect(added.some(i => i.title.includes("인연"))).toBe(true);
    expect(added.map(i => i.note).join(" ")).not.toMatch(/해요|예요|하세요/);
    expect(withCalculatedPeopleTiming(result, product, sazu, "귀인과 인연", "2026-11-02")).toEqual(result);
    expect(report.timeline).not.toEqual(result.timeline);
  });
  it("관련 질문이 없는 학업 상품에는 연애·귀인 시기를 억지로 넣지 않는다", () => {
    expect(withCalculatedPeopleTiming(report, getReport("study")!, sazu, "공부 방법", "2026-11-02")).toEqual(report);
  });
});
