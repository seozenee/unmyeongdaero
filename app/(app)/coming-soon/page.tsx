import type { Metadata } from "next";
import Link from "next/link";
import { GuideAvatar } from "@/components/story/GuideAvatar";
import { Icon } from "@/components/ui/Icon";
import { getGuide } from "@/lib/story/guides";

export const metadata: Metadata = { title: "정식 오픈 준비 중" };

// LANDING_ONLY=1 임시 배포에서 결제·로그인·보관함 경로가 여기로 온다.
export default function ComingSoonPage() {
  const guide = getGuide("seoha");

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-space-lg py-space-xl text-center">
      <GuideAvatar guide={guide} size="lg" />
      <div className="flex flex-col gap-space-xs">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">정식 오픈 준비 중이에요</h1>
        <p className="font-body-md text-body-md leading-relaxed text-on-surface-variant">
          지금은 서비스를 미리 둘러보실 수 있는 화면만 열려 있어요.
          <br />
          결제와 보관함은 정식 오픈과 함께 열립니다.
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-space-sm">
        <Link
          href="/"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-on-surface py-3.5 font-label-md text-label-md text-surface transition-transform active:scale-[0.98]"
        >
          <Icon name="home" className="text-[18px]" />
          홈으로 돌아가기
        </Link>
        <Link
          href="/free/today"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-surface-container-high py-3.5 font-label-md text-label-md text-on-surface"
        >
          무료 콘텐츠 먼저 보기
        </Link>
      </div>
    </div>
  );
}
