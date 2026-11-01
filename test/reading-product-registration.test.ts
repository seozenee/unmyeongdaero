import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseRepository } from "@/lib/db/supabase";

const { insert, upsert, single } = vi.hoisted(() => ({ insert: vi.fn(), upsert: vi.fn(), single: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdmin: () => ({ from: (table: string) => table === "reports"
  ? { upsert } : { insert: (payload: unknown) => { insert(payload); return { select: () => ({ single }) }; } } }) }));
const input = { userId: "qa-user", reportSlug: "factbomb", subject: { name: "검토", birthYear: 1995, birthMonth: 5,
  birthDay: 19, birthHour: 12, isFemale: true, isLunar: false, birthCity: "서울" }, partner: null, answers: {} };
const saved = { id: "qa-reading", user_id: input.userId, report_slug: input.reportSlug, subject: input.subject,
  partner: null, answers: {}, status: "draft" };
const missing = { data: null, error: { code: "23503", message: 'violates foreign key constraint "readings_report_slug_fkey"' } };

beforeEach(() => { vi.clearAllMocks(); upsert.mockResolvedValue({ data: null, error: null }); });

describe("새 상품의 입력 저장", () => {
  it("상품 등록이 빠졌으면 기존 운영값을 덮지 않는 등록 후 같은 입력을 한 번만 재시도한다", async () => {
    single.mockResolvedValueOnce(missing).mockResolvedValueOnce({ data: saved, error: null });
    const result = await createSupabaseRepository().createReading(input);
    expect(result.reportSlug).toBe("factbomb");
    expect(insert).toHaveBeenCalledTimes(2);
    expect(insert.mock.calls[0]![0]).toEqual(insert.mock.calls[1]![0]);
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ slug: "factbomb", price: 12900 }), { onConflict: "slug", ignoreDuplicates: true });
  });
  it("이미 등록된 상품은 추가 쓰기 없이 한 번에 저장한다", async () => {
    single.mockResolvedValueOnce({ data: saved, error: null });
    await createSupabaseRepository().createReading(input);
    expect(insert).toHaveBeenCalledTimes(1);
    expect(upsert).not.toHaveBeenCalled();
  });
  it("사용자 외래 키 오류에는 상품을 등록하거나 재시도하지 않는다", async () => {
    single.mockResolvedValueOnce({ data: null, error: { code: "23503", message: 'violates foreign key constraint "readings_user_id_fkey"' } });
    await expect(createSupabaseRepository().createReading(input)).rejects.toThrow("readings_user_id_fkey");
    expect(upsert).not.toHaveBeenCalled();
    expect(insert).toHaveBeenCalledTimes(1);
  });
  it("코드 카탈로그에 없는 상품을 임의로 만들지 않는다", async () => {
    single.mockResolvedValueOnce(missing);
    await expect(createSupabaseRepository().createReading({ ...input, reportSlug: "unknown-product" })).rejects.toThrow("readings_report_slug_fkey");
    expect(upsert).not.toHaveBeenCalled();
  });
});
