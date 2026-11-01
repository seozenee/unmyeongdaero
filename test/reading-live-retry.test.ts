import { afterEach, describe, expect, it, vi } from "vitest";
import { hasLive, startLive, streamLive } from "@/lib/readings/live";

afterEach(() => vi.useRealTimers());

describe("생성 실패 후 즉시 재시도", () => {
  it("실패한 스트림을 다시 붙이지 않고 새 작업을 시작할 수 있다", () => {
    vi.useFakeTimers();
    const live = startLive("failed-retry");
    live.fail("검사 실패");
    expect(hasLive("failed-retry")).toBe(false);
    expect(streamLive("failed-retry")).toBeNull();
    startLive("failed-retry");
    expect(hasLive("failed-retry")).toBe(true);
    vi.advanceTimersByTime(60_000);
    expect(hasLive("failed-retry")).toBe(true);
  });
});
