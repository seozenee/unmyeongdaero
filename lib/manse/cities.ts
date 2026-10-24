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
  // 한국 — 표준시는 동경 135도인데 국토는 126~131도에 걸쳐 있다.
  // 서쪽 끝(신안)과 동쪽 끝(울릉)은 태양 시각이 20분 가까이 차이 나므로 시군 단위로 둔다.
  // 경도는 시청·군청 소재지 기준.
  // 서울
  서울: { utcOffset: 9, longitude: 126.98 },
  // 부산
  부산: { utcOffset: 9, longitude: 129.08 },
  // 대구
  대구: { utcOffset: 9, longitude: 128.60 },
  // 인천
  인천: { utcOffset: 9, longitude: 126.71 },
  강화: { utcOffset: 9, longitude: 126.49 },
  옹진: { utcOffset: 9, longitude: 126.64 },
  // 광주
  광주: { utcOffset: 9, longitude: 126.85 },
  // 대전
  대전: { utcOffset: 9, longitude: 127.38 },
  // 울산
  울산: { utcOffset: 9, longitude: 129.31 },
  // 세종
  세종: { utcOffset: 9, longitude: 127.29 },
  // 경기도
  수원: { utcOffset: 9, longitude: 127.03 },
  성남: { utcOffset: 9, longitude: 127.13 },
  의정부: { utcOffset: 9, longitude: 127.03 },
  안양: { utcOffset: 9, longitude: 126.96 },
  부천: { utcOffset: 9, longitude: 126.77 },
  광명: { utcOffset: 9, longitude: 126.86 },
  평택: { utcOffset: 9, longitude: 127.11 },
  동두천: { utcOffset: 9, longitude: 127.06 },
  안산: { utcOffset: 9, longitude: 126.83 },
  고양: { utcOffset: 9, longitude: 126.83 },
  과천: { utcOffset: 9, longitude: 126.99 },
  구리: { utcOffset: 9, longitude: 127.13 },
  남양주: { utcOffset: 9, longitude: 127.22 },
  오산: { utcOffset: 9, longitude: 127.07 },
  시흥: { utcOffset: 9, longitude: 126.80 },
  군포: { utcOffset: 9, longitude: 126.94 },
  의왕: { utcOffset: 9, longitude: 126.97 },
  하남: { utcOffset: 9, longitude: 127.21 },
  용인: { utcOffset: 9, longitude: 127.18 },
  파주: { utcOffset: 9, longitude: 126.78 },
  이천: { utcOffset: 9, longitude: 127.44 },
  안성: { utcOffset: 9, longitude: 127.28 },
  김포: { utcOffset: 9, longitude: 126.72 },
  화성: { utcOffset: 9, longitude: 126.83 },
  "광주(경기)": { utcOffset: 9, longitude: 127.26 },
  양주: { utcOffset: 9, longitude: 127.05 },
  포천: { utcOffset: 9, longitude: 127.20 },
  여주: { utcOffset: 9, longitude: 127.64 },
  연천: { utcOffset: 9, longitude: 127.08 },
  가평: { utcOffset: 9, longitude: 127.51 },
  양평: { utcOffset: 9, longitude: 127.49 },
  // 강원도
  춘천: { utcOffset: 9, longitude: 127.73 },
  원주: { utcOffset: 9, longitude: 127.92 },
  강릉: { utcOffset: 9, longitude: 128.88 },
  동해: { utcOffset: 9, longitude: 129.11 },
  태백: { utcOffset: 9, longitude: 128.99 },
  속초: { utcOffset: 9, longitude: 128.59 },
  삼척: { utcOffset: 9, longitude: 129.17 },
  홍천: { utcOffset: 9, longitude: 127.89 },
  횡성: { utcOffset: 9, longitude: 127.99 },
  영월: { utcOffset: 9, longitude: 128.46 },
  평창: { utcOffset: 9, longitude: 128.39 },
  정선: { utcOffset: 9, longitude: 128.66 },
  철원: { utcOffset: 9, longitude: 127.31 },
  화천: { utcOffset: 9, longitude: 127.71 },
  양구: { utcOffset: 9, longitude: 127.99 },
  인제: { utcOffset: 9, longitude: 128.17 },
  "고성(강원)": { utcOffset: 9, longitude: 128.47 },
  양양: { utcOffset: 9, longitude: 128.62 },
  // 충청북도
  청주: { utcOffset: 9, longitude: 127.49 },
  충주: { utcOffset: 9, longitude: 127.93 },
  제천: { utcOffset: 9, longitude: 128.19 },
  보은: { utcOffset: 9, longitude: 127.73 },
  옥천: { utcOffset: 9, longitude: 127.57 },
  영동: { utcOffset: 9, longitude: 127.78 },
  증평: { utcOffset: 9, longitude: 127.58 },
  진천: { utcOffset: 9, longitude: 127.44 },
  괴산: { utcOffset: 9, longitude: 127.79 },
  음성: { utcOffset: 9, longitude: 127.69 },
  단양: { utcOffset: 9, longitude: 128.37 },
  // 충청남도
  천안: { utcOffset: 9, longitude: 127.11 },
  공주: { utcOffset: 9, longitude: 127.12 },
  보령: { utcOffset: 9, longitude: 126.61 },
  아산: { utcOffset: 9, longitude: 127.00 },
  서산: { utcOffset: 9, longitude: 126.45 },
  논산: { utcOffset: 9, longitude: 127.10 },
  계룡: { utcOffset: 9, longitude: 127.25 },
  당진: { utcOffset: 9, longitude: 126.63 },
  금산: { utcOffset: 9, longitude: 127.49 },
  부여: { utcOffset: 9, longitude: 126.91 },
  서천: { utcOffset: 9, longitude: 126.69 },
  청양: { utcOffset: 9, longitude: 126.80 },
  홍성: { utcOffset: 9, longitude: 126.66 },
  예산: { utcOffset: 9, longitude: 126.84 },
  태안: { utcOffset: 9, longitude: 126.30 },
  // 전라북도
  전주: { utcOffset: 9, longitude: 127.15 },
  군산: { utcOffset: 9, longitude: 126.74 },
  익산: { utcOffset: 9, longitude: 126.96 },
  정읍: { utcOffset: 9, longitude: 126.86 },
  남원: { utcOffset: 9, longitude: 127.39 },
  김제: { utcOffset: 9, longitude: 126.88 },
  완주: { utcOffset: 9, longitude: 127.16 },
  진안: { utcOffset: 9, longitude: 127.42 },
  무주: { utcOffset: 9, longitude: 127.66 },
  장수: { utcOffset: 9, longitude: 127.52 },
  임실: { utcOffset: 9, longitude: 127.29 },
  순창: { utcOffset: 9, longitude: 127.14 },
  고창: { utcOffset: 9, longitude: 126.70 },
  부안: { utcOffset: 9, longitude: 126.73 },
  // 전라남도
  목포: { utcOffset: 9, longitude: 126.39 },
  여수: { utcOffset: 9, longitude: 127.66 },
  순천: { utcOffset: 9, longitude: 127.49 },
  나주: { utcOffset: 9, longitude: 126.71 },
  광양: { utcOffset: 9, longitude: 127.70 },
  담양: { utcOffset: 9, longitude: 126.99 },
  곡성: { utcOffset: 9, longitude: 127.29 },
  구례: { utcOffset: 9, longitude: 127.46 },
  고흥: { utcOffset: 9, longitude: 127.28 },
  보성: { utcOffset: 9, longitude: 127.08 },
  화순: { utcOffset: 9, longitude: 126.99 },
  장흥: { utcOffset: 9, longitude: 126.91 },
  강진: { utcOffset: 9, longitude: 126.77 },
  해남: { utcOffset: 9, longitude: 126.60 },
  영암: { utcOffset: 9, longitude: 126.70 },
  무안: { utcOffset: 9, longitude: 126.48 },
  함평: { utcOffset: 9, longitude: 126.52 },
  영광: { utcOffset: 9, longitude: 126.51 },
  장성: { utcOffset: 9, longitude: 126.78 },
  완도: { utcOffset: 9, longitude: 126.75 },
  진도: { utcOffset: 9, longitude: 126.26 },
  신안: { utcOffset: 9, longitude: 126.11 },
  // 경상북도
  포항: { utcOffset: 9, longitude: 129.36 },
  경주: { utcOffset: 9, longitude: 129.22 },
  김천: { utcOffset: 9, longitude: 128.11 },
  안동: { utcOffset: 9, longitude: 128.73 },
  구미: { utcOffset: 9, longitude: 128.34 },
  영주: { utcOffset: 9, longitude: 128.62 },
  영천: { utcOffset: 9, longitude: 128.94 },
  상주: { utcOffset: 9, longitude: 128.16 },
  문경: { utcOffset: 9, longitude: 128.19 },
  경산: { utcOffset: 9, longitude: 128.74 },
  군위: { utcOffset: 9, longitude: 128.57 },
  의성: { utcOffset: 9, longitude: 128.70 },
  청송: { utcOffset: 9, longitude: 129.06 },
  영양: { utcOffset: 9, longitude: 129.11 },
  영덕: { utcOffset: 9, longitude: 129.37 },
  청도: { utcOffset: 9, longitude: 128.73 },
  고령: { utcOffset: 9, longitude: 128.26 },
  성주: { utcOffset: 9, longitude: 128.28 },
  칠곡: { utcOffset: 9, longitude: 128.40 },
  예천: { utcOffset: 9, longitude: 128.45 },
  봉화: { utcOffset: 9, longitude: 128.73 },
  울진: { utcOffset: 9, longitude: 129.40 },
  울릉: { utcOffset: 9, longitude: 130.91 },
  // 경상남도
  창원: { utcOffset: 9, longitude: 128.68 },
  진주: { utcOffset: 9, longitude: 128.11 },
  통영: { utcOffset: 9, longitude: 128.43 },
  사천: { utcOffset: 9, longitude: 128.06 },
  김해: { utcOffset: 9, longitude: 128.89 },
  밀양: { utcOffset: 9, longitude: 128.75 },
  거제: { utcOffset: 9, longitude: 128.62 },
  양산: { utcOffset: 9, longitude: 129.04 },
  의령: { utcOffset: 9, longitude: 128.26 },
  함안: { utcOffset: 9, longitude: 128.41 },
  창녕: { utcOffset: 9, longitude: 128.49 },
  "고성(경남)": { utcOffset: 9, longitude: 128.32 },
  남해: { utcOffset: 9, longitude: 127.89 },
  하동: { utcOffset: 9, longitude: 127.75 },
  산청: { utcOffset: 9, longitude: 127.87 },
  함양: { utcOffset: 9, longitude: 127.73 },
  거창: { utcOffset: 9, longitude: 127.91 },
  합천: { utcOffset: 9, longitude: 128.17 },
  // 제주도
  제주: { utcOffset: 9, longitude: 126.53 },
  서귀포: { utcOffset: 9, longitude: 126.56 },

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
