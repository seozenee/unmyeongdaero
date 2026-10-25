"use client";

import { useInView } from "@/components/home/useInView";
import { getWebtoonAsset } from "@/components/webtoon/assets";
import { WebtoonMedia } from "@/components/webtoon/WebtoonMedia";
import type { ReportProduct } from "@/lib/reports/catalog";
import { GUIDES, type Guide } from "@/lib/story/guides";

/**
 * 세 안내자.
 *
 * 상품 카드만 늘어놓으면 "누가 써 주는 글인가" 가 끝까지 안 나온다. 우리가 파는 것은
 * 자동 생성 문서가 아니라 세 사람의 목소리다. 얼굴을 한 번 보여 주고, 각자 무엇을
 * 맡는지 적는다. 숫자는 실제로 걸려 있는 상품 수다.
 *
 * 그림은 안내자 소개 컷(intro-5, 눈을 맞추는 가까운 장면)을 그대로 쓴다.
 */
export function GuideShelf({ products }: { products: ReportProduct[] }) {
  const guides = Object.values(GUIDES);

  return (
    <section className="mt-space-xl flex flex-col gap-space-md">
      <div className="flex items-end justify-between px-space-xs">
        <div>
          <span className="font-label-sm text-label-sm tracking-widest text-tertiary">OUR READERS</span>
          <h3 className="mt-0.5 font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
            풀이를 써 주는 세 사람
          </h3>
        </div>
      </div>

      <ol className="no-scrollbar -mx-margin flex snap-x gap-space-sm overflow-x-auto px-margin pb-1">
        {guides.map((guide) => (
          <li key={guide.id} className="w-[58vw] max-w-[14rem] shrink-0 snap-start">
            <GuideCard guide={guide} count={products.filter((product) => product.guide === guide.id).length} />
          </li>
        ))}
      </ol>
    </section>
  );
}

function GuideCard({ guide, count }: { guide: Guide; count: number }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const asset = getWebtoonAsset(guide.id, "intro-5");

  return (
    <div ref={ref} className="flex h-full flex-col overflow-hidden rounded-2xl bg-surface-container shadow-lg">
      <div className="relative aspect-[3/4] w-full overflow-hidden">
        {asset && <WebtoonMedia asset={asset} active={inView} className="absolute inset-0" />}
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-surface-container to-transparent" />
        <span
          aria-hidden
          className="absolute right-space-sm top-space-sm text-[2rem] leading-none text-on-surface/25"
          style={{ fontFamily: "'Song Myung', serif" }}
        >
          {guide.seal}
        </span>
        <div className="absolute inset-x-0 bottom-0 px-space-sm pb-space-xs">
          <span className="font-headline-md text-headline-md text-on-surface [text-shadow:0_1px_8px_rgb(0_0_0/0.9)]">
            {guide.title}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1 px-space-sm py-space-sm">
        <p className="font-body-sm text-body-sm leading-snug text-on-surface-variant">{guide.tagline}</p>
        {count > 0 && <span className="mt-auto font-label-sm text-label-sm text-tertiary">풀이 {count}개를 맡아요</span>}
      </div>
    </div>
  );
}
