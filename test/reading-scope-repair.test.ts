import { describe, expect, it } from "vitest";
import { needsScopeRepair } from "@/lib/readings/calculation";
import { getReport } from "@/lib/reports/catalog";
import { REPORT_CONTENT_VERSION } from "@/lib/story/version";

describe("전반 사주 풀이 보완", () => {
  it.each(["factbomb", "destiny-full", "career", "money", "child-talent"])("%s의 옛 직업 중심 완성본을 한 번 보완한다", reportSlug => {
    const product = getReport(reportSlug)!;
    expect(needsScopeRepair({ reportSlug, status: "ready", script: { sections: [{ title: "옛 목차" }] } })).toBe(true);
    expect(needsScopeRepair({ reportSlug, status: "ready", script: { sections: product.chapters.map(title => ({ title })) } })).toBe(true);
    expect(needsScopeRepair({ reportSlug, status: "ready", script: { contentVersion: REPORT_CONTENT_VERSION, sections: product.chapters.map(title => ({ title })) } })).toBe(false);
  });
  it("보완 도중 실패하면 실패 상태를 숨겨 무한 대기시키지 않는다", () => {
    for (const status of ["generating", "failed"] as const) expect(needsScopeRepair({ reportSlug: "factbomb", status, script: { sections: [] } })).toBe(false);
    expect(needsScopeRepair({ reportSlug: "consult", status: "ready", script: { sections: [] } })).toBe(false);
  });
});
