import { describe, expect, it } from "vitest";
import birthCities from "../../saju/birth-cities.json";
import { CITIES, cityInfo, solarTimeOffsetMinutes } from "../cities";

describe("출생지", () => {
  // 목록에 있는데 경도표에 없으면 조용히 서울로 떨어진다. 사람은 제 고향을 골랐는데
  // 계산은 서울로 하는 셈이라, 시주가 통째로 틀릴 수 있다.
  it("고를 수 있는 곳은 모두 경도를 가진다", () => {
    const missing = birthCities.flatMap((group) =>
      group.cities.filter((city) => !CITIES[city]).map((city) => `${group.region} ${city}`),
    );
    expect(missing).toEqual([]);
  });

  it("같은 이름이 두 번 나오지 않는다", () => {
    const all = birthCities.flatMap((group) => group.cities);
    expect(all.length).toBe(new Set(all).size);
  });

  it("한국은 표준시보다 태양이 늦다 — 보정은 늘 음수", () => {
    const korea = birthCities.filter((group) => /도$|^서울|^부산|^대구|^인천|^광주|^대전|^울산|^세종/.test(group.region));
    expect(korea.length).toBeGreaterThan(10);
    for (const group of korea) {
      for (const city of group.cities) {
        const minutes = solarTimeOffsetMinutes(cityInfo(city));
        // 신안(126.11) 약 -36분 ~ 울릉(130.91) 약 -16분
        expect(minutes).toBeLessThan(0);
        expect(minutes).toBeGreaterThan(-40);
      }
    }
  });

  it("모르는 곳은 서울로 읽는다", () => {
    expect(cityInfo("없는도시")).toEqual(CITIES.서울);
    expect(cityInfo(undefined)).toEqual(CITIES.서울);
  });
});
