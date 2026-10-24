import { describe, expect, it } from "vitest";
import { describeFailure } from "../service";

describe("생성 실패 분류", () => {
  it("인증 실패는 다시 눌러도 풀리지 않는다", () => {
    const result = describeFailure(Object.assign(new Error("invalid x-api-key"), { status: 401 }));
    expect(result.retryable).toBe(false);
    expect(result.tag).toBe("config");
    // 되지 않을 일을 권하지 않는다
    expect(result.message).not.toMatch(/다시 시도/);
  });

  it("설정이 빠진 것도 마찬가지다", () => {
    const error = new Error("설정 없음");
    error.name = "ServiceNotConfiguredError";
    expect(describeFailure(error).retryable).toBe(false);
  });

  it("혼잡·서버 오류는 기다리면 풀린다", () => {
    for (const status of [429, 500, 529]) {
      const result = describeFailure(Object.assign(new Error("busy"), { status }));
      expect(result.retryable).toBe(true);
      expect(result.tag).toBe("busy");
    }
  });

  it("모르는 오류는 재시도를 막지 않는다", () => {
    expect(describeFailure(new Error("???")).retryable).toBe(true);
  });
});
