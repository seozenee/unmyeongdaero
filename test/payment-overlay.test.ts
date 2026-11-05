import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement, ReactNode } from "react";
import { CheckoutPanel } from "@/components/checkout/CheckoutPanel";

const state = vi.hoisted(() => ({
  hook: 0, events: [] as string[],
  load: vi.fn(), request: vi.fn(), fetch: vi.fn(),
}));
vi.mock("react", async importOriginal => ({
  ...await importOriginal<typeof import("react")>(),
  useState: (initial: unknown) => [state.hook++ === 0 ? true : initial, vi.fn()],
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock("@tosspayments/tosspayments-sdk", () => ({ loadTossPayments: state.load }));

function purchaseButton(node: ReactNode): ReactElement<{ onClick: () => Promise<void> }> | undefined {
  if (!node || typeof node !== "object" || !("props" in node)) return;
  const element = node as ReactElement<{ className?: string; children?: ReactNode; onClick: () => Promise<void> }>;
  if (element.type === "button" && element.props.className?.includes("product-button")) return element;
  for (const child of [element.props.children].flat()) {
    const result = purchaseButton(child);
    if (result) return result;
  }
}

describe("토스 결제창과 구매 선택창 전환", () => {
  beforeEach(() => {
    vi.clearAllMocks(); state.hook = 0; state.events = [];
    vi.stubGlobal("fetch", state.fetch);
    state.fetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({
      kind: "toss", clientKey: "test-key", customerKey: "test-buyer", paymentId: "test-order",
      orderName: "가상 결제 검증", totalAmount: 34900, successUrl: "https://example.test/success", failUrl: "https://example.test/fail",
    }) });
    state.fetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({status:"cancelled", reason:"취소"}) });
    state.load.mockResolvedValue({ payment: () => ({ requestPayment: state.request }) });
    state.request.mockImplementation(async () => { state.events.push("toss"); throw new Error("USER_CANCEL"); });
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  it("토스창을 요청하기 전에 선택창을 닫고 취소 후 복원한다", async () => {
    const button = purchaseButton(CheckoutPanel({slug:"factbomb", readingId:"test-reading", price:34900, ctaLabel:"구매",
      onPaymentWindowOpen: () => state.events.push("hide"), onPaymentWindowClose: () => state.events.push("restore"),
    }));
    expect(button).toBeDefined();
    await button!.props.onClick();
    expect(state.events).toEqual(["hide", "toss", "restore"]);
    expect(state.request).toHaveBeenCalledOnce();
  });
  it("SDK 준비에 실패하면 선택창을 숨기지 않는다", async () => {
    state.load.mockRejectedValueOnce(new Error("SDK unavailable"));
    const button = purchaseButton(CheckoutPanel({slug:"factbomb", readingId:"test-reading", price:34900, ctaLabel:"구매",
      onPaymentWindowOpen: () => state.events.push("hide"), onPaymentWindowClose: () => state.events.push("restore"),
    }));
    await button!.props.onClick();
    expect(state.events).toEqual([]);
    expect(state.request).not.toHaveBeenCalled();
  });
});
