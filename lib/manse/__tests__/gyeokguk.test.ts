import { describe, expect, it } from "vitest";
import { computeGyeokguk, computeYongsin } from "../gyeokguk";
import { computeFourPillars } from "../pillars";
import { judgeStrength } from "../strength";
import { SAZU_SAMPLE_PROFILES } from "../../sazu/sample-profiles";

const chartOf = (id: string) => {
  const profile = SAZU_SAMPLE_PROFILES.find((sample) => sample.id === id)!.profile;
  return computeFourPillars({
    year: profile.birthYear, month: profile.birthMonth, day: profile.birthDay,
    hour: profile.birthHour, minute: profile.birthMinute ?? 0,
    isLunar: profile.isLunar, city: profile.birthCity,
  });
};

describe("격국 — sazu 표본과 맞춰 보기", () => {
  const pillars = chartOf("strong-male"); // 무인 정사 병인 계사

  it("월지가 일간의 건록 자리면 건록격", () => {
    const gyeokguk = computeGyeokguk(pillars);
    expect(gyeokguk.name).toBe("건록격");
    expect(gyeokguk.reasoning).toContain("건록");
  });
});

describe("격국 — 나머지 표본", () => {
  it("모든 표본에서 격을 정하고 근거를 남긴다", () => {
    for (const sample of SAZU_SAMPLE_PROFILES) {
      const gyeokguk = computeGyeokguk(chartOf(sample.id));
      expect(gyeokguk.name, sample.id).toMatch(/격$/);
      expect(gyeokguk.reasoning.length, sample.id).toBeGreaterThan(0);
    }
  });

  it("비겁으로는 격을 세우지 않는다", () => {
    for (const sample of SAZU_SAMPLE_PROFILES) {
      expect(computeGyeokguk(chartOf(sample.id)).name).not.toMatch(/^(비견|겁재)격$/);
    }
  });

  it("투간한 글자가 있으면 어느 자리에서 드러났는지 밝힌다", () => {
    const withTransparency = SAZU_SAMPLE_PROFILES
      .map((sample) => computeGyeokguk(chartOf(sample.id)))
      .filter((gyeokguk) => gyeokguk.transparency !== null);
    for (const gyeokguk of withTransparency) {
      expect(gyeokguk.transparency!.position).toMatch(/^(년간|월간|시간)$/);
      expect(gyeokguk.reasoning).toContain(gyeokguk.transparency!.position);
    }
  });
});

describe("용신 — sazu 표본(신강 병화, 사월생)과 맞춰 보기", () => {
  const pillars = chartOf("strong-male");
  const yongsin = computeYongsin(pillars, judgeStrength(pillars).strength);

  it("신강이라 식상으로 덜어 낸다 — 용신 토", () => {
    expect(yongsin.yongsin.ko).toBe("토");
    expect(yongsin.eokbu.method).toBe("설기");
  });

  it("희신은 용신을 생하는 화", () => {
    expect(yongsin.huisin.ko).toBe("화");
  });

  it("기신은 용신을 극하는 목, 구신은 기신을 생하는 수, 한신은 남은 금", () => {
    expect(yongsin.gisin.ko).toBe("목");
    expect(yongsin.gusin.ko).toBe("수");
    expect(yongsin.hansin.ko).toBe("금");
  });

  it("여름생이라 조후는 수를 가리키되, 갈리면 억부를 앞세운다", () => {
    expect(yongsin.johu?.ko).toBe("수");
    expect(yongsin.method).toBe("억부");
    expect(yongsin.reasoning).toContain("조후");
  });
});

describe("용신 — 다섯 자리가 오행을 한 번씩 차지한다", () => {
  it("모든 표본에서 겹치지 않는다", () => {
    for (const sample of SAZU_SAMPLE_PROFILES) {
      const pillars = chartOf(sample.id);
      const yongsin = computeYongsin(pillars, judgeStrength(pillars).strength);
      const roles = [yongsin.yongsin.ko, yongsin.huisin.ko, yongsin.gisin.ko, yongsin.gusin.ko, yongsin.hansin.ko];
      expect(new Set(roles).size, sample.id).toBe(5);
    }
  });

  it("점수를 내지 않는다", () => {
    const pillars = chartOf("weak-female");
    const yongsin = computeYongsin(pillars, judgeStrength(pillars).strength);
    expect(yongsin.reasoning).not.toMatch(/\d+점/);
  });
});
