import { describe, expect, it } from "vitest";
import { getReport } from "../../reports/catalog";
import { resolveGeneratedReport } from "../generation-schema";
import { storyReportSchema } from "../report";

const product = getReport("factbomb")!;
const payload = { briefing: [{ speaker: "guide", text: "검토" }], headline: "검토", summary: "검토", keywords: [],
  sections: product.chapters.map((_, index) => ({ chapterId: `chapter_${index + 1}`, title: `AI가 바꾼 제목 ${index}`,
    lead: `장 ${index + 1}`, body: ["설명", "이유"], evidence: [{ label: "근거", detail: "설명" }], panel: null })),
  timeline: [], actions: { do: [], avoid: [] }, closing: "검토" };

describe("생성한 본문과 상품 목차 연결", () => {
  it("AI가 제목을 바꾸거나 순서를 섞어도 ID의 본문을 서버 목차에 정확히 연결한다", () => {
    const report = resolveGeneratedReport({ ...payload, sections: [...payload.sections].reverse() }, product);
    expect(report.sections.map(section => section.title)).toEqual(product.chapters);
    expect(report.sections.map(section => section.lead)).toEqual(["장 1", "장 2", "장 3", "장 4", "장 5"]);
    expect(JSON.stringify(report)).not.toContain("chapterId");
    expect(() => storyReportSchema.parse(report)).not.toThrow();
  });
  it("빠진 장·중복된 장·알 수 없는 ID는 제목만 바꿔서 통과시키지 않는다", () => {
    expect(() => resolveGeneratedReport({ ...payload, sections: payload.sections.slice(1) }, product)).toThrow();
    expect(() => resolveGeneratedReport({ ...payload, sections: payload.sections.map(section => ({ ...section, chapterId: "chapter_1" })) }, product)).toThrow("중복 또는 누락");
    expect(() => resolveGeneratedReport({ ...payload, sections: payload.sections.map(section => ({ ...section, chapterId: "chapter_99" })) }, product)).toThrow();
  });
});
