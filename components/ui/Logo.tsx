// 운명대로 심볼. 초승달(운명)과 그 아래로 뻗은 길(대로)을 겹친 인장 형태.
// 외부 호스팅 이미지는 만료될 수 있어 코드로 그린다. 색은 design/tokens.json 에서만 가져온다.
import tokens from "@/design/tokens.json";
import { cn } from "@/lib/cn";

const c = tokens.colors;

export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("h-8 w-8", className)} role="img" aria-label="운명대로 로고">
      <defs>
        <linearGradient id="logo-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c["on-primary-fixed"]} />
          <stop offset="100%" stopColor={c["surface-container-lowest"]} />
        </linearGradient>
        <clipPath id="logo-seal">
          <rect x="2" y="2" width="36" height="36" rx="9" />
        </clipPath>
      </defs>

      {/* 인장 바탕 */}
      <rect x="2" y="2" width="36" height="36" rx="9" fill="url(#logo-sky)" />

      <g clipPath="url(#logo-seal)">
        {/* 초승달 — 큰 원에서 작은 원을 빼서 만든다 */}
        <path d="M27 9 A 8.5 8.5 0 1 0 27 26 A 6.8 6.8 0 1 1 27 9 Z" fill={c["primary-fixed"]} />

        {/* 별 */}
        <circle cx="11" cy="11" r="1.1" fill={c["primary-fixed"]} opacity="0.75" />
        <circle cx="15.5" cy="17" r="0.8" fill={c["primary-fixed"]} opacity="0.5" />

        {/* 달빛 아래로 뻗은 길 — 멀어질수록 좁아진다 */}
        <path d="M13 40 L18.5 27 L23.5 27 L29 40 Z" fill={c["tertiary-fixed"]} opacity="0.9" />
        {/* 길 위의 중앙선 */}
        <path d="M20.4 27 L19.2 40" stroke={c["surface-container-lowest"]} strokeWidth="1.4" opacity="0.55" />
        <path d="M21.6 27 L22.8 40" stroke={c["surface-container-lowest"]} strokeWidth="1.4" opacity="0.55" />
      </g>

      {/* 인장 테두리 */}
      <rect x="2" y="2" width="36" height="36" rx="9" fill="none" stroke={c["secondary-container"]} strokeWidth="2" />
    </svg>
  );
}
