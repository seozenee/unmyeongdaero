// PDF 의 색과 글자 크기.
//
// 값은 design/tokens.json 에서 읽는다. 손으로 옮겨 적으면 디자인이 바뀔 때 종이만 옛날 색으로 남는다.
//
// 화면은 어두운 바탕에 밝은 글자지만 종이는 반대다. 토큰에는 이 반전을 위한 색이 이미 있다
// (inverse-surface / inverse-on-surface). 보라·주황·금색도 어두운 바탕용 밝은 값 대신
// 흰 바탕에서 읽히는 -fixed-variant 계열을 고른다. 즉 새 색을 만드는 게 아니라 짝을 바꿔 든다.
import tokens from "@/design/tokens.json";

const colors = tokens.colors as Record<string, string>;
// tokens.json 의 fontSize 는 ["16px", { lineHeight, letterSpacing, fontWeight }] 꼴이다
type FontSizeEntry = readonly [string, { lineHeight?: string; letterSpacing?: string }?];
const fontSize = tokens.fontSize as unknown as Record<string, FontSizeEntry>;
const spacing = tokens.spacing as Record<string, string>;
const borderRadius = tokens.borderRadius as Record<string, string>;

/** "16px" → 16, "0.5rem" → 8 */
function toPt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return fallback;
  return value.trim().endsWith("rem") ? parsed * 16 : parsed;
}

/** "-0.015em" → 글자 크기에 곱해 pt 로 */
function toTracking(value: string | undefined, size: number): number {
  const parsed = Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) ? parsed * size : 0;
}

/**
 * 인쇄본 글자 배율.
 *
 * 화면 토큰을 그대로 종이에 옮기면 작다. 화면은 눈에서 30cm 떨어져 있고 밝게 빛나지만,
 * 종이는 손에 들려 있고 빛을 되쏘기만 한다. 같은 14pt 라도 종이 쪽이 훨씬 빽빽해 보인다.
 *
 * 용지도 A4 에서 A5 로 줄였다. 폭이 좁아지면 한 줄에 들어가는 글자가 줄어 눈이 덜
 * 흔들리고, 쪽수가 늘어 손에 쥐었을 때 책 같아진다 — 같은 글인데 읽는 맛이 달라진다.
 */
const PRINT_SCALE = 1.2;

function scale(name: string, fallbackSize: number, fallbackLine: number) {
  const entry = fontSize[name];
  const size = toPt(entry?.[0], fallbackSize) * PRINT_SCALE;
  return {
    fontSize: size,
    lineHeight: (toPt(entry?.[1]?.lineHeight, fallbackLine) * PRINT_SCALE) / size,
    letterSpacing: toTracking(entry?.[1]?.letterSpacing, size),
  };
}

export const palette = {
  /** 종이. 브랜드 색이 아니라 종이 그 자체다 */
  paper: "#ffffff",
  /** 본문 먹 */
  ink: colors["inverse-on-surface"]!,
  /** 보조 먹 — 설명, 캡션 */
  inkMuted: colors["outline-variant"]!,
  /** 더 옅은 먹 — 머리글, 쪽번호 */
  inkFaint: colors.outline!,
  /** 옅은 면 — 카드, 표의 머리, 선 */
  tint: colors["inverse-surface"]!,
  /** 브랜드 보라 */
  accent: colors["on-primary-fixed-variant"]!,
  accentSoft: colors["primary-fixed"]!,
  /** 강조 주황 */
  warm: colors["on-secondary-fixed-variant"]!,
  warmSoft: colors["secondary-fixed"]!,
  /** 금색 */
  gold: colors["on-tertiary-fixed-variant"]!,
} as const;

export const type = {
  headlineXl: scale("headline-xl", 34, 44),
  headlineLg: scale("headline-lg", 28, 38),
  headlineMd: scale("headline-md", 20, 28),
  bodyLg: scale("body-lg", 16, 26),
  bodyMd: scale("body-md", 14, 22),
  bodySm: scale("body-sm", 13, 19),
  labelMd: scale("label-md", 14, 20),
  labelSm: scale("label-sm", 12, 16),
} as const;

export const space = {
  xs: toPt(spacing["space-xs"], 4),
  sm: toPt(spacing["space-sm"], 8),
  md: toPt(spacing["space-md"], 14),
  lg: toPt(spacing["space-lg"], 20),
  xl: toPt(spacing["space-xl"], 32),
} as const;

export const radius = {
  base: toPt(borderRadius.DEFAULT, 4),
  lg: toPt(borderRadius.lg, 8),
  xl: toPt(borderRadius.xl, 12),
} as const;

/** 오행의 색 — 화면 차트와 같은 짝을 쓰되 종이에서 읽히는 진한 쪽으로 */
export const ELEMENT_COLOR: Record<string, string> = {
  목: colors["on-tertiary-fixed-variant"]!,
  화: colors["on-secondary-fixed-variant"]!,
  토: colors["on-primary-fixed-variant"]!,
  금: colors.outline!,
  수: colors["inverse-on-surface"]!,
};

/** 시기의 결 — 좋음·보통·조심 */
export const TONE_COLOR = {
  good: palette.accent,
  neutral: palette.inkFaint,
  caution: palette.warm,
} as const;
