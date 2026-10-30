import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckoutPanel } from "@/components/checkout/CheckoutPanel";
import { STITCH_ASSETS } from "@/components/home/assets";
import { GuideAvatar } from "@/components/story/GuideAvatar";
import { Icon } from "@/components/ui/Icon";
import { getCurrentUser, loginUrl } from "@/lib/auth/session";
import { getRepository } from "@/lib/db";
import { modes } from "@/lib/env";
import { formatKRW } from "@/lib/format";
import { CONSULT_TURN_LIMIT } from "@/lib/reports/catalog";
import { loadReport } from "@/lib/reports/store";
import { describeBirth } from "@/lib/story/format";
import { getGuide } from "@/lib/story/guides";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "결제", robots: { index: false } };

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { reading?: string; error?: string };
}) {
  const report = await loadReport(params.slug);
  if (!report) notFound();

  const self = `/checkout/${report.slug}${searchParams.reading ? `?reading=${searchParams.reading}` : ""}`;
  const user = await getCurrentUser();
  if (!user) redirect(loginUrl(self));

  const repo = getRepository();
  // 이미 소장한 리포트도 다시 살 수 있다. 전에는 이 자리에서 결과 화면으로 돌려보냈는데,
  // 그러면 다시 보려는 사람에게 길이 아예 없었다.
  //
  // 대신 가지고 있다는 사실을 알려 준다. 모르고 두 번 내는 일은 없어야 하니까.
  const owned = report.kind === "report" ? await repo.getPurchase(user.id, report.slug) : null;

  const inputPath = report.kind === "consult" ? "/consult" : `/reports/${report.slug}`;
  const reading = searchParams.reading ? await repo.getReading(searchParams.reading) : null;
  if (!reading || reading.userId !== user.id || reading.reportSlug !== report.slug) redirect(inputPath);

  const guide = getGuide(report.guide);
  const cover = STITCH_ASSETS[report.cover];

  return (
    <div className="flex w-full flex-col gap-space-md py-space-md">
      <Link href={inputPath} className="flex items-center gap-1 font-label-md text-label-md text-on-surface-variant">
        <Icon name="chevron_left" className="text-[18px]" /> 입력 정보 수정
      </Link>

      <section className="relative overflow-hidden rounded-xl bg-surface-container-low shadow-xl">
        <div role="img" aria-label="" className="relative h-44 w-full bg-cover bg-center" style={{ backgroundImage: `url('${cover}')` }}>
          <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/70 to-transparent" />
        </div>
        <div className="relative z-10 -mt-20 flex flex-col gap-space-sm p-space-lg">
          <span className="font-label-md text-label-md text-secondary">{report.categoryLabel}</span>
          <h1 className="font-headline-xl-mobile text-headline-xl-mobile tracking-tight text-on-surface">{report.title}</h1>
          <div className="flex items-center gap-space-xs">
            <GuideAvatar guide={guide} size="sm" />
            <span className="font-label-sm text-label-sm text-on-surface-variant">안내 · {guide.title}</span>
          </div>

          <dl className="mt-space-xs flex flex-col gap-1 rounded-lg bg-surface-container p-space-md font-body-sm text-body-sm">
            <div className="flex gap-space-sm">
              <dt className="w-14 shrink-0 text-outline">나</dt>
              <dd className="text-on-surface">
                {reading.subject.name} · {describeBirth(reading.subject)}
              </dd>
            </div>
            {reading.partner && (
              <div className="flex gap-space-sm">
                <dt className="w-14 shrink-0 text-outline">상대</dt>
                <dd className="text-on-surface">
                  {reading.partner.name} · {describeBirth(reading.partner)}
                </dd>
              </div>
            )}
          </dl>

          <div className="mt-2 flex items-baseline gap-2 pt-2">
            <span className="font-price-display text-price-display text-secondary">{formatKRW(report.price)}</span>
            {report.originalPrice && (
              <span className="font-body-sm text-body-sm text-outline line-through">{formatKRW(report.originalPrice)}</span>
            )}
            {report.discountLabel && (
              <span className="rounded bg-secondary-container/40 px-1.5 py-0.5 font-label-sm text-label-sm font-bold text-secondary">
                {report.discountLabel}
              </span>
            )}
          </div>

          {/*
            이미 같은 풀이를 가지고 있으면 그 사실을 먼저 말한다. 다시 사는 것을 막지는
            않지만, 모르고 두 번 내는 일은 없어야 한다. 보관함으로 가는 길도 함께 둔다.
          */}
          {owned && (
            <div className="mb-space-md flex flex-col gap-space-xs rounded-xl border border-outline-variant/60 bg-surface-container p-space-md">
              <span className="font-label-md text-label-md text-on-surface">이 풀이는 이미 가지고 계세요</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                지금 결제하면 방금 적어 주신 정보로 <strong className="text-on-surface">새 풀이</strong>를 한 벌 더 만들어요.
                전에 받은 풀이도 그대로 남아 있어요.
              </span>
              <Link
                href="/library"
                className="mt-0.5 flex w-fit items-center gap-1 font-label-sm text-label-sm text-secondary"
              >
                가지고 있는 풀이 보기
                <Icon name="chevron_right" className="text-[16px]" />
              </Link>
            </div>
          )}

          <CheckoutPanel
            slug={report.slug}
            readingId={reading.id}
            price={report.price}
            ctaLabel="지금 즉시 열람하기"
          />
        </div>
      </section>

      <section className="flex flex-col gap-space-sm rounded-xl bg-surface-container-low p-space-lg">
        <div className="flex items-center gap-space-xs text-primary">
          <Icon name="verified_user" className="text-[20px]" />
          <span className="font-label-md text-label-md">구독 결제 없음 · 12개월 열람권</span>
        </div>
        <ul className="flex flex-col gap-2 font-body-sm text-body-sm text-on-surface-variant">
          <li>· 매달 나가는 자동 결제가 없는 <strong className="text-on-surface">1회 결제</strong>예요.</li>
          {/* 서비스 제공기간은 전자상거래법 표시사항이자 카드사 심사 확인 항목이다.
              열람 기간은 제공기간이 아니므로 둘을 나눠 적는다. */}
          {report.kind === "consult" ? (
            <li>
              · <strong className="text-on-surface">제공기간</strong> · 결제 즉시 상담 세션이 열리고, 개설일로부터 30일
              동안 이용할 수 있어요.
            </li>
          ) : (
            <li>
              · <strong className="text-on-surface">제공기간</strong> · 결제 즉시 풀이 생성이 시작돼 보통 1~2분 안에,
              늦어도 24시간 안에 받아 보실 수 있어요.
            </li>
          )}
          {report.kind !== "consult" && (
            <li>
              · <strong className="text-on-surface">열람 기간</strong> · 받은 풀이는 보관함에서{" "}
              <strong className="text-on-surface">결제일로부터 12개월</strong> 동안 다시 열고 PDF 로 내려받을 수 있어요.
            </li>
          )}
          {report.kind === "consult" ? (
            <li>
              · 결제 1회로 <strong className="text-on-surface">질문 {CONSULT_TURN_LIMIT}개</strong>까지 자유롭게 대화하고, 기록은 보관함에 남아요.
            </li>
          ) : (
            <li>
              · 완성된 풀이는 <strong className="text-on-surface">보관함에서 12개월 동안</strong> 다시 볼 수 있어요.
            </li>
          )}
          <li>
            · 환불 기준은{" "}
            <Link href="/refund" className="underline">
              환불규정
            </Link>
            을 확인해 주세요.
          </li>
        </ul>
        {modes.payment() === "mock" && (
          <p className="font-label-sm text-label-sm text-tertiary">개발 환경 · 토스페이먼츠 키가 없어 모의 결제창이 열립니다.</p>
        )}
      </section>
    </div>
  );
}
