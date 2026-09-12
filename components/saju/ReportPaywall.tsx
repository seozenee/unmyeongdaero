import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { formatKRW } from "@/lib/format";
import type { ReportProduct } from "@/lib/reports/catalog";

interface ReportPaywallProps {
  report: Pick<ReportProduct, "slug" | "title" | "price" | "originalPrice" | "discountLabel">;
  /**
   * 블러 뒤에 깔 티저. ⚠️ 미구매 상태에서는 절대 실제 유료 해석을 넣지 말 것 —
   * CSS 블러는 개발자 도구로 걷어낼 수 있다. 샘플 문장이나 무료 영역(원국 표 등)만 전달한다.
   */
  teaser: React.ReactNode;
  /** 페이지 헤더에 이미 제목이 있으면 false */
  showTitle?: boolean;
}

export function ReportPaywall({ report, teaser, showTitle = true }: ReportPaywallProps) {
  return (
    <section className="relative overflow-hidden rounded-xl" aria-label="유료 리포트 잠금">
      {/* 티저에는 링크·버튼 같은 포커스 가능한 요소를 넣지 않는다(aria-hidden 영역) */}
      <div aria-hidden className="pointer-events-none select-none blur-sm">
        {teaser}
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-surface/40 via-surface/80 to-surface" />

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-space-sm p-space-lg">
        <span className="flex items-center gap-1 font-label-md text-label-md text-secondary">
          <Icon name="lock" className="text-[16px]" />
          전체 풀이는 열람권 구매 후 확인할 수 있어요
        </span>
        {showTitle && <h3 className="font-headline-md text-headline-md text-on-surface">{report.title}</h3>}

        <div className="flex items-baseline gap-2">
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

        <Link
          href={`/checkout/${report.slug}`}
          className="mt-space-xs flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-secondary-container to-secondary py-3.5 font-label-md text-label-md text-on-secondary shadow-lg shadow-secondary-container/30 transition-transform active:scale-[0.98]"
        >
          <span>지금 즉시 열람하기</span>
          <Icon name="arrow_forward" className="text-[18px]" />
        </Link>
        <p className="text-center font-label-sm text-label-sm text-outline">구독 결제 없음 · 영구 소장 단건 열람권</p>
      </div>
    </section>
  );
}
