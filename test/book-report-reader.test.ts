import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ReadingCard } from "@/components/report/ReadingCard";
import { getReport } from "@/lib/reports/catalog";
import { assertReportContent } from "@/lib/story/quality";
import { storyReportSchema } from "@/lib/story/report";
import factbomb from "@/lib/story/__fixtures__/factbomb-book-preview.json";
import destiny from "@/lib/story/__fixtures__/destiny-book-preview.json";
import { buildBookPages } from "@/lib/story/book";
import { CardReportReader } from "@/components/report/CardReportReader";
import { ReadingDiagram } from "@/components/report/ReadingDiagram";
import { getGuide } from "@/lib/story/guides";

describe("책처럼 넘겨 읽는 전체 풀이", () => {
  it("이름 표지와 첫 이야기, 원국, 독립된 장 표지가 해설보다 먼저 나온다", () => {
    const report = storyReportSchema.parse(factbomb.report);
    const pages = buildBookPages(report.sections, { chart: true, benefactor: true, partnership: true });
    expect(pages.slice(0, 4).map(page => page.kind)).toEqual(["cover", "opening", "chart", "chapter"]);
    expect(pages.filter(page => page.kind === "section").map(page => report.sections[page.sectionIndex!]!.title)).toEqual(report.sections.map(section => section.title));
    expect(new Set(pages.map(page => page.id)).size).toBe(pages.length);
  });
  it("첫 페이지 본문에는 이름만 두고 긴 소개와 해설은 다음 페이지로 넘긴다", () => {
    const product = getReport("factbomb")!;
    const html = renderToStaticMarkup(createElement(CardReportReader, {
      report: storyReportSchema.parse(factbomb.report), guide: getGuide(product.guide), categoryLabel: product.categoryLabel,
      title: product.title, subjectName: factbomb.subject.name, partnerName: null, issuedAt: "2026년 11월 1일",
      panels: { pillars: null, counts: null, decade: null, years: null }, basisFacts: [], glossary: {},
    }));
    expect(html).toContain(`<h1>${factbomb.subject.name}</h1>`);
    expect(html).not.toContain(factbomb.report.headline);
    expect(html).not.toContain("다음 이야기");
    expect(html).toContain('aria-label="다음 페이지"');
    const total = buildBookPages(storyReportSchema.parse(factbomb.report).sections, { chart: false, benefactor: false, partnership: false }).length;
    expect(html.replace(/<[^>]*>/g, "")).toContain(`1 / ${total}`);
  });
  it("도해는 실제 오행 글자 수를 그대로 보여 준다", () => {
    const report = storyReportSchema.parse(factbomb.report);
    const html = renderToStaticMarkup(createElement(ReadingDiagram, {
      section: report.sections[0]!, panels: { pillars: null, counts: { wood: 2, fire: 3, earth: 1, metal: 0, water: 2 }, decade: null, years: null },
    }));
    expect(html).toContain('role="img"');
    expect(html).toContain("화 · 불 3");
    expect(html).toContain("금 · 쇠 0");
    expect(html.replace(/<[^>]*>/g, "")).toContain("원국 8글자의 분포");
    expect(html).not.toContain("성공 확률");
  });
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
