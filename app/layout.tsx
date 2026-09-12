import type { Metadata, Viewport } from "next";
import tokens from "@/design/tokens.json";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://unmyeongdaero.com"),
  title: {
    default: "운명대로 — 현대인을 위한 가장 명쾌하고 솔직한 운명 리포트",
    template: "%s | 운명대로",
  },
  description:
    "정통 명리 계산 엔진 위에 서사형 해석을 얹은 사주 리포트. 구독 없이 단건 결제, 구매한 리포트는 보관함에서 영구 열람.",
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
        />
        {/* display=block: 아이콘 폰트 로딩 전 리거처 텍스트("notifications" 등)가 비치지 않도록 */}
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
