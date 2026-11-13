import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Payment } from "@/lib/db/types";
import { pushRequestSchema, scheduleAdminPaymentPush } from "@/lib/admin/push";
import { POST } from "@/app/api/admin/push/route";

const mocks = vi.hoisted(() => ({
  after: vi.fn<(work: () => Promise<void>) => void>(),
  sendNotification: vi.fn(),
  from: vi.fn(),
  getUser: vi.fn(),
  getUserById: vi.fn(),
}));
vi.mock("next/server", async (original) => ({ ...await original<typeof import("next/server")>(), after: mocks.after }));
vi.mock("web-push", () => ({ default: { sendNotification: mocks.sendNotification } }));
vi.mock("@/lib/env", () => ({ modes: { data: () => "supabase" }, isProduction: false }));
vi.mock("@/lib/auth/session", () => ({ getCurrentUser: mocks.getUser }));
vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdmin: () => ({ from: mocks.from, auth: { admin: { getUserById: mocks.getUserById } } }),
}));

const device = {
  id: "device-id", user_id: "operator", email: "admin@example.test",
  endpoint: "https://fcm.googleapis.com/fcm/send/fixture", p256dh: "test-key", auth: "test-auth",
};
const paid = (): Payment => ({
  id: "payment-row", paymentId: "sd_fixture", provider: "toss", userId: "buyer", reportSlug: "factbomb",
  pgTransactionId: "pg-private-value", readingId: "private-reading-id", amount: 12900,
  status: "paid", failureReason: null, createdAt: new Date().toISOString(), paidAt: new Date().toISOString(),
});

describe("관리자 기기 결제 알림", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("ADMIN_EMAILS", "admin@example.test");
    vi.stubEnv("ADMIN_PUSH_PUBLIC_KEY", Buffer.alloc(65).toString("base64url"));
    vi.stubEnv("ADMIN_PUSH_PRIVATE_KEY", Buffer.alloc(32).toString("base64url"));
  });
  afterEach(() => vi.unstubAllEnvs());

  it("관리자가 아닌 계정은 기기 조회와 테스트 발송을 할 수 없다", async () => {
    mocks.getUser.mockResolvedValue({ id: "buyer", email: "buyer@example.test" });
    const response = await POST(new Request("https://example.test/api/admin/push", {
      method: "POST", body: JSON.stringify({ action: "test", endpoint: device.endpoint }),
    }));
    expect(response.status).toBe(404);
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.sendNotification).not.toHaveBeenCalled();
  });

  it("지원하는 알림 서비스의 HTTPS 주소만 받는다", () => {
    for (const endpoint of [device.endpoint, "https://web.push.apple.com/Q", "https://updates.push.services.mozilla.com/wpush/v2/Q"]) {
      expect(pushRequestSchema.safeParse({ action: "test", endpoint }).success).toBe(true);
    }
    for (const endpoint of ["invalid", "http://fcm.googleapis.com/Q", "https://127.0.0.1:443/Q", "https://fcm.googleapis.com.example.test/Q", "https://user@web.push.apple.com/Q"]) {
      expect(pushRequestSchema.safeParse({ action: "test", endpoint }).success).toBe(false);
    }
  });

  it("모의 결제, 미승인 결제, 과거 결제는 알림을 예약하지 않는다", () => {
    scheduleAdminPaymentPush({ ...paid(), provider: "mock" }, "팩폭사주");
    scheduleAdminPaymentPush({ ...paid(), status: "pending" }, "팩폭사주");
    scheduleAdminPaymentPush({ ...paid(), paidAt: "2000-01-01T00:00:00Z" }, "팩폭사주");
    expect(mocks.after).not.toHaveBeenCalled();
  });

  it("승인 콜백과 웹훅이 겹쳐도 현재 관리자 기기에 한 번 보내고 주문 링크만 넣는다", async () => {
    let claimed = false;
    const claim = vi.fn(async () => {
      if (claimed) return { data: null };
      claimed = true;
      return { data: { device_id: device.id } };
    });
    const markSent = vi.fn(async () => ({}));
    const upsert = vi.fn(() => ({ throwOnError: async () => ({}) }));
    const update = vi.fn((changes: { sent_at?: string }) => changes.sent_at
      ? { match: () => ({ eq: () => ({ throwOnError: markSent }) }) }
      : { match: () => ({ is: () => ({ lt: () => ({ select: () => ({ maybeSingle: () => ({ throwOnError: claim }) }) }) }) }) });
    const select = () => ({ lte: () => ({ throwOnError: async () => ({
      data: [device, { ...device, id: "removed-device", user_id: "removed" }],
    }) }) });
    mocks.from.mockImplementation((table) => table === "admin_push_devices" ? { select } : { upsert, update });
    mocks.getUserById.mockImplementation(async (id) => ({ data: { user: {
      email: id === device.user_id ? device.email : "changed@example.test",
    } } }));
    mocks.sendNotification.mockResolvedValue({});

    const payment = paid();
    scheduleAdminPaymentPush(payment, "팩폭사주");
    scheduleAdminPaymentPush(payment, "팩폭사주");
    await Promise.all(mocks.after.mock.calls.map(([run]) => run()));

    expect(claim).toHaveBeenCalledTimes(2);
    expect(mocks.sendNotification).toHaveBeenCalledOnce();
    expect(markSent).toHaveBeenCalledOnce();
    expect(JSON.parse(mocks.sendNotification.mock.calls[0]![1])).toEqual({
      title: "새 결제가 완료됐어요", body: "팩폭사주 · 12,900원",
      url: "/admin/payments?order=sd_fixture", tag: "sd_fixture",
    });
  });
});
