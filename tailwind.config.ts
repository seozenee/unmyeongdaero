import type { Config } from "tailwindcss";
import tokens from "./design/tokens.json";

// 토큰 값은 design/tokens.json(= code.html + DESIGN.md 에서 자동 추출)에서만 가져온다.
// 값을 바꾸려면 design/ 원본을 수정한 뒤 `pnpm tokens` 를 실행할 것.

type FontSizeToken = [string, { lineHeight: string; letterSpacing?: string; fontWeight: string }];

// Plus Jakarta Sans 에는 한글 글리프가 없어 한글은 시스템 폰트로 떨어진다.
const fontFallback = ["-apple-system", "BlinkMacSystemFont", "system-ui", "sans-serif"];

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: tokens.colors,
      borderRadius: tokens.borderRadius,
      spacing: tokens.spacing,
      fontFamily: Object.fromEntries(
        Object.entries(tokens.fontFamily).map(([name, stack]) => [name, [...stack, ...fontFallback]]),
      ),
      fontSize: tokens.fontSize as unknown as Record<string, FontSizeToken>,
      // 스토리 진행용 모션 (색·간격 토큰이 아니므로 design/ 원본과 무관)
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        "dot-blink": { "0%, 100%": { opacity: "0.25" }, "50%": { opacity: "1" } },
        "slow-zoom": { "0%": { transform: "scale(1.08)" }, "100%": { transform: "scale(1)" } },
        // ─ 웹툰 연출 ─
        "ken-burns": { "0%": { transform: "scale(1.18) translate(2%, 2%)" }, "100%": { transform: "scale(1.02) translate(0, 0)" } },
        "push-in": { "0%": { transform: "scale(1)" }, "100%": { transform: "scale(1.22)" } },
        tilt: { "0%": { transform: "scale(1.15) rotate(-2deg)" }, "100%": { transform: "scale(1.05) rotate(0deg)" } },
        twinkle: { "0%, 100%": { opacity: "0.15" }, "50%": { opacity: "1" } },
        glow: { "0%, 100%": { opacity: "0.55", transform: "scale(1)" }, "50%": { opacity: "0.95", transform: "scale(1.07)" } },
        flicker: {
          "0%, 100%": { opacity: "0.8" },
          "20%": { opacity: "0.55" },
          "22%": { opacity: "0.9" },
          "60%": { opacity: "0.7" },
          "63%": { opacity: "1" },
        },
        drift: { "0%": { transform: "translateX(-8%)" }, "100%": { transform: "translateX(8%)" } },
        rise: {
          "0%": { transform: "translateY(24px)", opacity: "0" },
          "20%": { opacity: "1" },
          "100%": { transform: "translateY(-140px)", opacity: "0" },
        },
        float: { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
        breathe: { "0%, 100%": { transform: "scaleY(1)" }, "50%": { transform: "scaleY(1.015)" } },
        sway: { "0%, 100%": { transform: "rotate(-1.4deg)" }, "50%": { transform: "rotate(1.4deg)" } },
        "eye-blink": { "0%, 92%, 100%": { transform: "scaleY(1)" }, "95%": { transform: "scaleY(0.1)" } },
        pop: {
          "0%": { transform: "scale(0.6)", opacity: "0" },
          "60%": { transform: "scale(1.06)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        shake: {
          "0%, 100%": { transform: "translate(0, 0) rotate(var(--sfx-rotate, -6deg))" },
          "25%": { transform: "translate(-2px, 1px) rotate(var(--sfx-rotate, -6deg))" },
          "50%": { transform: "translate(2px, -1px) rotate(var(--sfx-rotate, -6deg))" },
          "75%": { transform: "translate(-1px, -2px) rotate(var(--sfx-rotate, -6deg))" },
        },
        "rise-in": { "0%": { transform: "translate(-50%, 18%)", opacity: "0" }, "100%": { transform: "translate(-50%, 0)", opacity: "1" } },
      },
      animation: {
        "ken-burns": "ken-burns 9s ease-out both",
        "push-in": "push-in 7s cubic-bezier(0.22, 1, 0.36, 1) both",
        tilt: "tilt 8s ease-out both",
        twinkle: "twinkle 3.2s ease-in-out infinite",
        glow: "glow 5s ease-in-out infinite",
        flicker: "flicker 3.4s linear infinite",
        drift: "drift 14s ease-in-out infinite alternate",
        rise: "rise 7s ease-in infinite",
        float: "float 4s ease-in-out infinite",
        breathe: "breathe 4.5s ease-in-out infinite",
        sway: "sway 6s ease-in-out infinite",
        "eye-blink": "eye-blink 5s ease-in-out infinite",
        pop: "pop 520ms cubic-bezier(0.34, 1.56, 0.64, 1) both",
        shake: "shake 380ms ease-in-out 3",
        "rise-in": "rise-in 1200ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-up": "fade-up 480ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 700ms ease-out both",
        "dot-blink": "dot-blink 1.2s ease-in-out infinite",
        "slow-zoom": "slow-zoom 6s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
