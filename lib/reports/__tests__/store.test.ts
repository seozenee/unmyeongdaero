import { beforeEach, describe, expect, it, vi } from "vitest";
import { REPORTS } from "../catalog";

const { select } = vi.hoisted(() => ({ select: vi.fn() }));
vi.mock("@/lib/env", () => ({ modes: { data: () => "supabase" } }));
vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdmin: () => ({ from: () => ({ select }) }) }));
import { loadReports } from "../store";

const base = REPORTS.find(report => report.kind === "report" && !report.bundle)!;
beforeEach(() => select.mockReset());

describe("published catalog used by storefront and sitemap", () => {
  it("excludes a built-in product explicitly hidden in the database", async () => {
    select.mockResolvedValue({ data: [{ slug: base.slug, is_active: false }], error: null });
    expect((await loadReports()).some(report => report.slug === base.slug)).toBe(false);
    expect((await loadReports("report", { includeHidden: true })).some(report => report.slug === base.slug)).toBe(true);
  });
  it("includes a published product created through the admin page", async () => {
    select.mockResolvedValue({ data: [{ ...base, slug: "new-published-report", is_active: true }], error: null });
    expect((await loadReports()).some(report => report.slug === "new-published-report")).toBe(true);
  });
});
