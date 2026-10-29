import { describe, expect, it } from "vitest";
import { computeFourPillars } from "../pillars";
import { computeDecadeFortune } from "../decade";

// 사주가 틀리는 자리는 늘 경계다. 한가운데 태어난 사람은 어떤 엔진으로 계산해도 같지만,
// 절입 몇 분 전후, 자정 전후, 입춘 전후에서 갈린다. 여기 모아 두고 회귀를 막는다.
//
// 값 자체를 외부 역서와 대조한 것은 아니다. 이 테스트가 지키는 것은 "경계에서 갈린다"는
// 성질과, 한 번 정한 처리 방식이 조용히 바뀌지 않는다는 것이다.

const seoul = (y: number, m: number, d: number, h: number, min = 0) =>
  computeFourPillars({ year: y, month: m, day: d, hour: h, minute: min, isLunar: false, city: "서울" });

describe("경계 — 연주는 입춘에서 갈린다", () => {
  it("입춘 전은 지난해 간지를 쓴다", () => {
    // 2024 입춘은 2월 4일. 그 전날과 그 다음 날의 연주가 달라야 한다.
    const before = seoul(2024, 2, 3, 12);
    const after = seoul(2024, 2, 10, 12);
    expect(before.year.full).not.toBe(after.year.full);
  });

  it("1월 1일은 아직 지난해 간지다", () => {
    expect(seoul(2024, 1, 1, 12).year.full).toBe(seoul(2023, 12, 20, 12).year.full);
  });
});

describe("경계 — 월주는 절입에서 갈린다", () => {
  it("같은 달 안에서도 절입 앞뒤로 월주가 바뀐다", () => {
    // 2024년 3월 절입(경칩)은 3월 5일 무렵
    const before = seoul(2024, 3, 1, 12);
    const after = seoul(2024, 3, 12, 12);
    expect(before.month.full).not.toBe(after.month.full);
  });

  it("달이 바뀌어도 절입 전이면 월주는 그대로다", () => {
    // 2월 말과 3월 초(절입 전)는 같은 월주
    expect(seoul(2024, 2, 25, 12).month.full).toBe(seoul(2024, 3, 1, 12).month.full);
  });
});

describe("경계 — 자시", () => {
  // 시주는 시계가 아니라 진태양시로 가른다. 서울은 -32분이므로 자시의 문턱도
  // 시계로는 23:00 이 아니라 23:32 다. 여기서 한 번 틀려 봤기에 적어 둔다.
  it("시계 23:30 은 보정하면 22:58 — 아직 해시다", () => {
    const late = seoul(2024, 5, 10, 23, 30);
    expect(late.basis.trueSolarTime).toBe("22:57");
    expect(late.hour?.branch).toBe("해");
  });

  it("시계 23:45 는 보정해도 자시라, 날을 넘긴다(야자시)", () => {
    const late = seoul(2024, 5, 10, 23, 45);
    const next = seoul(2024, 5, 11, 1, 0);
    expect(late.hour?.branch).toBe("자");
    expect(next.hour?.branch).toBe("자");
    // 야자시는 날을 넘기므로 다음 날 새벽과 일주가 같아야 한다
    expect(late.day.full).toBe(next.day.full);
    expect(late.basis.dayChangedByNightZi).toBe(true);
  });

  it("시간을 모르면 시주를 비운다", () => {
    const unknown = computeFourPillars({ year: 1995, month: 3, day: 12, hour: null, isLunar: false, city: "서울" });
    expect(unknown.hour).toBeNull();
    expect(unknown.basis.trueSolarTime).toBeNull();
  });
});

describe("경계 — 지역에 따라 시주가 갈린다", () => {
  it("같은 시각이라도 동쪽 끝과 서쪽 끝은 다를 수 있다", () => {
    const base = { year: 1995, month: 6, day: 15, hour: 11, minute: 0, isLunar: false } as const;
    const 신안 = computeFourPillars({ ...base, city: "신안" });
    const 울릉 = computeFourPillars({ ...base, city: "울릉" });
    // 신안 -35.6분, 울릉 -16.4분 — 11시는 보정 뒤 각각 10:24 / 10:43 이라 같은 사시지만
    // 보정값 자체는 분명히 달라야 한다
    expect(신안.basis.solarTimeOffsetMinutes).toBeLessThan(울릉.basis.solarTimeOffsetMinutes);
    expect(울릉.basis.solarTimeOffsetMinutes - 신안.basis.solarTimeOffsetMinutes).toBeGreaterThan(15);
  });
});

describe("경계 — 대운수", () => {
  const decade = (y: number, m: number, d: number, h: number, isFemale: boolean) =>
    computeDecadeFortune({
      pillars: computeFourPillars({ year: y, month: m, day: d, hour: h, minute: 0, isLunar: false, city: "서울" }),
      birth: { year: y, month: m, day: d, hour: h, minute: 0 },
      isFemale,
    });

  it("대운수는 1 이상이다", () => {
    for (const [y, m, d] of [[1995, 3, 12], [1988, 7, 1], [1958, 11, 1], [2003, 2, 5]] as const) {
      expect(decade(y, m, d, 9, true).startAge).toBeGreaterThanOrEqual(1);
    }
  });

  it("남녀의 방향이 반대다", () => {
    const 남 = decade(1995, 3, 12, 9, false);
    const 여 = decade(1995, 3, 12, 9, true);
    expect(남.direction).not.toBe(여.direction);
  });

  it("절입 직후에 태어나면 순행 대운수가 크다", () => {
    // 절입 바로 뒤 → 다음 절입까지 거의 한 달 → 순행이면 대운수가 9~10에 가깝다
    const 직후 = decade(2024, 3, 6, 12, false);
    expect(직후.basisDays).toBeGreaterThan(20);
  });
});
