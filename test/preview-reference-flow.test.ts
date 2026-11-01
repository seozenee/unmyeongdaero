import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ReadingWebtoon } from "@/components/manse/ReadingWebtoon";
import { buildManseTopics } from "@/lib/manse";
import { buildInstantPreview, buildPreviewContext, validatePreview } from "@/lib/manse/preview";
import { buildReadingTeaser } from "@/lib/manse/teaser";
import { REPORTS, getReport, type ReportProduct } from "@/lib/reports/catalog";
import { chapterPreview, lockedTopicsFor } from "@/lib/reports/preview-topics";
import { getGuide } from "@/lib/story/guides";

vi.mock("@/components/webtoon/WebtoonMedia", () => ({ WebtoonMedia: () => null }));
const now = new Date("2026-11-01T03:00:00Z");
const profile = { name: "가상고객", birthYear: 1995, birthMonth: 5, birthDay: 19, birthHour: 12,
  birthMinute: 30, isFemale: true, isLunar: false, birthCity: "서울" };

describe("참고 파일을 옮긴 개인 미리보기", () => {
  it("모든 리포트에 읽을 본문·모자이크 분야·상세 목차가 있고 같은 입력의 글은 고정된다", () => {
    for (const product of (REPORTS as readonly ReportProduct[]).filter(p => p.kind === "report")) {
      const subject = { ...profile, birthYear: product.roles?.subject === "child" ? 2012 : 1995 };
      const modules = buildManseTopics([], subject, null, now).manse!.modules;
      const context = buildPreviewContext(modules, subject, product, now);
      const reading = buildInstantPreview(context);
      expect(() => validatePreview(reading, context), product.slug).not.toThrow();
      expect(buildInstantPreview(context), product.slug).toEqual(reading);
      expect(lockedTopicsFor(context), product.slug).toHaveLength(3);
      for (const title of product.chapters) expect(chapterPreview(title)).toHaveLength(3);
      const publicText = [reading.headline, reading.intro, ...reading.personality.body.slice(0, 2),
        ...reading.areas.map(area => area.body[0]), ...reading.past.map(past => past.body[0])].join(" ");
      expect(publicText, product.slug).not.toMatch(/천간|지장간|비겁|식상|편인|겁재|배우자궁|기신/);
      if (context.speech === "반말") expect(publicText).not.toMatch(/하세요|이에요|입니다|드려요/);
    }
  });
  it("숫자와 날짜를 지어 넣지 않고 모자이크 자리·시기표·사용자 질문을 보여 준다", () => {
    const product = getReport("destiny-full")!;
    const modules = buildManseTopics([], profile, null, now).manse!.modules;
    const context = buildPreviewContext(modules, profile, product, now, "<script>질문</script> 이직이 궁금해요");
    const html = renderToStaticMarkup(createElement(ReadingWebtoon, {
      name: profile.name, guide: getGuide(product.guide), poster: null, narrative: buildInstantPreview(context), context,
      chapters: product.chapters, productTitle: product.title, teaser: buildReadingTeaser(modules, profile.name), chart: null,
      purchaseHref: "/checkout/destiny-full?reading=sample-reading",
    }));
    expect(html).toContain("날짜·숫자는 구성 예시예요");
    expect(html).toContain("직접 남긴 질문");
    expect(html).toContain("&lt;script&gt;질문&lt;/script&gt;");
    expect(html).toContain("앞으로 여섯 달의 상세 풀이 미리보기");
    expect(html).not.toMatch(/\d+억|20\d{2}년 \d+월 \d+일에/);
  });
});
