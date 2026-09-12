import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GuideAvatar } from "@/components/story/GuideAvatar";
import { getCurrentUser, safeNextPath } from "@/lib/auth/session";
import { modes } from "@/lib/env";
import { getGuide } from "@/lib/story/guides";

export const metadata: Metadata = { title: "로그인" };
export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  oauth: "카카오 로그인을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.",
  callback: "로그인을 마무리하지 못했어요. 다시 시도해 주세요.",
};

export default async function LoginPage({ searchParams }: { searchParams: { next?: string; error?: string } }) {
  const next = safeNextPath(searchParams.next);
  if (await getCurrentUser()) redirect(next);

  const kakao = modes.data() === "supabase";
  const guide = getGuide("seoha");
  const loginHref = `/auth/login?next=${encodeURIComponent(next)}`;

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-space-lg py-space-xl text-center">
      <GuideAvatar guide={guide} size="lg" />
      <div className="flex flex-col gap-space-xs">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">운명대로에 오신 걸 환영해요</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          구매한 리포트와 상담 기록은 계정 보관함에
          <br />
          기간 제한 없이 안전하게 남아요.
        </p>
      </div>

      {searchParams.error && ERROR_MESSAGES[searchParams.error] && (
        <p className="w-full rounded-lg bg-error-container/30 p-space-sm font-body-sm text-body-sm text-on-surface">
          {ERROR_MESSAGES[searchParams.error]}
        </p>
      )}

      <div className="flex w-full flex-col gap-space-sm">
        {kakao ? (
          // 카카오 브랜드 가이드의 공식 버튼 색(#FEE500 / 85% 검정)을 따른다 — 디자인 토큰 예외
          <a
            href={loginHref}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] py-3.5 font-label-md text-label-md text-black/85 transition-transform active:scale-[0.98]"
          >
            <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 fill-current">
              <path d="M12 3C6.48 3 2 6.54 2 10.9c0 2.8 1.86 5.27 4.66 6.67l-.95 3.5c-.08.3.26.54.52.37l4.17-2.77c.52.06 1.05.1 1.6.1 5.52 0 10-3.54 10-7.87S17.52 3 12 3z" />
            </svg>
            카카오로 3초 만에 시작하기
          </a>
        ) : (
          <>
            <a
              href={loginHref}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-on-surface py-3.5 font-label-md text-label-md text-surface transition-transform active:scale-[0.98]"
            >
              개발용 계정으로 시작하기
            </a>
            <p className="font-label-sm text-label-sm text-outline">
              Supabase 가 연결되지 않은 개발 환경이라 카카오 로그인 대신 임시 계정을 씁니다.
            </p>
          </>
        )}
      </div>

      <p className="font-label-sm text-label-sm text-outline">
        시작하면{" "}
        <Link href="/terms" className="underline">
          이용약관
        </Link>
        과{" "}
        <Link href="/privacy" className="underline">
          개인정보처리방침
        </Link>
        에 동의하게 됩니다.
      </p>
    </div>
  );
}
