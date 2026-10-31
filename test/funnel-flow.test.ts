import { describe, expect, it } from "vitest";
import { REPORTS, type ReportProduct } from "@/lib/reports/catalog";
import { buildFunnel } from "@/lib/story/funnel";

describe("대화 흐름", () => {
  const reports = (REPORTS as readonly ReportProduct[]).filter((item) => item.kind === "report");

  it("고르는 질문 단계가 없다", () => {
    for (const report of reports) {
      const kinds = buildFunnel(report).map((step) => step.kind);
      expect(kinds, report.slug).not.toContain("question");
    }
  });

  it("상품마다 궁금한 것을 적는 칸이 정확히 하나 있다", () => {
    // 없으면 물어볼 데가 사라지고, 둘이면 같은 걸 두 번 묻는 셈이 된다
    for (const report of reports) {
      const details = buildFunnel(report).filter((step) => step.kind === "detail");
      expect(details.length, report.slug).toBe(1);
    }
  });

  it("적지 않아도 된다고 분명히 말한다", () => {
    // 꼭 적어야 하는 줄 알면 거기서 멈추는 사람이 생긴다
    for (const report of reports) {
      const detail = buildFunnel(report).find((step) => step.kind === "detail");
      expect(detail && "prompt" in detail ? detail.prompt : "", report.slug).toMatch(/없어도|안 적|괜찮/);
    }
  });
});
