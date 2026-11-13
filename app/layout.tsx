import type { Metadata, Viewport } from "next";
import tokens from "@/design/tokens.json";
import { env } from "@/lib/env";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: {
    default: "운명대로 | 나를 이해하는 사주 리포트",
    template: "%s | 운명대로",
  },
  description:
    "타고난 성향부터 연애, 일, 재물의 흐름까지. 지금의 고민을 나만의 사주 리포트로 풀어보세요.",
  openGraph: {
    type: "website", locale: "ko_KR", siteName: "운명대로",
    title: "운명대로 | 나를 이해하는 사주 리포트",
    description: "타고난 성향부터 연애, 일, 재물의 흐름까지. 지금의 고민을 나만의 사주 리포트로 풀어보세요.",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: tokens.colors.surface,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="dark">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        {/* 본문이 거의 전부 한글이다. 라틴 서체로는 한글이 대체 서체로 떨어져
            자간과 무게가 화면마다 달라진다. Pretendard 한 벌로 통일한다. */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
        />
        {/* display=block: 아이콘 폰트 로딩 전 리거처 텍스트("notifications" 등)가 비치지 않도록 */}
        {/* 상품 간판용 한글 디스플레이 서체 — 상품마다 다른 목소리를 준다 (lib/reports/fonts.ts) */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=Song+Myung&family=Gugi&family=Jua&family=Do+Hyeon&family=Nanum+Brush+Script&family=Gasoek+One&family=Yeon+Sung&display=swap"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font, @next/next/google-font-display */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
      </head>
      <body className="flex min-h-screen flex-col bg-surface font-body-md text-body-md text-on-surface selection:bg-primary/20">
        {children}
      </body>
    </html>
  );
}
