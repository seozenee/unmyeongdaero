import { describe, expect, it } from "vitest";
import { computeManse } from "..";
import { outlookSchema } from "../outlook";

const subject = { name: "가상검증", birthYear: 1992, birthMonth: 4, birthDay: 12,
  birthHour: 10, birthMinute: 30, isFemale: false, isLunar: false, birthCity: "서울" };
const now = new Date("2026-11-03T03:00:00Z");
describe("평생과 앞으로 10년의 구체적인 선택", () => {
  it("모든 해에 재물·관계·일·할 일·주의가 있으며 80대까지 이어진다", () => {
    const result = computeManse(subject, now);
    const outlook = outlookSchema.parse(result.modules.actionableOutlook);
    expect(outlook.annual.map(row => row.year)).toEqual(Array.from({ length: 10 }, (_, i) => 2026 + i));
    expect(outlook.lifetime.at(-1)!.period).toMatch(/8\d|9\d/);
    for (const row of [...outlook.annual, ...outlook.lifetime]) {
      expect(row.age).toBe(row.year - subject.birthYear + 1);
      for (const key of ["money", "relationship", "work", "do", "caution"] as const) expect(row[key].length).toBeGreaterThan(15);
      expect(row.basis.length).toBeGreaterThan(0);
    }
    expect(result.modules.retrospective).toHaveLength(10);
  });

  /*
    해마다 같은 소리를 하지 않는다.

    전에는 몇 개의 참/거짓으로 문장을 골라서, 스무 해를 펼쳐도 재물 다섯 가지·인연 세 가지가
    전부였다. 2028·2029·2030년이 글자 하나 다르지 않았다. 천간은 해마다 반드시 바뀌므로
    열 해 안에서는 모두 달라야 한다 — 그게 지켜지는지 여기서 지킨다.
  */
  it("열 해가 모두 다른 글이고, 사람이 다르면 순서도 다르다", () => {
    const outlook = outlookSchema.parse(computeManse(subject, now).modules.actionableOutlook);
    for (const key of ["money", "relationship", "work", "do"] as const) {
      expect(new Set(outlook.annual.map(row => row[key])).size, `annual.${key}`).toBe(outlook.annual.length);
      expect(new Set(outlook.pastAnnual.map(row => row[key])).size, `pastAnnual.${key}`).toBe(outlook.pastAnnual.length);
    }
    // 같은 해라도 태어난 날이 다르면 다른 십성이 들어온다
    const other = outlookSchema.parse(computeManse({ ...subject, birthYear: 1995, birthMonth: 9, birthDay: 3 }, now).modules.actionableOutlook);
    expect(other.annual[0]!.money).not.toBe(outlook.annual[0]!.money);
  });

  it("어린아이에게 성인 거래·연애 조언을 붙이지 않는다", () => {
    const outlook = outlookSchema.parse(computeManse({ ...subject, birthYear: 2020 }, now).modules.actionableOutlook);
    for (const row of outlook.annual) {
      expect(row.money).toMatch(/용돈|배움|어른/);
      expect(row.relationship).toMatch(/친구|어른|선생님|역할/);
      expect(`${row.money} ${row.relationship} ${row.work}`).not.toMatch(/동업|배우자|연애|계약서|이직|보증/);
    }
    // 아이에게도 해마다 다른 글이 나간다
    expect(new Set(outlook.annual.map(row => row.money)).size).toBe(outlook.annual.length);
  });
});
