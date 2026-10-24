// 천간·지지 → 오행/음양/독음. 명리의 고정 대응표라 API 응답과 무관하게 결정된다.
// sazu 응답이 locale "ko"(갑자) 로 오든 "han"(甲子) 으로 오든 같은 결과를 내도록 두 표기를 모두 받는다.

export type FiveElement = "wood" | "fire" | "earth" | "metal" | "water";
export type YinYang = "yang" | "yin";

export const FIVE_ELEMENTS: readonly FiveElement[] = ["wood", "fire", "earth", "metal", "water"];

export const ELEMENT_LABEL: Record<FiveElement, { ko: string; han: string }> = {
  wood: { ko: "목", han: "木" },
  fire: { ko: "화", han: "火" },
  earth: { ko: "토", han: "土" },
  metal: { ko: "금", han: "金" },
  water: { ko: "수", han: "水" },
};

/**
 * 화면에서 오행에 입히는 색.
 *
 * PDF(lib/pdf/theme.ts)가 쓰는 것과 같은 짝을, 어두운 바탕용으로 바꿔 든다.
 * 종이에서는 -fixed-variant 계열(진한 쪽), 화면에서는 그 짝이 되는 밝은 쪽이다.
 * 새 색을 만들지 않고 토큰 안에서 고른다.
 */
export const ELEMENT_TEXT: Record<FiveElement, string> = {
  wood: "text-tertiary",
  fire: "text-secondary",
  earth: "text-primary",
  metal: "text-outline",
  water: "text-on-surface-variant",
};

/** 막대·칸을 통째로 칠할 때 쓰는 진한 쪽 */
export const ELEMENT_FILL: Record<FiveElement, string> = {
  wood: "bg-tertiary",
  fire: "bg-secondary",
  earth: "bg-primary",
  metal: "bg-outline",
  water: "bg-on-surface-variant",
};

/** 같은 짝의 아주 옅은 바탕. 글자를 덮지 않을 만큼만 깐다 */
export const ELEMENT_TINT: Record<FiveElement, string> = {
  wood: "bg-tertiary/10",
  fire: "bg-secondary/10",
  earth: "bg-primary/10",
  metal: "bg-outline/10",
  water: "bg-on-surface-variant/10",
};

interface GanjiChar {
  han: string;
  ko: string;
  element: FiveElement;
  yinYang: YinYang;
}

const STEMS: GanjiChar[] = [
  { han: "甲", ko: "갑", element: "wood", yinYang: "yang" },
  { han: "乙", ko: "을", element: "wood", yinYang: "yin" },
  { han: "丙", ko: "병", element: "fire", yinYang: "yang" },
  { han: "丁", ko: "정", element: "fire", yinYang: "yin" },
  { han: "戊", ko: "무", element: "earth", yinYang: "yang" },
  { han: "己", ko: "기", element: "earth", yinYang: "yin" },
  { han: "庚", ko: "경", element: "metal", yinYang: "yang" },
  { han: "辛", ko: "신", element: "metal", yinYang: "yin" },
  { han: "壬", ko: "임", element: "water", yinYang: "yang" },
  { han: "癸", ko: "계", element: "water", yinYang: "yin" },
];

const BRANCHES: GanjiChar[] = [
  { han: "子", ko: "자", element: "water", yinYang: "yang" },
  { han: "丑", ko: "축", element: "earth", yinYang: "yin" },
  { han: "寅", ko: "인", element: "wood", yinYang: "yang" },
  { han: "卯", ko: "묘", element: "wood", yinYang: "yin" },
  { han: "辰", ko: "진", element: "earth", yinYang: "yang" },
  { han: "巳", ko: "사", element: "fire", yinYang: "yin" },
  { han: "午", ko: "오", element: "fire", yinYang: "yang" },
  { han: "未", ko: "미", element: "earth", yinYang: "yin" },
  { han: "申", ko: "신", element: "metal", yinYang: "yang" },
  { han: "酉", ko: "유", element: "metal", yinYang: "yin" },
  { han: "戌", ko: "술", element: "earth", yinYang: "yang" },
  { han: "亥", ko: "해", element: "water", yinYang: "yin" },
];

function lookup(table: GanjiChar[], char: string): GanjiChar | undefined {
  return table.find((entry) => entry.han === char || entry.ko === char);
}

export interface Ganji {
  stem: GanjiChar;
  branch: GanjiChar;
}

/** "甲子" | "갑자" → 천간/지지 정보. 해석 불가하면 null */
export function parseGanji(full: string): Ganji | null {
  const chars = Array.from(full.trim());
  if (chars.length !== 2) return null;
  const stem = lookup(STEMS, chars[0]!);
  const branch = lookup(BRANCHES, chars[1]!);
  return stem && branch ? { stem, branch } : null;
}

/** "木" | "목" | "wood" → FiveElement */
export function toFiveElement(value: string): FiveElement | null {
  const normalized = value.trim();
  if ((FIVE_ELEMENTS as readonly string[]).includes(normalized)) return normalized as FiveElement;
  const match = FIVE_ELEMENTS.find(
    (element) =>
      normalized.startsWith(ELEMENT_LABEL[element].ko) || normalized.startsWith(ELEMENT_LABEL[element].han),
  );
  return match ?? null;
}
