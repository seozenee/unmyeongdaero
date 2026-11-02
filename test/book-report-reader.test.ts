import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ReadingCard } from "@/components/report/ReadingCard";
import { getReport } from "@/lib/reports/catalog";
import { assertReportContent } from "@/lib/story/quality";
import { storyReportSchema } from "@/lib/story/report";
import factbomb from "@/lib/story/__fixtures__/factbomb-book-preview.json";
import destiny from "@/lib/story/__fixtures__/destiny-book-preview.json";

describe("책처럼 넘겨 읽는 전체 풀이", () => {
  it("주제 본문의 마지막 문장도 펼치기를 누르기 전에 읽을 수 있다", () => {
    const section = { title: "귀인의 모습과 시기", lead: "2027년에는 조언을 통한 도움을 살펴요.", body: ["첫 설명을 읽어요.", "계산된 이유를 이어서 읽어요.", "마지막 선택까지 숨기지 않아요."], evidence: [], panel: null } as const;
    const html = renderToStaticMarkup(createElement(ReadingCard, { section: { ...section, body: [...section.body], evidence: [] }, index: 0, children: null }));
    expect(html).toContain("계산된 이유를 이어서 읽어요.");
    expect(html).toContain("마지막 선택까지 숨기지 않아요.");
    expect(html).not.toContain("<details");
    expect(html).not.toContain("이 이야기 더 읽기");
  });
  it.each([["factbomb", factbomb], ["destiny-full", destiny]] as const)("%s 미리보기에는 목차와 설명·근거가 있는 가상 풀이만 담는다", (slug, sample) => {
    const report = storyReportSchema.parse(sample.report);
    expect(() => assertReportContent(report, getReport(slug)!)).not.toThrow();
    expect(report.sections.every(section => section.body.join(" ").length > 300)).toBe(true);
    expect(Object.keys(sample).sort()).toEqual(["referenceDate", "report", "subject"]);
    expect(JSON.stringify(sample)).not.toMatch(/sd_dev_session|userId|readingId|cookie/);
  });
});
