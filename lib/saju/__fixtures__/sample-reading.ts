// ⚠️ UI 확인·테스트 전용 가짜 데이터. 실제 sazu 계산 결과가 아니며 화면에 실데이터로 노출하면 안 된다.
// 모듈 필드 모양만 실제 응답(lib/sazu/__fixtures__/*.json)에 맞췄다.

export const SAMPLE_BIRTH = { year: 1998, month: 5, day: 19 };
export const SAMPLE_REFERENCE_DATE = { year: 2026, month: 9, day: 11 };

export const SAMPLE_MODULES = {
  fourPillars: {
    year: { full: "戊寅" },
    month: { full: "丁巳" },
    day: { full: "甲子" },
    hour: { full: "己巳" },
  },
  elements: {
    wood: { name: "목", total: { count: 2, percentage: 25 } },
    fire: { name: "화", total: { count: 3, percentage: 37.5 } },
    earth: { name: "토", total: { count: 2, percentage: 25 } },
    metal: { name: "금", total: { count: 0, percentage: 0 } },
    water: { name: "수", total: { count: 1, percentage: 12.5 } },
  },
  sinStrength: { strength: "신약", analysis: "(샘플) 월령을 얻지 못했습니다." },
  yongsin: { yongsin: { ko: "수" }, huisin: { ko: "금" }, gisin: { ko: "화" }, reasoning: "(샘플)" },
  sinsal: { angels: [{ name: "천을귀인" }], devils: [{ name: "도화살" }] },
  decadeFortune: {
    direction: "순행",
    list: [
      { startAge: 3, full: "戊午" },
      { startAge: 13, full: "己未" },
      { startAge: 23, full: "庚申" },
      { startAge: 33, full: "辛酉" },
      { startAge: 43, full: "壬戌" },
      { startAge: 53, full: "癸亥" },
      { startAge: 63, full: "甲子" },
      { startAge: 73, full: "乙丑" },
    ],
  },
};

export const SAMPLE_GLOSSARY: Record<string, string> = {
  일간: "사주 여덟 글자 가운데 본인을 나타내는 글자",
  신약: "일간을 돕는 기운이 상대적으로 적은 상태",
  용신: "사주의 균형을 맞추는 데 도움이 되는 오행",
  대운: "10년 단위로 바뀌는 큰 운의 흐름",
  도화살: "사람을 끌어당기는 매력과 표현력의 기운",
};

export const SAMPLE_INTERPRETATION = {
  title: "지금 두 사람 사이에 흐르는 기운",
  paragraphs: [
    "(샘플 문장) 일간 甲木은 곧게 뻗으려는 나무의 성질이라, 관계에서도 먼저 방향을 정하고 싶어 하는 편입니다.",
    "(샘플 문장) 원국에 火가 많고 신약한 구조라 감정이 빠르게 달아올랐다 식는 흐름을 스스로 경계하면 좋습니다.",
    "(샘플 문장) 현재 庚申 대운은 결단과 정리의 기운이 강한 시기로, 서두르기보다 기준을 세우는 데 힘을 쓰는 편이 유리합니다.",
  ],
};
