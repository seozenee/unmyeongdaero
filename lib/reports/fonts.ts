// 상품 간판에 쓰는 한글 디스플레이 서체.
//
// 카드가 열 몇 장 나란히 놓이는 자리에서 전부 같은 고딕이면, 그림이 달라도 한 묶음으로
// 보인다. 상품마다 목소리를 달리 준다 — 입시는 묵직하게, 아이 상품은 둥글게, 재회는
// 붓글씨로. 서체는 app/layout.tsx 에서 한 번에 불러온다.

export const PRODUCT_FONT: Record<string, string> = {
  // 재회·연애 — 손으로 쓴 듯한 붓글씨
  "reunion-deep": "'Nanum Brush Script', cursive",
  reunion: "'Nanum Brush Script', cursive",
  love: "'Yeon Sung', cursive",

  // 궁합 — 전통 간판 느낌
  compatibility: "'Gugi', cursive",
  yearly: "'Gugi', cursive",

  // 평생·명식 — 고전 명조
  "destiny-full": "'Song Myung', serif",
  life: "'Song Myung', serif",

  // 돈·일 — 묵직한 제목체
  money: "'Gasoek One', sans-serif",
  career: "'Black Han Sans', sans-serif",
  business: "'Black Han Sans', sans-serif",

  // 입시 — 가장 무겁게
  "child-admission": "'Black Han Sans', sans-serif",

  // 아이 — 둥글고 다정하게
  "child-dream": "'Jua', sans-serif",
  "child-talent": "'Jua', sans-serif",
  "child-study": "'Jua', sans-serif",
  "parent-child": "'Jua', sans-serif",

  // 몸·공부 — 또렷한 고딕
  health: "'Do Hyeon', sans-serif",
  study: "'Do Hyeon', sans-serif",
  consult: "'Do Hyeon', sans-serif",
};

/** 등록되지 않은 상품(운영 화면에서 새로 만든 것)은 본문 서체를 그대로 쓴다 */
export const productFont = (slug: string) => PRODUCT_FONT[slug];
