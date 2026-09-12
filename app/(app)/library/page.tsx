import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { STITCH_ASSETS } from "@/components/home/assets";
import { Icon } from "@/components/ui/Icon";
import { getCurrentUser, loginUrl } from "@/lib/auth/session";
import { getRepository, type ReadingStatus } from "@/lib/db";
import { modes } from "@/lib/env";
import { getReport } from "@/lib/reports/catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "보관함", robots: { index: false } };

const STATUS_LABEL: Record<ReadingStatus, { label: string; className: string }> = {
  draft: { label: "풀이 준비 전", className: "bg-surface-container-highest text-on-surface-variant" },
  generating: { label: "풀이 쓰는 중", className: "bg-primary/15 text-primary" },
  ready: { label: "읽기", className: "bg-tertiary/15 text-tertiary" },
  failed: { label: "다시 시도 필요", className: "bg-error-container/40 text-error" },
};

const dateFormat = new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric" });

export default async function LibraryPage() {
  const user = await getCurrentUser();
  if (!user) redirect(loginUrl("/library"));

  const repo = getRepository();
  const [purchases, sessions] = await Promise.all([repo.listPurchases(user.id), repo.listConsultSessions(user.id)]);
  const readings = await Promise.all(purchases.map((purchase) => (purchase.readingId ? repo.getReading(purchase.readingId) : null)));

  return (
    <div className="flex w-full flex-col gap-space-xl py-space-md">
      <header className="flex items-end justify-between px-space-xs">
        <div>
          <span className="font-label-sm text-label-sm tracking-widest text-primary">MY LIBRARY</span>
          <h1 className="mt-0.5 font-headline-lg-mobile text-headline-lg-mobile text-on-surface">나의 보관함</h1>
        </div>
        <span className="font-label-sm text-label-sm text-outline">
          {user.displayName ?? "회원"}님 · {user.provider === "kakao" ? "카카오" : "개발용 계정"}
        </span>
      </header>

      <section className="flex flex-col gap-space-md">
        <h2 className="px-space-xs font-label-md text-label-md text-on-surface-variant">소장한 리포트 {purchases.length}</h2>
        {purchases.length === 0 ? (
          <div className="flex flex-col items-center gap-space-sm rounded-xl bg-surface-container p-space-xl text-center">
            <Icon name="auto_stories" className="text-[32px] text-outline" />
            <p className="font-body-md text-body-md text-on-surface-variant">아직 소장한 리포트가 없어요.</p>
            <Link href="/" className="rounded-xl bg-on-surface px-space-lg py-2.5 font-label-md text-label-md text-surface">
              풀이 둘러보기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-space-sm">
            {purchases.map((purchase, index) => {
              const report = getReport(purchase.reportSlug);
              if (!report) return null;
              const status = STATUS_LABEL[readings[index]?.status ?? "draft"];
              return (
                <Link
                  key={purchase.id}
                  href={`/reports/${report.slug}/read`}
                  className="group flex flex-col overflow-hidden rounded-xl bg-surface-container shadow-sm transition-transform active:scale-[0.98]"
                >
                  <div
                    role="img"
                    aria-label=""
                    className="relative h-28 bg-cover bg-center"
                    style={{ backgroundImage: `url('${STITCH_ASSETS[report.cover]}')` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-container to-transparent" />
                    <span className={`absolute right-2 top-2 rounded-full px-2 py-0.5 font-label-sm text-label-sm ${status.className}`}>
                      {status.label}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-space-md">
                    <span className="font-label-sm text-label-sm text-secondary">{report.categoryLabel}</span>
                    <span className="line-clamp-2 font-label-md text-label-md text-on-surface">{report.title}</span>
                    <span className="mt-auto font-label-sm text-label-sm text-outline">
                      {dateFormat.format(new Date(purchase.purchasedAt))}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-space-md">
        <div className="flex items-center justify-between px-space-xs">
          <h2 className="font-label-md text-label-md text-on-surface-variant">AI 상담 기록 {sessions.length}</h2>
          <Link href="/consult" className="font-label-sm text-label-sm text-primary">
            새 상담
          </Link>
        </div>
        {sessions.length === 0 ? (
          <p className="rounded-xl bg-surface-container p-space-lg font-body-sm text-body-sm text-on-surface-variant">
            아직 상담 기록이 없어요.
          </p>
        ) : (
          <ul className="flex flex-col gap-space-sm">
            {sessions.map((session) => (
              <li key={session.id}>
                <Link
                  href={`/consult/${session.id}`}
                  className="flex items-center gap-space-md rounded-xl bg-surface-container-high p-space-md transition-colors hover:bg-surface-bright"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon name="forum" className="text-[22px]" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="font-label-md text-label-md text-on-surface">{session.subject.name}님의 상담</span>
                    <span className="font-label-sm text-label-sm text-outline">
                      {dateFormat.format(new Date(session.createdAt))} · 질문 {session.turnsUsed}/{session.turnLimit}
                    </span>
                  </div>
                  <Icon name="chevron_right" className="text-outline" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form action="/auth/logout" method="post" className="flex flex-col items-center gap-space-xs">
        <button type="submit" className="font-label-md text-label-md text-outline underline">
          로그아웃
        </button>
        {modes.data() === "local" && (
          <span className="font-label-sm text-label-sm text-outline/70">개발 대체 모드 · 데이터는 .data/local-db.json 에 저장돼요</span>
        )}
      </form>
    </div>
  );
}
