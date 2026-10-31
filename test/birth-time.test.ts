import { describe, expect, it } from "vitest";
import { parseClockTime } from "@/components/story/BirthForm";

describe("태어난 시각 읽기", () => {
  it("제 모양이면 읽는다", () => {
    expect(parseClockTime("14:25")).toEqual({ hour: 14, minute: 25 });
    expect(parseClockTime("09:30")).toEqual({ hour: 9, minute: 30 });
    expect(parseClockTime("0:00")).toEqual({ hour: 0, minute: 0 });
    expect(parseClockTime("23:59")).toEqual({ hour: 23, minute: 59 });
  });

  it("빈 칸은 읽지 않는다", () => {
    // 여기가 터지던 자리다. <input type="time"> 은 지우면 빈 문자열이 되고,
    // 전에는 분이 NaN 이 되어 그대로 서버까지 갔다 — "입력하신 내용을 다시
    // 확인해 주세요"가 뜨는데 어디를 확인하라는 말인지 알 수가 없었다.
    expect(parseClockTime("")).toBeNull();
    expect(parseClockTime("   ")).toBeNull();
    expect(parseClockTime("14")).toBeNull();
    expect(parseClockTime("14:")).toBeNull();
    expect(parseClockTime(":25")).toBeNull();
  });

  it("시계에 없는 시각은 읽지 않는다", () => {
    expect(parseClockTime("24:00")).toBeNull();
    expect(parseClockTime("12:60")).toBeNull();
    expect(parseClockTime("-1:30")).toBeNull();
  });
});
