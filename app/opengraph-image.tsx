import { ImageResponse } from "next/og";
import tokens from "@/design/tokens.json";

// 카카오톡·SNS 로 링크를 보낼 때 뜨는 공유 썸네일.
// 없으면 링크가 맨 텍스트로 나가 유입에 직접 손해라 기본값을 둔다.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "운명대로 — 현대인을 위한 가장 명쾌하고 솔직한 운명 리포트";

const c = tokens.colors;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 88px",
          background: `linear-gradient(160deg, ${c["on-primary-fixed"]} 0%, ${c["surface-container-lowest"]} 62%)`,
          color: c["on-surface"],
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <svg viewBox="0 0 40 40" width="96" height="96">
            <rect x="2" y="2" width="36" height="36" rx="9" fill={c["surface-container-lowest"]} />
            {/* 초승달 — 큰 원에 배경색 원을 겹쳐 깎는다 */}
            <circle cx="25" cy="16" r="8.5" fill={c["primary-fixed"]} />
            <circle cx="20.5" cy="13.5" r="7.2" fill={c["surface-container-lowest"]} />
            {/* 달빛 아래로 뻗은 길 */}
            <path d="M13 38 L18.5 26 L23.5 26 L29 38 Z" fill={c["tertiary-fixed"]} />
            <rect x="2" y="2" width="36" height="36" rx="9" fill="none" stroke={c["secondary-container"]} strokeWidth="2" />
          </svg>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 76, fontWeight: 700, letterSpacing: "-0.02em" }}>운명대로</div>
            <div style={{ fontSize: 26, color: c.outline, letterSpacing: "0.08em" }}>unmyeongdaero.com</div>
          </div>
        </div>

        {/* Satori 는 자식이 둘 이상인 div 에 display 를 명시해야 한다 */}
        <div
          style={{
            marginTop: 48,
            display: "flex",
            flexDirection: "column",
            fontSize: 40,
            lineHeight: 1.4,
            color: c["on-surface-variant"],
          }}
        >
          <div>정통 명리 계산 위에 얹은</div>
          <div style={{ color: c.secondary, fontWeight: 600 }}>가장 명쾌하고 솔직한 운명 리포트</div>
        </div>

        <div style={{ marginTop: 40, fontSize: 26, color: c.outline }}>
          구독 결제 없음 · 단건 결제 · 보관함에서 영구 소장
        </div>
      </div>
    ),
    size,
  );
}
