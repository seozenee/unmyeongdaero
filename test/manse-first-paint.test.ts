import { Children, isValidElement } from "react";
import { describe, expect, it, vi } from "vitest";
import MansePage from "@/app/(app)/readings/[id]/manse/page";
import { ManseConfirm } from "@/components/manse/ManseConfirm";
import { ReadingWebtoon } from "@/components/manse/ReadingWebtoon";
import { callOpenAi } from "@/lib/ai/openai";

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: async () => ({ id: "sample-user" }), loginUrl: (path: string) => path,
}));
vi.mock("@/lib/db", () => ({ getRepository: () => ({ getReading: async () => ({
  id: "sample-reading", userId: "sample-user", reportSlug: "destiny-full", answers: {}, partner: null,
  subject: { name: "가상고객", birthYear: 1995, birthMonth: 5, birthDay: 19, birthHour: 12,
    birthMinute: 30, isFemale: true, isLunar: false, birthCity: "서울" },
}) }) }));
vi.mock("@/lib/reports/store", async () => {
  const { getReport } = await import("@/lib/reports/catalog");
  return { loadReport: async (slug: string) => getReport(slug) };
});
// 응답하지 않는 제공자여도 첫 화면을 만들 수 있어야 한다.
vi.mock("@/lib/ai/openai", () => ({ callOpenAi: vi.fn(() => new Promise(() => {})) }));

describe("결제 전 첫 화면", () => {
  it("AI를 호출하지 않고 완성된 미리보기와 구매 패널을 함께 돌려준다", async () => {
    const page = await MansePage({ params: { id: "sample-reading" }, searchParams: {} });
    const children = Children.toArray(page.props.children).filter(isValidElement);
    const preview = children.find(child => child.type === ReadingWebtoon);
    expect(preview).toBeTruthy();
    expect((preview!.props as { narrative: { personality: { body: string[] } } }).narrative.personality.body.length).toBeGreaterThan(0);
    expect(children.some(child => child.type === ManseConfirm)).toBe(true);
    expect(callOpenAi).not.toHaveBeenCalled();
  }, 1000);
});
