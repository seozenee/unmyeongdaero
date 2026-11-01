import { describe, expect, it } from "vitest";
import { needsCalendarRepair } from "@/lib/readings/calculation";
import { buildManseTopics } from "@/lib/manse";

const subject = { name: "가상검증", birthYear: 2017, birthMonth: 6, birthDay: 1, birthHour: null,
  isFemale: true, isLunar: true, birthCity: "서울" };

describe("저장된 음력 풀이 보완", () => {
  it("양력 완성본은 계산 버전 때문에 바꾸지 않는다", () => {
    expect(needsCalendarRepair({ subject: { ...subject, isLunar: false }, partner: null, sazu: {} })).toBe(false);
  });
  it("이전 음력 자료와 상대가 음력인 자료는 보완 대상으로 인식한다", () => {
    expect(needsCalendarRepair({ subject, partner: null, sazu: {} })).toBe(true);
    expect(needsCalendarRepair({ subject: { ...subject, isLunar: false }, partner: subject, sazu: {} })).toBe(true);
  });
  it("보완한 계산은 다시 작성 대상으로 반복 판정하지 않는다", () => {
    const sazu = buildManseTopics([], subject, null);
    expect(needsCalendarRepair({ subject, partner: null, sazu })).toBe(false);
  });
});
