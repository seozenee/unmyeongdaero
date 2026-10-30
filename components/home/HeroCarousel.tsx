"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { STITCH_ASSETS } from "@/components/home/assets";
import { getPoster } from "@/components/home/posters";
import { WebtoonMedia } from "@/components/webtoon/WebtoonMedia";
import { cn } from "@/lib/cn";
import type { ReportProduct } from "@/lib/reports/catalog";
import { productFont } from "@/lib/reports/fonts";

/** 첫 화면에 크게 세울 상품. 순서가 곧 노출 순위다. */
const FEATURED = ["destiny-full", "reunion-deep", "child-admission", "compatibility", "business"] as const;

/** 손을 대지 않으면 이만큼마다 다음 장으로 */
const AUTO_ADVANCE_MS = 5200;

interface HeroCarouselProps {
  products: ReportProduct[];
}

/**
 * 첫 화면의 포스터 카드.
 *
 * 작은 카드를 바둑판으로 깔면 한 번에 많이 보이지만 어느 것도 눈에 걸리지 않는다.
 * 화면을 채우는 포스터 한 장이 손을 멈추게 한다. 안내자의 얼굴이 앞에 나오고,
 * 간판은 상품마다 다른 서체로 찍어 카드들이 한 묶음으로 뭉개지지 않게 한다.
 *
 * 저절로 넘어가되, 손을 대면 멈춘다 — 읽는 중에 화면이 바뀌는 것만큼 성가신 게 없다.
 * prefers-reduced-motion 을 켠 사람에게는 처음부터 넘기지 않는다.
 */
export function HeroCarousel({ products }: HeroCarouselProps) {
  const bySlug = new Map(products.map((product) => [product.slug, product]));
  const items = FEATURED.map((slug) => bySlug.get(slug)).filter((item): item is ReportProduct => Boolean(item));

  const scroller = useRef<HTMLOListElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // 스크롤 위치에서 지금 보이는 장을 읽는다 (손으로 넘겼을 때도 점이 따라온다)
  const onScroll = useCallback(() => {
    const node = scroller.current;
    if (!node) return;
    const card = node.firstElementChild as HTMLElement | null;
    if (!card) return;
    const step = card.offsetWidth + 12;
    setIndex(Math.round(node.scrollLeft / step));
  }, []);

  useEffect(() => {
    const node = scroller.current;
    if (!node || items.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (paused) return;

    const timer = window.setInterval(() => {
      const card = node.firstElementChild as HTMLElement | null;
      if (!card) return;
      const step = card.offsetWidth + 12;
      const next = Math.round(node.scrollLeft / step) + 1;
      node.scrollTo({ left: next >= items.length ? 0 : next * step, behavior: "smooth" });
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(timer);
  }, [items.length, paused]);

  if (items.length === 0) return null;

  return (
    <section className="-mx-margin mt-space-sm" aria-label="지금 가장 많이 보는 풀이">
      <ol
        ref={scroller}
        onScroll={onScroll}
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        className="no-scrollbar flex snap-x snap-mandatory gap-space-sm overflow-x-auto px-margin pb-space-xs"
      >
        {items.map((report, position) => {
          const poster = getPoster(report.slug, report.guide);
          const font = productFont(report.slug);
          return (
            <li key={report.slug} className="w-[78vw] max-w-[20rem] shrink-0 snap-center">
              <Link
                href={`/reports/${report.slug}`}
                className="group relative flex aspect-[3/4.3] flex-col justify-end overflow-hidden rounded-[1.75rem] bg-surface-container shadow-2xl transition-transform active:scale-[0.98]"
              >
                {poster ? (
                  <WebtoonMedia asset={poster} active={position === index} className="absolute inset-0" />
                ) : (
                  <div
                    role="img"
                    aria-label=""
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url('${STITCH_ASSETS[report.cover]}')` }}
                  />
                )}
                {/* 그림을 최대한 살린다 — 글자가 앉는 아래쪽만 덮는다 */}
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-surface-container-lowest/95 via-surface-container-lowest/55 to-transparent" />

                {/*
                  순위.
                  빨간 리본을 깃발처럼 꽂아 두었다. 카드마다 그 색이 제일 먼저 눈에
                  걸려서, 정작 보여 주려던 그림보다 리본을 먼저 보게 됐다. 순위는
                  알려 주면 되는 것이지 외칠 것이 아니다. 유리알 같은 알약 하나로 줄인다.
                */}
                <span
                  className={cn(
                    "absolute right-space-md top-space-md rounded-full px-2.5 py-1 font-label-sm text-label-sm leading-none backdrop-blur-md",
                    position === 0
                      ? "bg-white/90 text-black"
                      : "bg-black/35 text-white ring-1 ring-inset ring-white/20",
                  )}
                >
                  {position + 1}위
                </span>

                {/* 간판과 한 줄. 값과 버튼은 두지 않는다 — 카드는 보여 주는 자리고,
                    사는 자리는 들어가서다. */}
                <div className="relative flex flex-col items-center gap-space-xs px-space-lg pb-space-xl text-center">
                  <span className="rounded-full bg-secondary px-3 py-1 font-label-sm text-label-sm text-on-secondary">
                    {report.categoryLabel}
                  </span>
                  {/*
                    한동안 제목에 브랜드 색 번짐을 얹었다. 켜 놓은 간판처럼 보이게 하려던
                    것인데, 카드마다 글자가 빛나니 화면이 쉬는 자리 없이 시끄러웠다.
                    번짐은 걷어내고 검은 그림자만 남긴다 — 그림 위에서 읽히기만 하면 된다.
                    눈길은 빛이 아니라 크기와 여백으로 끈다.
                  */}
                  <span
                    className="text-[3rem] leading-[1.06] tracking-tight text-white [text-shadow:0_1px_20px_rgb(0_0_0/0.65)]"
                    style={font ? { fontFamily: font } : undefined}
                  >
                    {report.title}
                  </span>
                  <span className="font-body-md text-body-md font-semibold leading-snug text-on-surface [text-shadow:0_1px_8px_rgb(0_0_0/0.95)]">
                    {report.tagline}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>

      {/* 어디쯤 보고 있는지 */}
      <div className="mt-space-xs flex justify-center gap-1.5" aria-hidden>
        {items.map((report, position) => (
          <span
            key={report.slug}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              position === index ? "w-5 bg-on-surface" : "w-1.5 bg-outline-variant",
            )}
          />
        ))}
      </div>
    </section>
  );
}
