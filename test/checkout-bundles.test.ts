import { beforeEach, describe, expect, it, vi } from "vitest";
import { getReport } from "@/lib/reports/catalog";
import { COMMERCE_RESET_AT } from "@/lib/commerce-reset";
import { startCheckout, confirmPayment } from "@/lib/payments/service";

const repo = vi.hoisted(() => ({ getReading: vi.fn(), createPayment: vi.fn(), getPayment: vi.fn(), createPurchase: vi.fn() }));
vi.mock("@/lib/db", () => ({ getRepository: () => repo }));
vi.mock("@/lib/env", () => ({ modes:{payment:()=>"mock"}, env:{}, isProduction:false, isFreeAccess:true }));
const user = {id:"buyer",displayName:"가상검증",provider:"dev" as const,avatarUrl:null,email:null};
const product = getReport("destiny-full--complete")!;
const reading = { id:"input",userId:user.id,reportSlug:product.slug,subject:{name:"가상검증"} };

describe("묶음 결제 금액·열람권·초기화 경계", () => {
  beforeEach(() => { vi.clearAllMocks(); repo.getReading.mockResolvedValue(reading); });
  it("선택한 묶음의 서버 가격으로 주문을 만든다", async () => {
    const result = await startCheckout(user, product.slug, reading.id);
    expect(result).toMatchObject({kind:"mock",totalAmount:product.price});
    expect(repo.createPayment).toHaveBeenCalledWith(expect.objectContaining({reportSlug:product.slug,amount:product.price}));
  });
  it("다른 상품의 입력으로 묶음 주문을 만들지 못한다", async () => {
    await expect(startCheckout(user,"money",reading.id)).rejects.toThrow("입력하신 풀이 정보");
    expect(repo.createPayment).not.toHaveBeenCalled();
  });
  it("승인된 묶음은 같은 결제에 연결된 통합 리포트 열람권을 지급한다", async () => {
    repo.getPayment.mockResolvedValue({id:"row",paymentId:"order",status:"paid",userId:user.id,reportSlug:product.slug,readingId:reading.id,createdAt:new Date(Date.parse(COMMERCE_RESET_AT)+1000).toISOString()});
    const result = await confirmPayment("order",{userId:user.id});
    expect(result).toEqual({status:"paid",redirect:`/reports/${product.slug}/read`});
    expect(repo.createPurchase).toHaveBeenCalledWith({userId:user.id,reportSlug:product.slug,paymentRowId:"row",readingId:reading.id});
  });
  it("초기화 이전의 승인 주문을 재전송해도 지운 열람권이 복구되지 않는다", async () => {
    repo.getPayment.mockResolvedValue({userId:user.id,createdAt:"2026-11-01T00:00:00Z",status:"paid"});
    await expect(confirmPayment("old-order",{userId:user.id})).rejects.toThrow("초기화 이전 주문");
    expect(repo.createPurchase).not.toHaveBeenCalled();
  });
});
