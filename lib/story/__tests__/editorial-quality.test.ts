import { describe, expect, it } from "vitest";
import { assertReportEditorialQuality } from "../quality";
import { storyReportSchema } from "../report";
import destiny from "../__fixtures__/destiny-book-preview.json";

describe("유료 풀이 편집 품질", () => {
  const valid = () => storyReportSchema.parse(destiny.report);
  it("근거와 생활 설명이 있는 완성본을 통과시킨다", () => {
    expect(() => assertReportEditorialQuality(valid())).not.toThrow();
  });
  it("같은 문단을 반복해 분량을 채우면 저장하지 않는다", () => {
    const report = valid();
    report.sections[0]!.body.push(report.sections[0]!.body[0]!);
    expect(() => assertReportEditorialQuality(report)).toThrow("문단 반복");
  });
  it("다른 장에 같은 결론을 복사하면 재검수한다", () => {
    const report = valid();
    report.sections[1]!.lead = report.sections[0]!.lead;
    expect(() => assertReportEditorialQuality(report)).toThrow("결론 중복");
  });
  it("빈약한 설명과 미완성 문구를 거부한다", () => {
    const report = valid();
    report.sections[0]!.body = ["좋은 때가 옵니다.", "[작성 예정]"];
    expect(() => assertReportEditorialQuality(report)).toThrow("깊이 부족");
    expect(() => assertReportEditorialQuality(report)).toThrow("미완성 문구");
  });
});
