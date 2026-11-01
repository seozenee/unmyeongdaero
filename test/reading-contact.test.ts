import { beforeEach, describe, expect, it, vi } from "vitest";
import { PATCH } from "@/app/api/readings/[id]/route";
import { AppError } from "@/lib/errors";

const mocks = vi.hoisted(() => ({ user: vi.fn(), owned: vi.fn(), update: vi.fn(), notify: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getCurrentUser: mocks.user }));
vi.mock("@/lib/readings/service", () => ({ getOwnedPurchasedReading: mocks.owned }));
vi.mock("@/lib/db", () => ({ getRepository: () => ({ updateReading: mocks.update }) }));
vi.mock("@/lib/readings/notify", () => ({ notifyReading: mocks.notify }));
const request = (body: unknown) => new Request("http://localhost/api/readings/r-1", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

beforeEach(() => {
  vi.resetAllMocks();
  mocks.user.mockResolvedValue({ id: "u-1" });
  mocks.owned.mockResolvedValue({ reading: { id: "r-1", userId: "u-1", status: "generating" }, report: { slug: "factbomb" } });
  mocks.notify.mockResolvedValue({ sent: true });
});

describe("구매한 풀이의 알림 번호 등록", () => {
  it("로그인하지 않으면 저장하지 않는다", async () => {
    mocks.user.mockResolvedValue(null);
    expect((await PATCH(request({ notifyPhone: "01012345678", consent: true }), { params: { id: "r-1" } })).status).toBe(401);
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("소유·구매 확인을 통과하지 못하면 저장하거나 발송하지 않는다", async () => {
    mocks.owned.mockRejectedValue(new AppError(403, "FORBIDDEN", "권한이 없어요."));
    expect((await PATCH(request({ notifyPhone: "01012345678", consent: true }), { params: { id: "other" } })).status).toBe(403);
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.notify).not.toHaveBeenCalled();
  });
  it.each([{ notifyPhone: "123", consent: true }, { notifyPhone: "01012345678", consent: false }])("잘못된 번호나 수신 동의 누락을 거절한다", async body => {
    expect((await PATCH(request(body), { params: { id: "r-1" } })).status).toBe(400);
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("생성 중이면 정규화한 번호와 동의 시각을 저장하고 완성 알림을 기다린다", async () => {
    const response = await PATCH(request({ notifyPhone: "+82 10 1234 5678", consent: true }), { params: { id: "r-1" } });
    expect(await response.json()).toMatchObject({ registered: true, ready: false, sent: false });
    expect(mocks.update).toHaveBeenCalledWith("r-1", expect.objectContaining({ notifyPhone: "01012345678", notifyConsentAt: expect.any(String) }));
    expect(mocks.notify).not.toHaveBeenCalled();
  });
  it("이미 완성됐다면 새로 등록한 번호로 완성 알림을 요청한다", async () => {
    mocks.owned.mockResolvedValue({ reading: { id: "r-1", status: "ready", notifyPhone: null }, report: { slug: "factbomb" } });
    const response = await PATCH(request({ notifyPhone: "01012345678", consent: true }), { params: { id: "r-1" } });
    expect(await response.json()).toMatchObject({ sent: true });
    expect(mocks.notify).toHaveBeenCalledWith(expect.objectContaining({ notifyPhone: "01012345678", notifiedKind: null }), { slug: "factbomb" }, "reading-ready");
  });
});
