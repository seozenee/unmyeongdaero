import { writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildManseTopics } from "@/lib/manse";
import { renderReportPdf, reportPdfFilename } from "@/lib/pdf/render";
import { getReport } from "@/lib/reports/catalog";
import { SAMPLE_REPORT, SAMPLE_SUBJECT } from "./sample";

const product = getReport("life")!;

describe("보고서 PDF", () => {
  it("실제 명식과 보고서로 PDF 한 벌이 나온다", async () => {
    const sazu = buildManseTopics(product.topics, SAMPLE_SUBJECT, null);
    const buffer = await renderReportPdf({ product, report: SAMPLE_REPORT, subject: SAMPLE_SUBJECT, sazu });

    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
    // 표지 + 명식·결론 + 본문 + 시기·실천, 본문이 넘치면 더 늘어난다
    const pages = buffer.toString("latin1").match(/\/Type\s*\/Page[^s]/g)?.length ?? 0;
    expect(pages).toBeGreaterThanOrEqual(4);
    // 한글 글꼴이 실제로 심겼는지 — 안 심기면 글자가 통째로 빠진다
    expect(buffer.toString("latin1")).toContain("Pretendard");

    // PDF_PREVIEW=1 이면 눈으로 확인할 파일을 남긴다
    if (process.env.PDF_PREVIEW) {
      const out = process.env.PDF_PREVIEW_PATH ?? "report-preview.pdf";
      writeFileSync(out, buffer);
      console.log(`${out} — ${(buffer.length / 1024).toFixed(0)}KB, ${pages}쪽`);
    }
  }, 60_000);

  /**
   * 장이 여러 개인 보고서.
   *
   * 표본 보고서는 두 장짜리다. 그래서 이 파일의 다른 테스트는 다 통과하는데 운영에서는
   * PDF 가 한 번도 제대로 나온 적이 없었다 — 세 장을 넘기는 순간 레이아웃이 깨지며
   * pdfkit 이 "unsupported number: -1.18e+23" 을 던지고 멈췄다. 우리 상품은 전부 세 장
   * 이상이다.
   *
   * 표본을 늘리는 대신 여기서 장수를 불려 본다. 명식 전서는 열한 장이므로 그보다 넉넉히
   * 잡는다. 다시 한 Page 에 몰아 넣는 구조로 돌아가면 여기서 걸린다.
   */
  it.each([3, 5, 11, 20])("%i장짜리 보고서도 끝까지 나온다", async (count) => {
    const base = SAMPLE_REPORT.sections;
    const sections = Array.from({ length: count }, (_, index) => base[index % base.length]!);
    const sazu = buildManseTopics(product.topics, SAMPLE_SUBJECT, null);
    const buffer = await renderReportPdf({
      product,
      report: { ...SAMPLE_REPORT, sections },
      subject: SAMPLE_SUBJECT,
      sazu,
    });

    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
    const pages = buffer.toString("latin1").match(/\/Type\s*\/Page[^s]/g)?.length ?? 0;
    // 장마다 표제지 한 쪽 + 본문 한 쪽이 더 붙는다
    expect(pages, `${count}장`).toBeGreaterThanOrEqual(count * 2);
  }, 120_000);

  it("시간을 모르는 사람도 PDF 가 나온다", async () => {
    const subject = { ...SAMPLE_SUBJECT, birthHour: null, birthMinute: undefined };
    const sazu = buildManseTopics(product.topics, subject, null);
    const buffer = await renderReportPdf({ product, report: SAMPLE_REPORT, subject, sazu });
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
  }, 60_000);

  it("파일 이름에 상품과 이름이 들어가고, 경로로 쓸 수 없는 글자는 없다", () => {
    const name = reportPdfFilename(product, SAMPLE_SUBJECT);
    expect(name).toContain("김서진");
    expect(name.endsWith(".pdf")).toBe(true);
    expect(name).not.toMatch(/[/\\:*?"<>|]/);
  });
});
