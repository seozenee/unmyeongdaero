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
import type { CSSProperties } from "react";

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
  factbomb: "180 92 98",
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

/** 포스터의 색에서 버튼·글자·배경을 함께 만든다. 버튼 글자는 명암 대비가 높은 쪽을 쓴다. */
export function productThemeStyle(slug: string): CSSProperties {
  const accent = productAccent(slug);
  const rgb = accent.split(" ").map(Number);
  const mix = (toward: number, amount: number) => rgb.map(channel => Math.round(channel * (1 - amount) + toward * amount)).join(" ");
  const luminance = rgb.map(channel => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index]!, 0);
  const darkText = (luminance + 0.05) / 0.05 >= 1.05 / (luminance + 0.05);
  return {
    "--accent": accent,
    "--accent-ink": mix(255, 0.5),
    "--accent-deep": mix(0, 0.93),
    "--accent-button": accent,
    "--accent-button-end": darkText ? mix(255, 0.14) : mix(0, 0.14),
    "--accent-on": darkText ? "#000000" : "#ffffff",
  } as CSSProperties;
}
