import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ReadingWebtoon } from "@/components/manse/ReadingWebtoon";
import { buildManseTopics } from "@/lib/manse";
import { buildRecognitionHook } from "@/lib/manse/conversion";
import { buildFallbackPreview, buildPreviewContext } from "@/lib/manse/preview";
import { buildReadingTeaser } from "@/lib/manse/teaser";
import { getReport } from "@/lib/reports/catalog";
import { getGuide } from "@/lib/story/guides";

vi.mock("@/components/webtoon/WebtoonMedia", () => ({ WebtoonMedia: () => null }));
const product = getReport("destiny-full")!;
const profile = { name: "가상고객", birthYear: 1995, birthMonth: 5, birthDay: 19, birthHour: 12,
  birthMinute: 30, isFemale: true, isLunar: false, birthCity: "서울" };
const now = new Date("2026-11-01T03:00:00Z");
const modules = buildManseTopics([], profile, null, now).manse!.modules;
const context = buildPreviewContext(modules, profile, product, now);

describe("결제 전 개인 미리보기", () => {
  it("계산된 중심 성향에 따라 자기 인식 질문이 달라진다", () => {
    const forGroup = (term: string) => buildRecognitionHook({ ...context,
      basis: { ...context.basis, placements: [], prominent: { ...context.basis.prominent!, term } } });
    expect(forGroup("관성").question).toContain("못 쉬고");
    expect(forGroup("비겁").question).toContain("내가 정해야");
    expect(forGroup("인성").question).toContain("이유를 모르면");
  });
  it("성향과 과거를 일부 공개하고 상세 해법은 구매 질문으로 이어 준다", () => {
    const narrative = buildFallbackPreview(context);
    narrative.personality.body = ["공개할 성향", "공개할 근거", "아직 공개하지 않을 상세 해법"];
    narrative.past[0]!.body = ["공개할 과거 흐름", "아직 공개하지 않을 과거 상세"];
    narrative.areas.forEach(block => { block.body = ["공개할 분야 단서", "아직 공개하지 않을 분야 해법"]; });
    narrative.outlook.body = ["아직 공개하지 않을 월별 해법", "상세 행동 계획"];
    const html = renderToStaticMarkup(createElement(ReadingWebtoon, {
      narrative, context, name: profile.name, guide: getGuide(product.guide), poster: null,
      teaser: buildReadingTeaser(modules, profile.name), chapters: product.chapters,
      productTitle: product.title, chart: createElement("div", null, "명식"),
    }));
    expect(html).toContain(narrative.headline);
    expect(html).toContain("공개할 근거");
    expect(html).toContain("공개할 과거 흐름");
    expect(html).not.toContain("아직 공개하지 않을");
    expect(html).toContain('href="#reading-purchase"');
    expect(html).toContain("전체 풀이에서 확인할 이야기");
  });
});
