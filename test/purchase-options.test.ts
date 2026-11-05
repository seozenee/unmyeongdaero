import { describe, expect, it } from "vitest";
import { coveredReportSlugs, getReport, listReports, purchaseOptions } from "@/lib/reports/catalog";

describe("단품과 실제 합계로 계산한 묶음 구매", () => {
  for (const base of listReports()) {
    it(`${base.slug}: 단품·2종·3종을 선택하고 포함된 모든 주제를 받는다`, () => {
      const options = purchaseOptions(base.slug);
      expect(options).toHaveLength(3);
      expect(options[0]!.bundle).toBeUndefined();
      expect(options[0]!.price).toBeGreaterThanOrEqual(19800);
      expect(options[0]!.price).toBeLessThanOrEqual(44900);
      expect(options[0]!.originalPrice).toBeGreaterThanOrEqual(60000);
      expect(options[0]!.originalPrice).toBeLessThanOrEqual(80000);
      expect(options[0]!.discountLabel).toBe(`${Math.round((1-options[0]!.price/options[0]!.originalPrice!)*100)}% 할인`);
      for (const [index, option] of Array.from(options.slice(1).entries())) {
        const items = option.bundle!.items.map(slug => getReport(slug)!);
        const sum = items.reduce((n, item) => n + item.price, 0);
        const regularSum = items.reduce((n, item) => n + (item.originalPrice ?? item.price), 0);
        expect(items).toHaveLength(index + 2);
        expect(new Set(items.map(item => item.slug)).size).toBe(items.length);
        expect(option.originalPrice).toBe(regularSum);
        expect(option.bundle!.compareAtPrice).toBe(regularSum);
        expect(option.discountLabel).toBe(`단품 정상가 합계 대비 ${Math.round((1-option.price/regularSum)*100)}% 할인`);
        expect(option.price).toBeLessThan(sum);
        expect(option.price).toBeGreaterThan(0);
        expect(option.price).toBeGreaterThan(base.price);
        expect(option.chapters).toHaveLength(items.reduce((n,item)=>n+item.chapters.length,0));
        expect(option.chapters.every(title => items.some(item => title.startsWith(`${item.title} · `)))).toBe(true);
        for (const item of items) expect(coveredReportSlugs(item.slug)).toContain(option.slug);
      }
      const [pair, complete] = options.slice(1);
      expect(complete!.price).toBeGreaterThan(pair!.price);
      expect(complete!.price / complete!.originalPrice!).toBeLessThan(pair!.price / pair!.originalPrice!);
    });
  }
  it("묶음상품이 일반 상품 목록에 중복 노출되지 않는다", () => {
    expect(listReports().every(item => !item.bundle)).toBe(true);
    expect(purchaseOptions("없는상품")).toEqual([]);
  });
  it("사업·직업·재물·건강 4개 단품만 19,800원을 적용한다", () => {
    expect(listReports().filter(report => report.price === 19800).map(report => report.slug).sort())
      .toEqual(["business", "career", "health", "money"]);
  });
});
