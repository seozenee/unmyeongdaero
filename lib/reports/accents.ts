/**
 * 상품의 주요 색.
 *
 * 포스터를 상품마다 다른 색으로 뽑아 두었는데(lib/story/webtoon-assets.ts 의 accent),
 * 정작 화면은 전부 같은 검정이었다. 그림은 다른데 둘러싼 자리가 같으니 카드를 넘겨도
 * 같은 페이지를 보는 느낌이 든다.
 *
 * 그래서 그 포스터의 색을 화면으로 끌어온다. 상세 화면은 이 색으로 히어로 아래가 물들고,
 * 번호와 라벨과 띠가 같은 색을 쓴다. 재회는 붉고, 대학사주는 파랗고, 사업사주는 초록이다.
 *
 * 값은 "R G B" 세 숫자다 — rgb(var(--accent)/0.3) 처럼 투명도를 섞어 쓰기 위해서다.
 * 등록되지 않은 상품(운영 화면에서 새로 만든 것)은 기본 보라를 쓴다.
 */
export const PRODUCT_ACCENT: Record<string, string> = {
  // 재회·연애 — 붉은 계열
  "reunion-deep": "226 62 87",
  reunion: "167 114 214",
  love: "255 122 89",
  consult: "124 140 255",

  // 궁합·관계
  compatibility: "255 77 141",
  "parent-child": "242 166 90",
  yearly: "25 167 160",
  "child-talent": "166 107 255",

  // 인생·운세
  "destiny-full": "212 160 23",
  life: "79 124 224",
  health: "79 178 134",

  // 돈·일
  money: "230 180 34",
  career: "122 160 196",
  business: "46 158 107",

  // 공부·아이
  study: "108 124 220",
  "child-study": "111 179 224",
  "child-admission": "63 110 226",
  "child-dream": "242 112 58",
};

/** 기본값은 브랜드 주홍(인주). 모르는 상품도 화면이 비뚜로 보이지 않게 한다 */
export const DEFAULT_ACCENT = "240 82 46";

export const productAccent = (slug: string) => PRODUCT_ACCENT[slug] ?? DEFAULT_ACCENT;
