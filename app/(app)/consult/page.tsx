import type { Metadata } from "next";
import Link from "next/link";
import { ConsultStart } from "@/components/consult/ConsultStart";
import { GuideAvatar } from "@/components/story/GuideAvatar";
import { Icon } from "@/components/ui/Icon";
import { getCurrentUser, loginUrl } from "@/lib/auth/session";
import { getActiveSession } from "@/lib/consult/service";
import { getRepository } from "@/lib/db";
import { isSazuSandbox } from "@/lib/env";
import { formatKRW } from "@/lib/format";
import { CONSULT_TURN_LIMIT, getReport } from "@/lib/reports/catalog";
import { getGuide } from "@/lib/story/guides";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "AI 사주 상담" };

export default async function ConsultLandingPage() {
  const product = getReport("consult")!;
  const guide = getGuide(product.guide);
  const user = await getCurrentUser();
  const active = user ? await getActiveSession(user) : null;

  // 가장 최근 리포트 입력 정보를 상담 명식 기본값으로 제안
  let lastSubject = null;
  if (user) {
    const purchases = await getRepository().listPurchases(user.id);
    const reading = purchases[0]?.readingId ? await getRepository().getReading(purchases[0].readingId) : null;
    lastSubject = reading?.subject ?? null;
  }

  return (
    <div className="flex w-full flex-col gap-space-lg py-space-md">
      <section className="flex flex-col items-center gap-space-md rounded-xl bg-surface-container-low p-space-lg text-center">
        <GuideAvatar guide={guide} size="lg" />
        <div className="flex flex-col gap-space-xs">
          <span className="font-label-sm text-label-sm tracking-widest text-primary">AI CONSULT</span>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">{product.title}</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">{guide.tagline}</p>
        </div>
        <ul className="flex w-full flex-col gap-1.5 rounded-lg bg-surface-container p-space-md text-left font-body-sm text-body-sm text-on-surface-variant">
          <li className="flex items-center gap-space-xs">
            <Icon name="forum" className="text-[16px] text-primary" /> 결제 1회 = 질문 {CONSULT_TURN_LIMIT}개까지 자유 대화
          </li>
          <li className="flex items-center gap-space-xs">
            <Icon name="fact_check" className="text-[16px] text-primary" /> 내 명식 데이터에 근거한 답변, 단정적 예언은 하지 않아요
          </li>
          <li className="flex items-center gap-space-xs">
            <Icon name="auto_stories" className="text-[16px] text-primary" /> 대화 기록은 보관함에서 다시 볼 수 있어요
          </li>
        </ul>
        <span className="font-price-display text-price-display text-secondary">{formatKRW(product.price)}</span>
      </section>

      {active && (
        <Link
          href={`/consult/${active.id}`}
          className="flex items-center gap-space-md rounded-xl bg-primary/10 p-space-md ring-1 ring-primary/40"
        >
          <Icon name="play_circle" className="text-[28px] text-primary" />
          <div className="flex flex-1 flex-col">
            <span className="font-label-md text-label-md text-on-surface">진행 중인 상담 이어하기</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              남은 질문 {active.turnLimit - active.turnsUsed}/{active.turnLimit}
            </span>
          </div>
          <Icon name="chevron_right" className="text-outline" />
        </Link>
      )}

      {user ? (
        <ConsultStart sandbox={isSazuSandbox()} initialSubject={lastSubject} />
      ) : (
        <Link
          href={loginUrl("/consult")}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-on-surface py-3.5 font-label-md text-label-md text-surface"
        >
          로그인하고 상담 시작하기
        </Link>
      )}
    </div>
  );
}
