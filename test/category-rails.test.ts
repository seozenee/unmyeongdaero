// 주제별 줄에 적어 둔 것이 실제 상품을 가리키는지 본다.
//
// 줄마다 쓰는 문구는 상품 슬러그로 찾는다. 슬러그를 한 글자 틀리면 아무 일도 일어나지
// 않는다 — 에러도 없고, 그 카드만 조용히 원래 문구로 돌아간다. 쓴 사람은 썼다고 믿고,
// 화면에는 안 나온다. 그게 가장 늦게 들키는 종류의 틀림이다.
import { describe, expect, it } from "vitest";
import { RAILS } from "@/components/home/CategoryRails";
import { getReport } from "@/lib/reports/catalog";

describe("주제별 줄", () => {
  it("세우려는 상품이 모두 있다", () => {
    for (const rail of RAILS) {
      for (const slug of rail.slugs) {
        expect(getReport(slug), `${rail.heading} → ${slug}`).toBeTruthy();
      }
    }
  });

  it("줄 문구가 그 줄에 없는 상품을 가리키지 않는다", () => {
    for (const rail of RAILS) {
      for (const slug of Object.keys(rail.hooks ?? {})) {
        expect(rail.slugs, `${rail.heading} 의 문구가 가리키는 ${slug}`).toContain(slug);
      }
    }
  });

  it("줄에 세운 상품에는 모두 그 줄의 문구가 있다", () => {
    // 한 줄 안에서 어떤 카드는 줄 문구를, 어떤 카드는 기본 문구를 달면 결이 어긋나 보인다
    for (const rail of RAILS) {
      if (!rail.hooks) continue;
      for (const slug of rail.slugs) {
        expect(Object.keys(rail.hooks), `${rail.heading} 에 문구가 없는 ${slug}`).toContain(slug);
      }
    }
  });

  it("한 상품이 두 묶음에 들어가지 않는다", () => {
    // 겹쳐 두면 내려가다 같은 카드를 또 만난다. 많아 보이려고 한 것이 "볼 게 없구나"로
    // 읽힌다 — 같은 카드를 또 보는 순간 사람은 끝까지 다 봤다고 느낀다.
    const seen = new Map<string, string>();
    for (const rail of RAILS) {
      for (const slug of rail.slugs) {
        const already = seen.get(slug);
        expect(already, `${slug} 가 「${already}」와 「${rail.heading}」 양쪽에 있다`).toBeUndefined();
        seen.set(slug, rail.heading);
      }
    }
  });

  it("같은 상품이 여러 줄에 서면 줄마다 다른 말을 한다", () => {
    const byslug = new Map<string, string[]>();
    for (const rail of RAILS) {
      for (const [slug, hook] of Object.entries(rail.hooks ?? {})) {
        byslug.set(slug, [...(byslug.get(slug) ?? []), hook]);
      }
    }
    for (const [slug, hooks] of Array.from(byslug)) {
      expect(new Set(hooks).size, `${slug} 가 여러 줄에서 같은 말을 한다`).toBe(hooks.length);
    }
  });
});
