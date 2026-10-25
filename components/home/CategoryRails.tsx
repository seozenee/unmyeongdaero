"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { STITCH_ASSETS } from "@/components/home/assets";
import { getPoster } from "@/components/home/posters";
import { Icon } from "@/components/ui/Icon";
import { WebtoonMedia } from "@/components/webtoon/WebtoonMedia";
import { formatKRW } from "@/lib/format";
import type { ReportCategory, ReportProduct } from "@/lib/reports/catalog";
import { productFont } from "@/lib/reports/fonts";

/**
 * 묶음의 제목은 분류명이 아니라 손님의 말이어야 한다.
 * "재회" 보다 "다시 만날 수 있을까" 가 먼저 읽힌다.
 */
const RAILS: ReadonlyArray<{ id: ReportCategory | "child"; heading: string; caption: string }> = [
  { id: "child", heading: "우리 아이는 어떤 아이일까", caption: "입시·공부·진로·재능" },
  { id: "reunion", heading: "다시 만날 수 있을까", caption: "그 사람의 마음과 연락의 때" },
  { id: "romance", heading: "내 연애는 언제 시작될까", caption: "타고난 연애의 결" },
  { id: "chemistry", heading: "우리 둘은 잘 맞을까", caption: "부딪히는 자리와 닿는 말" },
  { id: "destiny", heading: "내 인생, 지금 어디쯤일까", caption: "타고난 결과 큰 흐름" },
  { id: "work", heading: "돈도 일도, 내 길을 찾고 싶을 때", caption: "적성·사업·움직일 때" },
  { id: "wealth", heading: "돈이 어디로 들어오고 나가는가", caption: "재물의 길목" },
  { id: "year", heading: "다가오는 한 해가 궁금할 때", caption: "달마다의 흐름" },
  { id: "study", heading: "공부가 붙는 때를 알고 싶을 때", caption: "내게 맞는 공부법" },
];

/**
 * 카테고리별 가로 줄.
 *
 * 한 줄에 하나씩 세로로 쌓으면 열일곱 개를 다 보려고 스무 번을 밀어야 한다.
 * 용용사주처럼 주제별로 가로 줄을 만들면, 세로로는 주제만 훑고 관심 있는 줄에서만
 * 옆으로 민다. 찾는 사람에게도 구경하는 사람에게도 길이 생긴다.
 *
 * 카드는 영상이다. 다만 열일곱 장을 한꺼번에 틀면 브라우저가 디코더를 아끼려고
 * 제멋대로 멈춰 세우므로, 화면에 들어온 카드만 재생한다.
 */
export function CategoryRails({ products }: { products: ReportProduct[] }) {
  const rails = RAILS.map((rail) => ({
    ...rail,
    items: products.filter((product) => product.category === rail.id),
  })).filter((rail) => rail.items.length > 0);

  // 분류가 어느 줄에도 들지 않은 상품은 빠뜨리지 않고 마지막에 모은다
  const shown = new Set(rails.flatMap((rail) => rail.items.map((item) => item.slug)));
  const rest = products.filter((product) => !shown.has(product.slug));

  return (
    <div className="flex flex-col gap-space-xl">
      {[...rails, ...(rest.length > 0 ? [{ id: "rest", heading: "그 밖의 풀이", caption: "", items: rest }] : [])].map(
        (rail) => (
          <section key={rail.id} className="flex flex-col gap-space-sm">
            <div className="flex items-baseline gap-space-sm px-space-xs">
              <h3 className="font-headline-md text-headline-md text-on-surface">{rail.heading}</h3>
              {rail.caption && <span className="font-label-sm text-label-sm text-outline">{rail.caption}</span>}
            </div>

            <ol className="no-scrollbar -mx-margin flex snap-x gap-space-sm overflow-x-auto px-margin pb-1">
              {rail.items.map((report) => (
                <li key={report.slug} className="w-[46vw] max-w-[11.5rem] shrink-0 snap-start">
                  <RailCard report={report} />
                </li>
              ))}
            </ol>
          </section>
        ),
      )}
    </div>
  );
}

function RailCard({ report }: { report: ReportProduct }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [visible, setVisible] = useState(false);
  const poster = getPoster(report.slug, report.guide);
  const font = productFont(report.slug);

  // 화면에 들어온 카드만 재생한다. 들어오고 나가는 것을 계속 따라가야 하므로
  // 한 번 보고 끊지 않는다.
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => setVisible(Boolean(entry?.isIntersecting)), {
      threshold: 0.35,
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Link
      ref={ref}
      href={`/reports/${report.slug}`}
      className="group flex flex-col gap-space-xs transition-transform active:scale-[0.98]"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-on-surface/10 bg-surface-container shadow-lg">
        {poster ? (
          <WebtoonMedia asset={poster} active={visible} className="absolute inset-0" />
        ) : (
          <div
            role="img"
            aria-label=""
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${STITCH_ASSETS[report.cover]}')` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/25 to-transparent" />

        {report.discountLabel && (
          <span className="absolute left-space-sm top-space-sm rounded bg-secondary px-1.5 py-0.5 font-label-sm text-label-sm font-bold text-on-secondary">
            {report.discountLabel}
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-0.5 px-space-sm pb-space-sm text-center">
          <span
            className="text-[1.15rem] leading-tight text-on-surface [text-shadow:0_0_12px_rgb(0_0_0/0.9)]"
            style={font ? { fontFamily: font } : undefined}
          >
            {report.title}
          </span>
        </div>
      </div>

      <span className="line-clamp-2 px-0.5 font-body-sm text-body-sm leading-snug text-on-surface-variant">
        {report.tagline}
      </span>
      <span className="flex items-baseline gap-1.5 px-0.5">
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
