import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { RAILS } from "@/components/home/CategoryRails";
import { getPoster } from "@/components/home/posters";
import { getWebtoonAsset } from "@/components/webtoon/assets";
import { getReport, REPORTS } from "@/lib/reports/catalog";
import { buildFunnel } from "@/lib/story/funnel";
import { buildIntroShots } from "@/lib/story/webtoon";
import { SHOTS } from "@/lib/story/webtoon-assets";

const product = getReport("factbomb")!;

describe("팩폭사주 영상과 메인 노출", () => {
  it("홈 첫 추천이 팩폭사주이며 전용 포스터 영상을 연결한다", () => {
    const html = renderToStaticMarkup(createElement(HeroCarousel, { products: [...REPORTS] }));
    expect(html.match(/href="([^"]+)"/)?.[1]).toBe("/reports/factbomb");
    expect(html).toContain("/webtoon/gangho/poster-factbomb.mp4");
    expect(html).toContain("지금 추천");
    expect(html).not.toContain("1위");
    expect(getPoster(product.slug, product.guide)?.video).toBe("/webtoon/gangho/poster-factbomb.mp4");
    expect(RAILS.find(rail => rail.id === "destiny")?.slugs[0]).toBe("factbomb");
    expect(RAILS.flatMap(rail => rail.slugs).filter(slug => slug === "factbomb")).toHaveLength(1);
  });

  it("입장·대화·표지에서 쓰는 모든 컷에 실제 이미지와 영상이 있다", () => {
    const required = new Set([
      ...buildIntroShots(product).map(shot => shot.assetKey),
      ...buildFunnel(product).flatMap(step => step.kind === "panel" ? [step.asset] : []),
      "panel-second", "report-cover", "poster-factbomb",
    ]);
    expect(required.size).toBe(11);
    for (const key of Array.from(required)) {
      const asset = getWebtoonAsset("gangho", key);
      expect(asset, key).toBeTruthy();
      for (const path of [asset!.image, asset!.video]) {
        expect(path, key).toMatch(/^\/webtoon\/gangho\//);
        expect(existsSync(resolve("public", path!.slice(1))), path).toBe(true);
      }
    }
    const withCharacter = SHOTS.gangho.filter(shot => shot.key === "poster-factbomb" || ["intro-3", "intro-4", "intro-5", "panel-brush", "panel-unfold", "report-cover"].includes(shot.key));
    expect(withCharacter.every(shot => shot.character)).toBe(true);
  });

  it("강호의 입장 다음에도 같은 반말 화자가 이어지고 출생 입력과 미리보기가 있다", () => {
    const steps = buildFunnel(product);
    const spoken = steps.flatMap(step => step.kind === "line" && step.speaker === "guide" ? [step.text] : []).join(" ");
    expect(spoken).toContain("난 돌직구 강호야");
    expect(spoken).not.toMatch(/드릴게요|고마워요|펼쳐 볼게요/);
    expect(steps.filter(step => step.kind === "birth")).toEqual([{ kind: "birth", target: "subject", optional: false }]);
    expect(steps.at(-1)).toEqual({ kind: "submit", label: "내 사주, 제대로 짚어 보기" });
    expect(buildFunnel(getReport("destiny-full")!).some(step => step.kind === "line" && step.text.includes("읽어 드릴게요"))).toBe(true);
  });
});
