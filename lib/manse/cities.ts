// 출생지별 표준시와 경도.
//
// 사주의 시주는 '시계 시각'이 아니라 '태양의 실제 위치'를 따른다.
// 한국은 동경 135도를 표준시로 쓰지만 서울은 동경 127도라, 시계가 태양보다 약 32분 빠르다.
// 이 차이를 보정한 시각이 진태양시(眞太陽時)이며 한국 만세력의 표준 관행이다.
//
// utcOffset: 해당 지역의 표준시(시간). 서머타임은 별도로 다룬다.
// longitude: 동경 기준(도). 서경은 음수.
export interface CityInfo {
  utcOffset: number;
  longitude: number;
}

export const CITIES: Record<string, CityInfo> = {
  // 한국 — 표준시 동경 135도, 실제 경도는 126~129도
  서울: { utcOffset: 9, longitude: 126.98 },
  인천: { utcOffset: 9, longitude: 126.71 },
  부산: { utcOffset: 9, longitude: 129.08 },
  대구: { utcOffset: 9, longitude: 128.60 },
  대전: { utcOffset: 9, longitude: 127.38 },
  광주: { utcOffset: 9, longitude: 126.85 },

  도쿄: { utcOffset: 9, longitude: 139.69 },
  오사카: { utcOffset: 9, longitude: 135.50 },
  베이징: { utcOffset: 8, longitude: 116.41 },
  상하이: { utcOffset: 8, longitude: 121.47 },

  홍콩: { utcOffset: 8, longitude: 114.17 },
  싱가포르: { utcOffset: 8, longitude: 103.82 },
  타이베이: { utcOffset: 8, longitude: 121.56 },
  방콕: { utcOffset: 7, longitude: 100.50 },
  자카르타: { utcOffset: 7, longitude: 106.85 },
  하노이: { utcOffset: 7, longitude: 105.83 },

  뭄바이: { utcOffset: 5.5, longitude: 72.88 },
  콜카타: { utcOffset: 5.5, longitude: 88.36 },
  뉴델리: { utcOffset: 5.5, longitude: 77.21 },

  두바이: { utcOffset: 4, longitude: 55.27 },
  리야드: { utcOffset: 3, longitude: 46.72 },

  모스크바: { utcOffset: 3, longitude: 37.62 },
  이스탄불: { utcOffset: 3, longitude: 28.98 },
  헬싱키: { utcOffset: 2, longitude: 24.94 },
  아테네: { utcOffset: 2, longitude: 23.73 },
  파리: { utcOffset: 1, longitude: 2.35 },
  베를린: { utcOffset: 1, longitude: 13.40 },
  로마: { utcOffset: 1, longitude: 12.50 },
  마드리드: { utcOffset: 1, longitude: -3.70 },
  암스테르담: { utcOffset: 1, longitude: 4.90 },
  브뤼셀: { utcOffset: 1, longitude: 4.35 },
  비엔나: { utcOffset: 1, longitude: 16.37 },
  취리히: { utcOffset: 1, longitude: 8.54 },
  프라하: { utcOffset: 1, longitude: 14.42 },
  바르샤바: { utcOffset: 1, longitude: 21.01 },
  스톡홀름: { utcOffset: 1, longitude: 18.07 },
  오슬로: { utcOffset: 1, longitude: 10.75 },
  코펜하겐: { utcOffset: 1, longitude: 12.57 },
  런던: { utcOffset: 0, longitude: -0.13 },
  리스본: { utcOffset: 0, longitude: -9.14 },
  더블린: { utcOffset: 0, longitude: -6.26 },
  레이캬비크: { utcOffset: 0, longitude: -21.94 },

  뉴욕: { utcOffset: -5, longitude: -74.01 },
  토론토: { utcOffset: -5, longitude: -79.38 },
  워싱턴: { utcOffset: -5, longitude: -77.04 },
  마이애미: { utcOffset: -5, longitude: -80.19 },
  보스턴: { utcOffset: -5, longitude: -71.06 },
  애틀랜타: { utcOffset: -5, longitude: -84.39 },
  시카고: { utcOffset: -6, longitude: -87.63 },
  휴스턴: { utcOffset: -6, longitude: -95.37 },
  달라스: { utcOffset: -6, longitude: -96.80 },
  덴버: { utcOffset: -7, longitude: -104.99 },
  피닉스: { utcOffset: -7, longitude: -112.07 },
  로스앤젤레스: { utcOffset: -8, longitude: -118.24 },
  샌프란시스코: { utcOffset: -8, longitude: -122.42 },
  시애틀: { utcOffset: -8, longitude: -122.33 },
  밴쿠버: { utcOffset: -8, longitude: -123.12 },
  앵커리지: { utcOffset: -9, longitude: -149.90 },
  호놀룰루: { utcOffset: -10, longitude: -157.86 },

  리우데자네이루: { utcOffset: -3, longitude: -43.17 },
  상파울루: { utcOffset: -3, longitude: -46.63 },
  부에노스아이레스: { utcOffset: -3, longitude: -58.38 },
  산티아고: { utcOffset: -4, longitude: -70.67 },
  리마: { utcOffset: -5, longitude: -77.04 },
  보고타: { utcOffset: -5, longitude: -74.07 },

  아조레스: { utcOffset: -1, longitude: -25.67 },

  오클랜드: { utcOffset: 12, longitude: 174.76 },
  시드니: { utcOffset: 10, longitude: 151.21 },
  멜버른: { utcOffset: 10, longitude: 144.96 },
  브리즈번: { utcOffset: 10, longitude: 153.03 },
  퍼스: { utcOffset: 8, longitude: 115.86 },
};

const SEOUL: CityInfo = CITIES.서울!;

export function cityInfo(name: string | undefined): CityInfo {
  return (name && CITIES[name]) || SEOUL;
}

/**
 * 시계 시각과 진태양시의 차이(분).
 * 표준시 자오선보다 서쪽에 있으면 태양이 늦게 뜨므로 음수가 된다.
 * (예: 서울 126.98도, 표준시 135도 → 약 -32분)
 */
export function solarTimeOffsetMinutes(city: CityInfo): number {
  return (city.longitude - city.utcOffset * 15) * 4;
}
