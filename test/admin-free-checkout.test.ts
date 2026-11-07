import { beforeEach, describe, expect, it, vi } from "vitest";
import { listReports } from "@/lib/reports/catalog";
import { startCheckout } from "@/lib/payments/service";

/*
  운영자 계정은 모든 상품을 0원으로 발급한다.

  출시 전 검수에서 열여덟 상품을 실제로 끝까지 읽어 봐야 한다. 그때마다 결제하거나
  FREE_ACCESS 를 켜는 것은 둘 다 나쁘다. 앞의 것은 돈이 들고, 뒤의 것은 손님에게도
  공짜가 된다. 운영자만 열리는지, 손님은 그대로 결제창으로 가는지 여기서 지킨다.
*/
const repo = vi.hoisted(() => ({ getReading: vi.fn(), createPayment: vi.fn(), updatePayment: vi.fn(), getPayment: vi.fn(), createPurchase: vi.fn(), createConsultSession: vi.fn() }));
vi.mock("@/lib/db", () => ({ getRepository: () => repo }));
vi.mock("@/lib/env", () => ({ modes: { payment: () => "mock" }, env: {}, isProduction: true, isFreeAccess: false }));

const admin = { id: "owner", displayName: "운영자", provider: "email" as const, avatarUrl: null, email: "Review@UnmyeongDaero.com" };
const customer = { id: "buyer", displayName: "손님", provider: "kakao" as const, avatarUrl: null, email: "guest@example.com" };

describe("운영자 무료 발급", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_EMAILS = "review@unmyeongdaero.com, dev@example.com";
    repo.createPayment.mockImplementation(async (input: Record<string, unknown>) => ({ ...input, id: "row", status: "pending" }));
    repo.createPurchase.mockResolvedValue({ id: "purchase" });
    repo.createConsultSession.mockResolvedValue({ id: "session" });
  });

  for (const product of listReports("report")) {
    it(`${product.slug}: 운영자는 0원으로 바로 열람권을 받는다`, async () => {
      repo.getReading.mockResolvedValue({ id: "input", userId: admin.id, reportSlug: product.slug, subject: { name: "검수" } });
      const result = await startCheckout(admin, product.slug, "input");
      expect(result).toMatchObject({ kind: "free", redirect: `/reports/${product.slug}/read` });
      expect(repo.createPayment).toHaveBeenCalledWith(expect.objectContaining({ amount: 0, reportSlug: product.slug }));
      expect(repo.updatePayment).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ status: "paid" }));
      expect(repo.createPurchase).toHaveBeenCalledWith(expect.objectContaining({ userId: admin.id, reportSlug: product.slug }));
    });
  }

  it("1:1 상담도 운영자에게는 세션이 바로 열린다", async () => {
    repo.getReading.mockResolvedValue({ id: "input", userId: admin.id, reportSlug: "consult", subject: { name: "검수" } });
    const result = await startCheckout(admin, "consult", "input");
    expect(result).toMatchObject({ kind: "free", redirect: "/consult/session" });
  });

  it("손님은 운영자 경로를 타지 않고 정가로 결제한다", async () => {
    repo.getReading.mockResolvedValue({ id: "input", userId: customer.id, reportSlug: "life", subject: { name: "손님" } });
    const result = await startCheckout(customer, "life", "input");
    expect(result).toMatchObject({ kind: "mock" });
    expect(repo.createPayment).toHaveBeenCalledWith(expect.objectContaining({ amount: expect.any(Number) }));
    expect(repo.createPayment.mock.calls[0]![0].amount).toBeGreaterThan(0);
    expect(repo.updatePayment).not.toHaveBeenCalled();
  });

  /*
    0원을 막는 DB 가 남아 있어도 운영자는 들어간다.

    payments.amount 에 `check (amount > 0)` 이 걸린 채로 배포된 곳이 있다. 그 환경에서
    운영자가 검수하러 들어오면 "결제를 준비하지 못했어요"로 끝났다. 마이그레이션을 올리지
    않아도 1원으로 발급되게 해 둔다 — 1원짜리 기록이 남는 쪽이 막히는 쪽보다 낫다.
  */
  it("DB 가 0원을 막아도 1원으로 발급한다", async () => {
    repo.getReading.mockResolvedValue({ id: "input", userId: admin.id, reportSlug: "life", subject: { name: "검수" } });
    repo.createPayment.mockReset();
    repo.createPayment
      .mockRejectedValueOnce(new Error('new row violates check constraint "payments_amount_check"'))
      .mockImplementation(async (input: Record<string, unknown>) => ({ ...input, id: "row", status: "pending" }));

    const result = await startCheckout(admin, "life", "input");
    expect(result).toMatchObject({ kind: "free", redirect: "/reports/life/read" });
    expect(repo.createPayment).toHaveBeenCalledTimes(2);
    expect(repo.createPayment.mock.calls[0]![0].amount).toBe(0);
    expect(repo.createPayment.mock.calls[1]![0].amount).toBe(1);
    // 금액이 얼마든 매출에서 걸러지도록 수단과 거래번호는 그대로 남는다
    expect(repo.createPayment.mock.calls[1]![0].provider).toBe("mock");
    expect(repo.updatePayment).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
      status: "paid", pgTransactionId: expect.stringContaining("admin_free_"),
    }));
  });

  it("운영자 목록이 비어 있으면 아무도 공짜로 받지 못한다", async () => {
    process.env.ADMIN_EMAILS = "";
    repo.getReading.mockResolvedValue({ id: "input", userId: admin.id, reportSlug: "life", subject: { name: "검수" } });
    expect(await startCheckout(admin, "life", "input")).toMatchObject({ kind: "mock" });
  });

  it("남의 입력 정보로는 운영자도 발급받지 못한다", async () => {
    repo.getReading.mockResolvedValue({ id: "input", userId: customer.id, reportSlug: "life", subject: { name: "손님" } });
    await expect(startCheckout(admin, "life", "input")).rejects.toThrow("입력하신 풀이 정보");
    expect(repo.createPayment).not.toHaveBeenCalled();
  });
});
