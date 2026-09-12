import Link from "next/link";
import { STITCH_ASSETS } from "@/components/home/assets";
import { Icon } from "@/components/ui/Icon";
import { formatKRW } from "@/lib/format";
import { getReport } from "@/lib/reports/catalog";

export function HighlightCard() {
  const report = getReport("reunion-deep")!;

  return (
    <section className="relative mt-space-md w-full">
      <div className="relative overflow-hidden rounded-xl bg-surface-container-low shadow-xl">
        <div
          role="img"
          aria-label="안개 낀 한국 전통 호수 위로 붉은 달빛이 번지는 한밤의 풍경"
          className="relative h-96 w-full bg-cover bg-center"
          style={{ backgroundImage: `url('${STITCH_ASSETS.highlightReunion}')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/70 to-transparent" />
          <div className="absolute left-space-md top-space-md flex items-center gap-space-xs">
            <span className="rounded-full bg-secondary-container/80 px-2.5 py-1 font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-secondary-container backdrop-blur-md">
              이달의 기획전
            </span>
            <span className="flex items-center gap-1 rounded-full bg-surface-container-highest/70 px-2.5 py-1 font-label-sm text-label-sm text-primary backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {report.chapters.length}장 구성
            </span>
          </div>
        </div>

        <div className="relative z-10 -mt-36 flex flex-col gap-space-sm p-space-lg">
          <span className="font-label-md text-label-md text-secondary">{report.categoryLabel} · 42페이지 분량</span>
          <h2 className="font-headline-xl-mobile text-headline-xl-mobile leading-tight tracking-tight text-on-surface">
            월령의 밤 : 그 사람은
            <br />왜 연락을 멈췄을까?
          </h2>
          <p className="mt-1 line-clamp-2 font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
            {report.description}
          </p>

          <div className="mt-2 flex items-center justify-between pt-2">
            <div className="flex items-baseline gap-2">
              <span className="font-price-display text-price-display text-secondary">{formatKRW(report.price)}</span>
              {report.originalPrice && (
                <span className="font-body-sm text-body-sm text-outline line-through">
                  {formatKRW(report.originalPrice)}
                </span>
              )}
              {report.discountLabel && (
                <span className="rounded bg-secondary-container/40 px-1.5 py-0.5 font-label-sm text-label-sm font-bold text-secondary">
                  {report.discountLabel}
                </span>
              )}
            </div>
            <span className="flex items-center gap-1 font-label-sm text-label-sm text-tertiary">
              <Icon name="lock_open" className="text-[16px]" />
              영구 소장
            </span>
          </div>

          <Link
            href={`/reports/${report.slug}`}
            className="mt-space-xs flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-secondary-container to-secondary py-3.5 font-label-md text-label-md text-on-secondary shadow-lg shadow-secondary-container/30 transition-transform active:scale-[0.98]"
          >
            <span>지금 즉시 열람하기</span>
            <Icon name="arrow_forward" className="text-[18px]" />
          </Link>
          <p className="text-center font-label-sm text-label-sm text-outline">구독 결제 없음 · 영구 소장 단건 열람권</p>
        </div>
      </div>
    </section>
  );
}
