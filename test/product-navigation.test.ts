import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { CategoryRails } from "@/components/home/CategoryRails";
import { SearchCatalog } from "@/components/home/SearchCatalog";
import { getReport } from "@/lib/reports/catalog";
import { buildDetailWritingSample } from "@/lib/reports/writing-sample";
import { normalizeReportIdentity } from "@/lib/reports/identity";

vi.mock("next/link", () => ({ default: ({ children, ...props }: Record<string, unknown>) =>
  createElement("a", { ...props, "data-client-navigation": "yes" }, children as React.ReactNode) }));
vi.mock("@/components/webtoon/WebtoonMedia", () => ({ WebtoonMedia: () => null }));
const product = getReport("destiny-full")!;

describe("상품 상세 이름과 이동", () => {
  it("예전 질문형 이름은 고치면서 운영 가격과 새 이름은 보존한다", () => {
    const old = { ...product, title: "나는 무얼 가지고 태어났을까?", price: 48000 };
    expect(normalizeReportIdentity(old)).toMatchObject({ title: "종합사주", price: 48000 });
    const renamed = { ...product, title: "운영자가 정한 새로운 종합 풀이" };
    expect(normalizeReportIdentity(renamed)).toBe(renamed);
    expect(old.title).toBe("나는 무얼 가지고 태어났을까?");
  });
  it("다른 상품에 남은 예전 질문형 이름도 같은 기준으로 고친다", () => {
    const love = getReport("love")!;
    expect(normalizeReportIdentity({ ...love, title: "내 사랑은 언제 올까?" }).title).toBe(love.title);
  });
  it("상세 미리보기는 가상 예시임을 밝히고 실제 설명 문단을 제공한다", () => {
    const sample = buildDetailWritingSample(product)!;
    expect(sample.caption).toContain("가상 명식");
    expect(sample.paragraphs.length).toBeGreaterThanOrEqual(3);
    expect(sample.paragraphs[0]).toContain("사주에서는");
    expect(sample.paragraphs.join(" ")).not.toContain("이 해석을 구체적인");
  });
  it("대표 카드·분야 카드·검색 결과 모두 새 상세 문서를 요청한다", () => {
    for (const Component of [HeroCarousel, CategoryRails, SearchCatalog]) {
      const html = renderToStaticMarkup(createElement(Component, { products: [product] }));
      const links = html.match(/<a[^>]*href="\/reports\/destiny-full"[^>]*>/g) ?? [];
      expect(links.length).toBeGreaterThan(0);
      links.forEach(link => expect(link).not.toContain("data-client-navigation"));
    }
  });
});
