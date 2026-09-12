"use client";

// 루트 레이아웃까지 실패했을 때의 최후 화면 — 전역 CSS 가 없을 수 있어 인라인 스타일만 쓴다.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#121318", color: "#e3e1e9", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ textAlign: "center", padding: 24 }}>
          <h1 style={{ fontSize: 20 }}>서비스에 일시적인 문제가 생겼어요</h1>
          <p style={{ opacity: 0.7 }}>잠시 후 다시 시도해 주세요.</p>
          <button type="button" onClick={reset} style={{ marginTop: 16, padding: "12px 20px", borderRadius: 12, border: 0 }}>
            다시 시도
          </button>
        </div>
      </body>
    </html>
  );
}
