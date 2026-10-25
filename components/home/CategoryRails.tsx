"use client";

import Link from "next/link";
import { STITCH_ASSETS } from "@/components/home/assets";
import { getPoster } from "@/components/home/posters";
import { useInView } from "@/components/home/useInView";
import { Icon } from "@/components/ui/Icon";
import { WebtoonMedia } from "@/components/webtoon/WebtoonMedia";
import { formatKRW } from "@/lib/format";
import type { ReportCategory, ReportProduct } from "@/lib/reports/catalog";
import { productFont } from "@/lib/reports/fonts";
import { getPitch } from "@/lib/reports/pitch";

/**
 * 가로 줄의 목록.
 *
 * 분류로만 줄을 만들었더니 연애·궁합·신년·재물·공부가 카드 한 장짜리 줄이 됐다.
 * 한 장만 놓인 줄은 "밀 것이 없는 슬라이드" 라서, 채우려고 만든 줄이 오히려 비어
 * 보인다. 그래서 줄을 분류가 아니라 "그 고민을 가진 사람이 같이 보는 것" 으로 짠다.
 * 한 상품이 여러 줄에 나오는 것은 괜찮다 — 연애를 보는 사람이 궁합도 보는 게 자연스럽다.
 *
 * 제목은 분류명이 아니라 손님의 말이어야 한다. "재회" 보다 "다시 만날 수 있을까" 가
 * 먼저 읽힌다.
 *
 * id 는 위쪽 탭과 고민 바로가기가 내려와 멈추는 자리다.
 */
const RAILS: ReadonlyArray<{
  id: ReportCategory | "all";
  heading: string;
  caption: string;
  /** 이 줄에 세울 상품. 앞에서부터 순서대로 */
  slugs: readonly string[];
}> = [
  {
    id: "child",
    heading: "우리 아이는?",
    caption: "입시 · 공부 · 진로 · 재능",
    slugs: ["child-admission", "child-study", "child-dream", "child-talent", "parent-child"],
  },
  {
    id: "reunion",
    heading: "그 사람은?",
    caption: "속마음과 다시 닿는 때",
    slugs: ["reunion-deep", "reunion", "love", "compatibility"],
  },
  {
    id: "romance",
    heading: "나의 연애는?",
    caption: "타고난 연애의 결",
    slugs: ["love", "compatibility", "reunion", "destiny-full"],
  },
  {
    id: "chemistry",
    heading: "우리 둘은?",
    caption: "부딪히는 자리와 닿는 말",
    slugs: ["compatibility", "parent-child", "love", "reunion-deep"],
  },
  {
    id: "destiny",
    heading: "내 인생은?",
    caption: "타고난 결과 큰 흐름",
    slugs: ["destiny-full", "life", "health", "yearly"],
  },
  {
    id: "year",
    heading: "올해와 내년은?",
    caption: "달마다의 흐름",
    slugs: ["yearly", "destiny-full", "money", "career"],
  },
  {
    id: "wealth",
    heading: "내 돈은?",
    caption: "들어오는 길목과 새는 구멍",
    slugs: ["money", "business", "career", "life"],
  },
  {
    id: "work",
    heading: "내 일은?",
    caption: "적성 · 사업 · 움직일 때",
    slugs: ["career", "business", "money", "study"],
  },
  {
    id: "study",
    heading: "내 공부는?",
    caption: "붙는 시기와 맞는 방식",
    slugs: ["study", "child-study", "child-admission", "child-talent"],
  },
];

/** 한 줄에 최소 이만큼은 놓는다. 모자라면 같은 분류 → 그 밖의 상품으로 채운다 */
const MIN_PER_RAIL = 3;

/**
 * 주제별 가로 줄.
 *
 * 세로로는 주제만 훑고, 관심 있는 줄에서만 옆으로 민다. 찾는 사람에게도 구경하는
 * 사람에게도 길이 생긴다.
 *
 * 맨 아래 "모든 풀이" 줄은 빠진 상품이 없게 하는 안전망이다. 운영 화면에서 새로 만든
 * 상품은 위의 기획된 줄에 없으므로, 그 줄에서만 만날 수 있다.
 *
 * 카드는 영상이다. 다만 열일곱 장을 한꺼번에 틀면 브라우저가 디코더를 아끼려고
 * 제멋대로 멈춰 세우므로, 화면에 들어온 카드만 재생한다(useInView).
 */
export function CategoryRails({ products }: { products: ReportProduct[] }) {
  const bySlug = new Map(products.map((product) => [product.slug, product]));

  const rails = RAILS.map((rail) => {
    const picked: ReportProduct[] = [];
    const take = (item: ReportProduct | undefined) => {
      if (item && !picked.some((chosen) => chosen.slug === item.slug)) picked.push(item);
    };

    for (const slug of rail.slugs) take(bySlug.get(slug));
    // 기획된 상품이 지워졌거나 아직 없을 때. 줄이 한 장만 남는 것을 막는다
    if (picked.length < MIN_PER_RAIL) {
      for (const item of products.filter((product) => product.category === rail.id)) take(item);
    }
    if (picked.length < MIN_PER_RAIL) {
      for (const item of products) take(item);
    }
    return { ...rail, items: picked };
  }).filter((rail) => rail.items.length > 0);

  return (
    <div className="flex flex-col gap-space-xl">
      {[
        ...rails,
        ...(products.length > 0
          ? [{ id: "all" as const, heading: "모든 풀이", caption: `${products.length}개 전부`, items: products }]
          : []),
      ].map((rail) => (
        <section key={rail.id} id={`rail-${rail.id}`} className="flex scroll-mt-16 flex-col gap-space-sm">
          <div className="flex items-baseline gap-space-sm px-space-xs">
            <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">{rail.heading}</h3>
            {rail.caption && <span className="font-label-sm text-label-sm text-outline">{rail.caption}</span>}
          </div>

          <ol className="no-scrollbar -mx-margin flex snap-x gap-space-sm overflow-x-auto px-margin pb-1">
            {rail.items.map((report) => (
              <li key={report.slug} className="w-[58vw] max-w-[15rem] shrink-0 snap-start">
                <RailCard report={report} />
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

function RailCard({ report }: { report: ReportProduct }) {
  // 화면에 들어온 카드만 재생한다 (useInView 가 그 이유를 적어 두었다)
  const { ref, inView } = useInView<HTMLAnchorElement>();
  const poster = getPoster(report.slug, report.guide);
  const pitch = getPitch(report.slug);
  const font = productFont(report.slug);

  return (
    <Link
      ref={ref}
      href={`/reports/${report.slug}`}
      className="group flex h-full flex-col gap-space-xs transition-transform active:scale-[0.98]"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-surface-container shadow-xl">
        {poster ? (
          <WebtoonMedia asset={poster} active={inView} className="absolute inset-0" />
        ) : (
          <div
            role="img"
            aria-label=""
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${STITCH_ASSETS[report.cover]}')` }}
          />
        )}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-surface-container-lowest/95 via-surface-container-lowest/45 to-transparent" />

        {report.discountLabel && (
          <span className="absolute left-space-sm top-space-sm rounded bg-secondary px-1.5 py-0.5 font-label-sm text-label-sm font-bold text-on-secondary">
            {report.discountLabel}
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-0.5 px-space-sm pb-space-sm text-center">
          <span
            className="text-[1.7rem] leading-tight text-on-surface [text-shadow:0_2px_12px_rgb(0_0_0/0.95)]"
            style={font ? { fontFamily: font } : undefined}
          >
            {report.title}
          </span>
        </div>
      </div>

      <span className="line-clamp-2 px-0.5 font-body-md text-body-md leading-snug text-on-surface-variant">
        {report.tagline}
      </span>
      {pitch && (
        <span className="flex items-start gap-1 px-0.5 font-label-sm text-label-sm leading-snug text-tertiary">
          <Icon name="check_small" className="mt-[-1px] shrink-0 text-[16px]" />
          <span className="line-clamp-2">{pitch.claims[0]}</span>
        </span>
      )}
      <span className="mt-auto flex items-baseline gap-1.5 px-0.5 pt-0.5">
        {report.originalPrice && (
          <span className="font-label-sm text-label-sm text-outline line-through">{formatKRW(report.originalPrice)}</span>
        )}
        <span className="font-label-md text-label-md text-on-surface">{formatKRW(report.price)}</span>
        <Icon
          name="chevron_right"
          className="ml-auto text-[16px] text-outline transition-transform duration-200 group-hover:translate-x-0.5"
        />
      </span>
    </Link>
  );
}
