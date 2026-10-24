import Link from "next/link";
import { STITCH_ASSETS } from "@/components/home/assets";
import { GuideAvatar } from "@/components/story/GuideAvatar";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import { formatKRW } from "@/lib/format";
import type { ReportProduct } from "@/lib/reports/catalog";
import { getGuide } from "@/lib/story/guides";

/** 첫 화면에 크게 세울 상품. 순서가 곧 노출 순위다. */
const FEATURED = ["destiny-full", "reunion-deep", "child-admission", "compatibility", "business"] as const;

interface HeroCarouselProps {
  products: ReportProduct[];
}

/**
 * 첫 화면의 큰 카드 묶음.
 *
 * 작은 카드를 바둑판으로 깔면 한 번에 많이 보이지만, 어느 것도 눈에 걸리지 않는다.
 * 손가락으로 넘기는 큰 카드는 한 번에 하나만 보여 주는 대신 그 하나를 확실히 보여 준다.
 * 가로 스냅 스크롤이라 자바스크립트 없이 서버 컴포넌트로 둘 수 있다.
 */
export function HeroCarousel({ products }: HeroCarouselProps) {
  const bySlug = new Map(products.map((product) => [product.slug, product]));
  const items = FEATURED.map((slug) => bySlug.get(slug)).filter((item): item is ReportProduct => Boolean(item));
  if (items.length === 0) return null;

  return (
    <section className="-mx-margin mt-space-sm" aria-label="지금 가장 많이 보는 풀이">
      <ol className="no-scrollbar flex snap-x snap-mandatory gap-space-sm overflow-x-auto px-margin pb-space-xs">
        {items.map((report, index) => {
          const guide = getGuide(report.guide);
          return (
            <li key={report.slug} className="w-[82vw] max-w-[22rem] shrink-0 snap-center">
              <Link
                href={`/reports/${report.slug}`}
                className="group relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-2xl bg-surface-container shadow-xl transition-transform active:scale-[0.98]"
              >
                {/* 표지 — 글자가 앉을 아래쪽을 깊게 덮는다 */}
                <div
                  role="img"
                  aria-label=""
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url('${STITCH_ASSETS[report.cover]}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/75 to-transparent" />

                {/* 순위 — 첫 장만 금색으로 */}
                <span
                  className={cn(
                    "absolute left-space-md top-space-md flex flex-col items-center rounded-lg px-2 py-1 font-label-sm text-label-sm leading-none backdrop-blur",
                    index === 0 ? "bg-secondary text-on-secondary" : "bg-surface-container-lowest/70 text-on-surface-variant",
                  )}
                >
                  <span className="text-[10px] tracking-widest">TOP</span>
                  <span className="mt-0.5 font-headline-sm text-headline-sm leading-none">{index + 1}</span>
                </span>

                <div className="absolute right-space-md top-space-md">
                  <GuideAvatar guide={guide} size="sm" />
                </div>

                <div className="relative flex flex-col gap-space-xs p-space-lg">
                  <span className="w-fit rounded-full bg-secondary-container/70 px-2.5 py-1 font-label-sm text-label-sm text-on-secondary-container backdrop-blur">
                    {report.categoryLabel}
                  </span>

                  {/* 간판은 작게, 손님을 붙잡는 줄은 크게 */}
                  <span className="font-label-md text-label-md text-secondary">{report.title}</span>
                  <h3 className="font-headline-xl-mobile text-headline-xl-mobile leading-tight tracking-tight text-on-surface">
                    {report.tagline}
                  </h3>

                  <div className="mt-space-xs flex items-baseline gap-2">
                    {report.originalPrice && (
                      <span className="font-body-sm text-body-sm text-outline line-through">
                        {formatKRW(report.originalPrice)}
                      </span>
                    )}
                    <span className="font-price-display text-price-display text-on-surface">{formatKRW(report.price)}</span>
                    {report.discountLabel && (
                      <span className="rounded bg-secondary-container/50 px-1.5 py-0.5 font-label-sm text-label-sm font-bold text-secondary">
                        {report.discountLabel}
                      </span>
                    )}
                  </div>

                  <span className="mt-space-xs flex w-full items-center justify-center gap-1.5 rounded-xl bg-on-surface py-3 font-label-md text-label-md text-surface shadow-lg">
                    풀이 열어 보기
                    <Icon name="arrow_forward" className="text-[18px]" />
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
