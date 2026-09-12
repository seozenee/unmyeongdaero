import { ImageResponse } from "next/og";
import tokens from "@/design/tokens.json";

// 브라우저 탭 아이콘. components/ui/Logo.tsx 의 인장 심볼을 같은 토큰으로 다시 그린다.
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

const c = tokens.colors;

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: c["surface-container-lowest"],
        }}
      >
        <svg viewBox="0 0 40 40" width="64" height="64">
          <rect x="2" y="2" width="36" height="36" rx="9" fill={c["surface-container-lowest"]} />
          {/* 초승달 — 큰 원에 배경색 원을 겹쳐 깎는다 */}
          <circle cx="25" cy="16" r="8.5" fill={c["primary-fixed"]} />
          <circle cx="20.5" cy="13.5" r="7.2" fill={c["surface-container-lowest"]} />
          {/* 달빛 아래로 뻗은 길 */}
          <path d="M13 38 L18.5 26 L23.5 26 L29 38 Z" fill={c["tertiary-fixed"]} />
          <rect x="2" y="2" width="36" height="36" rx="9" fill="none" stroke={c["secondary-container"]} strokeWidth="2" />
        </svg>
      </div>
    ),
    size,
  );
}
