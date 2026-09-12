import { AppHeader } from "@/components/ui/AppHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { DesktopFrame } from "@/components/ui/DesktopFrame";

// 이 레이아웃의 모든 화면은 헤더에 로그인 상태를 그리므로 요청 시점에 렌더한다.
// 정적 생성하면 빌드 단계에서 인증 백엔드를 찾다가 실패한다(쿠키를 읽기도 전에).
export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DesktopFrame />
      <AppHeader />
      {/* PC 에서는 가운데 컬럼이 배경 위에 떠 있는 판처럼 보이게 테두리를 준다.
          z-index 는 주지 않는다 — 쌓임 맥락이 생기면 안에 있는 웹툰 스테이지(z-60)가
          바깥 하단바(z-50)를 넘지 못해 버튼이 가려진다. */}
      <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-surface px-margin pb-24 pt-16 lg:shadow-[0_0_80px_rgba(0,0,0,0.55)] lg:ring-1 lg:ring-outline-variant/30">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
