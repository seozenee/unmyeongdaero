"use client";

import Link from "next/link";
import { getPoster } from "@/components/home/posters";
import { useInView } from "@/components/home/useInView";
import { WebtoonMedia } from "@/components/webtoon/WebtoonMedia";
import { Icon } from "@/components/ui/Icon";
import type { ReportProduct } from "@/lib/reports/catalog";
import { productFont } from "@/lib/reports/fonts";
import { getPitch } from "@/lib/reports/pitch";

// 평점·후기 수·열람자 수는 실거래 집계가 없으면 표시하지 않는다(표시광고법).
// 대신 상품이 실제로 담고 있는 사실(장수·가격·소장 조건)과 이 풀이가 내놓겠다고
// 약속한 한 줄만 보여 준다.

/** 대표로 세우는 풀이. 첫 화면 큰 카드(HeroCarousel)와 겹치지 않게 고른다. */
const DOSSIER = ["life", "reunion", "love", "yearly"] as const;

/**
 * 운명대로의 대표 풀이.
 *
 * 한동안 이 자리만 64px 짜리 정지 그림이었다. 위아래가 다 움직이는 화면에서 유일하게
 * 멈춰 있는 칸이라, 대표라고 세워 놓고 가장 싸 보였다. 같은 포스터 영상을 크게 깔고,
 * 그 풀이가 내놓겠다고 약속한 한 줄을 그림 위에 얹는다.
 */
export function MostReadSection({ products }: { products: ReportProduct[] }) {
  const bySlug = new Map(products.map((product) => [product.slug, product]));
  const items = DOSSIER.map((slug) => bySlug.get(slug)).filter((item): item is ReportProduct => Boolean(item));

  if (items.length === 0) return null;

  return (
    <section className="mt-space-xl flex flex-col gap-space-md">
      <div className="flex items-end justify-between px-space-xs">
        <div>
          <span className="font-label-sm text-label-sm tracking-widest text-primary">ORIGINAL DOSSIER</span>
          <h3 className="mt-0.5 font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
            운명대로의 대표 풀이
          </h3>
        </div>
        <span className="flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant">
          <Icon name="bolt" className="text-[14px]" /> 단건 결제
        </span>
      </div>

      <ol className="no-scrollbar -mx-margin flex snap-x gap-space-sm overflow-x-auto px-margin pb-1">
        {items.map((report) => (
          <li key={report.slug} className="w-[74vw] max-w-[19rem] shrink-0 snap-start">
            <DossierCard report={report} />
          </li>
        ))}
      </ol>
    </section>
  );
}

function DossierCard({ report }: { report: ReportProduct }) {
  const { ref, inView } = useInView<HTMLAnchorElement>();
  const poster = getPoster(report.slug, report.guide);
  const pitch = getPitch(report.slug);
  const font = productFont(report.slug);

  return (
    <Link
      ref={ref}
      href={`/reports/${report.slug}`}
      className="group relative block aspect-[4/5] h-full w-full overflow-hidden rounded-2xl bg-surface-container-low transition-transform active:scale-[0.99]"
    >
      {/*
        카드는 영상 한 장이다.
        그림 아래에 「12개월 열람 · 몇 장」을 적은 칸을 따로 달아 두었다. 카드마다 어두운
        네모가 한 겹 더 생겨 그림이 네모에 얹힌 꼴이 됐다. 영상 아래에 설명 상자를 다는
        영상은 없다. 글은 그림 위에 자막처럼 앉히고, 조건은 결제 화면에서 말한다.
      */}
      {poster && <WebtoonMedia asset={poster} active={inView} className="absolute inset-0" />}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/45 to-transparent" />

      <span className="absolute left-space-sm top-space-sm rounded-full bg-black/40 px-2 py-0.5 font-label-sm text-label-sm text-white backdrop-blur-md">
        {report.categoryLabel}
      </span>

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 px-space-md pb-space-md">
        <span
          className="text-[2rem] leading-tight tracking-tight text-white [text-shadow:0_1px_16px_rgb(0_0_0/0.6)]"
          style={font ? { fontFamily: font } : undefined}
        >
          {report.title}
        </span>
        {pitch && (
          <span className="line-clamp-2 font-body-md text-body-md leading-snug text-white/85 [text-shadow:0_1px_10px_rgb(0_0_0/0.7)]">
            {pitch.claims[0]}
          </span>
        )}
      </div>
    </Link>
  );
}
