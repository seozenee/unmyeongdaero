import { describe, expect, it } from "vitest";
import { buildManseTopics } from "..";
import type { BirthProfile } from "../../db/types";

const male: BirthProfile = {
  name: "남", birthYear: 1990, birthMonth: 3, birthDay: 14,
  birthHour: 7, birthMinute: 20, isFemale: false, isLunar: false, birthCity: "서울",
};
const female: BirthProfile = { ...male, name: "여", isFemale: true };

/**
 * 상품마다 다른 재료.
 *
 * 한동안 토픽이 달라도 같은 원국 한 벌만 내보냈다. 그래서 재물운 사주와 평생사주의
 * 글이 비슷해졌다 — 상품만 다르고 재료가 같으면 글도 같아진다.
 * 돈·몸·인연을 보는 자리는 명리에서 따로 정해져 있으니 따로 센다.
 */
describe("토픽 전용 계산", () => {
  const sazu = buildManseTopics(["money", "health", "love"], male, null, new Date("2026-11-01"));
  const modules = sazu.money!.modules as Record<string, Record<string, unknown>>;

  it("돈 보는 자리를 따로 센다", () => {
    const wealth = modules.wealth as {
      element: string;
      natalWealth: { count: number; talJaeRisk: boolean; note: string };
      carryCapacity: { canCarry: boolean };
      fortuneLayers: Array<{ label: string; favorable: boolean }>;
    };
    // 일간 무(토)가 극하는 것은 수 — 그게 이 사람의 재물이다
    expect(wealth.element).toBe("수");
    expect(wealth.fortuneLayers.map((layer) => layer.label)).toEqual(["열 해 흐름", "그해 흐름", "그달 흐름"]);
    expect(typeof wealth.natalWealth.talJaeRisk).toBe("boolean");
    expect(wealth.natalWealth.note.length).toBeGreaterThan(10);
  });

  it("몸은 치우침과 부딪힘 둘로 본다", () => {
    const health = modules.healthBalance as {
      organs: Array<{ element: string; signalNote: string }>;
      vulnerabilities: Array<{ mechanism: string }>;
      dayMasterFoundation: { note: string };
    };
    expect(health.organs).toHaveLength(5);
    expect(health.dayMasterFoundation.note.length).toBeGreaterThan(10);
    // 병명은 적지 않는다 — 우리는 의사가 아니다
    const text = JSON.stringify(health);
    expect(text).not.toMatch(/암|당뇨|고혈압|진단|처방전/);
  });

  it("인연이 닿는 해를 연도로 뽑는다", () => {
    const romance = (sazu.love!.modules as Record<string, Record<string, unknown>>).romance as {
      meetings: Array<{ age: number; year: number; reasons: string[]; comer: string; weight: number }>;
    };
    expect(romance.meetings.length).toBeGreaterThan(0);
    for (const meeting of romance.meetings) {
      // 연도와 나이가 맞물려야 한다 — 한 살만 어긋나도 글 전체가 의심받는다
      expect(meeting.year - meeting.age).toBe(1990 - 1);
      expect(meeting.reasons.length).toBeGreaterThan(0);
      expect(meeting.comer.length).toBeGreaterThan(5);
    }
    // 근거가 겹치는 해가 앞에 온다
    const weights = romance.meetings.map((item) => item.weight);
    expect(weights).toEqual([...weights].sort((a, b) => b - a));
    // 얼굴·이름·직업은 계산하지 않으므로 적지 않는다
    expect(JSON.stringify(romance.meetings)).not.toMatch(/키가|얼굴|이름은|직업은/);
  });

  it("나이를 글자로 적어 둔다 — 모델이 다시 세지 못하게", () => {
    // 2012년생에게 "2028년 스물일곱" 이라고 쓴 적이 있다. 열일곱이 맞다.
    const kid = buildManseTopics(["life"], { ...male, birthYear: 2012, birthMonth: 5, birthDay: 15, birthHour: 12 }, null, new Date("2026-11-01"));
    const life = (kid.life!.modules as Record<string, Record<string, unknown>>).lifeTimeline as {
      해마다: Array<{ age: number; year: number; label: string }>;
      열해: Array<{ startAge: number; endAge: number; label: string }>;
    };
    const y2028 = life.해마다.find((item) => item.year === 2028)!;
    expect(y2028.age).toBe(17);
    expect(y2028.label).toBe("2028년(열일곱 살)");

    const y2031 = life.해마다.find((item) => item.year === 2031)!;
    expect(y2031.label).toBe("2031년(스무 살)");

    // 스물한 살 — 「살」 앞에서는 하나가 아니라 한
    const y2032 = life.해마다.find((item) => item.year === 2032)!;
    expect(y2032.label).toBe("2032년(스물한 살)");

    for (const span of life.열해) {
      const years = span.label.match(/\((\d+)~(\d+)년\)/)!;
      expect(Number(years[1]) - 2012 + 1).toBe(span.startAge);
      expect(Number(years[2]) - 2012 + 1).toBe(span.endAge);
    }
    expect(life.열해[1]!.label).toBe("열일곱부터 스물여섯까지(2028~2037년)");
  });

  it("짝 쪽 별은 남녀가 다르다", () => {
    const his = (buildManseTopics(["love"], male, null).love!.modules as Record<string, Record<string, unknown>>)
      .romance as { partnerStar: { element: string } };
    const hers = (buildManseTopics(["love"], female, null).love!.modules as Record<string, Record<string, unknown>>)
      .romance as { partnerStar: { element: string } };
    // 남자는 재성(내가 극하는 것), 여자는 관성(나를 극하는 것)을 짝으로 본다
    expect(his.partnerStar.element).toBe("수");
    expect(hers.partnerStar.element).toBe("목");
  });
});
