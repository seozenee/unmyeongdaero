import { AppHeader } from "@/components/ui/AppHeader";
import { BottomNav } from "@/components/ui/BottomNav";

// 이 레이아웃의 모든 화면은 헤더에 로그인 상태를 그리므로 요청 시점에 렌더한다.
// 정적 생성하면 빌드 단계에서 인증 백엔드를 찾다가 실패한다(쿠키를 읽기도 전에).
export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader />
      <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-surface px-margin pb-24 pt-16">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
