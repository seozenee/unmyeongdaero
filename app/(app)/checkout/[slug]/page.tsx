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
import { CONSULT_TURN_LIMIT, getReport } from "@/lib/reports/catalog";
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
  const report = getReport(params.slug);
  if (!report) notFound();

  const self = `/checkout/${report.slug}${searchParams.reading ? `?reading=${searchParams.reading}` : ""}`;
  const user = await getCurrentUser();
  if (!user) redirect(loginUrl(self));

  const repo = getRepository();
  // 이미 소장한 리포트는 결제 화면을 건너뛴다
  if (report.kind === "report" && (await repo.getPurchase(user.id, report.slug))) {
    redirect(`/reports/${report.slug}/read`);
  }

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
          <span className="font-label-md text-label-md">구독 결제 없음, 영구 소장 단건 열람권</span>
        </div>
        <ul className="flex flex-col gap-2 font-body-sm text-body-sm text-on-surface-variant">
          <li>· 매달 나가는 자동 결제가 없는 <strong className="text-on-surface">1회 결제</strong>예요.</li>
          {report.kind === "consult" ? (
            <li>
              · 결제 1회로 <strong className="text-on-surface">질문 {CONSULT_TURN_LIMIT}개</strong>까지 자유롭게 대화하고, 기록은 보관함에 남아요.
            </li>
          ) : (
            <li>
              · 완성된 풀이는 <strong className="text-on-surface">보관함에서 기간 제한 없이</strong> 다시 볼 수 있어요.
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
          <p className="font-label-sm text-label-sm text-tertiary">개발 환경 · PortOne 키가 없어 모의 결제창이 열립니다.</p>
        )}
      </section>
    </div>
  );
}
