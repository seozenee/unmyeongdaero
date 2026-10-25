import type { Metadata } from "next";
import Link from "next/link";
import { ConsultIntro } from "@/components/consult/ConsultIntro";
import { ConsultStart } from "@/components/consult/ConsultStart";
import { Icon } from "@/components/ui/Icon";
import { getCurrentUser, loginUrl } from "@/lib/auth/session";
import { getActiveSession } from "@/lib/consult/service";
import { getRepository } from "@/lib/db";
import { CONSULT_TURN_LIMIT, getReport } from "@/lib/reports/catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "1:1 사주 상담" };

/**
 * 채팅 진입 화면.
 *
 * 아래쪽 탭에서 검색이 쓰던 자리를 넘겨받은 화면이라, 상품 상세와 같은 결로 보여 준다 —
 * 포스터가 화면을 채우고, 무엇을 묻는 자리인지 대화 모양으로 먼저 보여 주고, 명식을
 * 적는 자리는 맨 끝에 둔다.
 */
export default async function ConsultLandingPage() {
  const product = getReport("consult")!;
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
    <div className="flex w-full flex-col gap-space-lg pb-space-xl">
      <ConsultIntro product={product} turnLimit={CONSULT_TURN_LIMIT} />

      {active && (
        <Link
          href={`/consult/${active.id}`}
          className="flex items-center gap-space-md rounded-2xl bg-primary/10 p-space-md ring-1 ring-primary/40"
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
        <ConsultStart initialSubject={lastSubject} />
      ) : (
        <Link
          href={loginUrl("/consult")}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary py-4 font-label-md text-label-md font-bold text-on-secondary shadow-lg shadow-secondary/25"
        >
          로그인하고 상담 시작하기
          <Icon name="arrow_forward" className="text-[18px]" />
        </Link>
      )}
    </div>
  );
}
