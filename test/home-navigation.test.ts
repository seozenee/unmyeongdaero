import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AppHeader } from "@/components/ui/AppHeader";
import { BottomNav } from "@/components/ui/BottomNav";

vi.mock("@/lib/auth/session", () => ({ getCurrentUser: async () => null }));
vi.mock("next/navigation", () => ({ usePathname: () => "/reports/destiny-full" }));
vi.mock("next/link", () => ({ default: ({ children, ...props }: Record<string, unknown>) =>
  createElement("a", { ...props, "data-client-navigation": "yes" }, children as React.ReactNode) }));

describe("홈으로 돌아가는 동작", () => {
  it("로고는 이전 RSC를 재사용하는 클라이언트 링크 대신 새 문서를 요청한다", async () => {
    const html = renderToStaticMarkup(await AppHeader());
    const home = html.match(/<a[^>]*href="\/"[^>]*>/)![0];
    expect(home).toContain('aria-label="운명대로 홈"');
    expect(home).not.toContain("data-client-navigation");
    expect(html).toContain('href="/search"');
  });
  it("하단 홈도 같은 경로를 쓰고 다른 탭의 클라이언트 이동은 유지한다", () => {
    const html = renderToStaticMarkup(createElement(BottomNav));
    expect(html.match(/<a[^>]*href="\/"[^>]*>/)![0]).not.toContain("data-client-navigation");
    expect(html.match(/<a[^>]*href="\/consult"[^>]*>/)![0]).toContain("data-client-navigation");
  });
});
