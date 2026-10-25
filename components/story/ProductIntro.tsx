"use client";

import { useEffect, useRef, useState } from "react";
import { STITCH_ASSETS } from "@/components/home/assets";
import { getPoster } from "@/components/home/posters";
import { GuideAvatar } from "@/components/story/GuideAvatar";
import { Icon } from "@/components/ui/Icon";
import { WebtoonMedia } from "@/components/webtoon/WebtoonMedia";
import { cn } from "@/lib/cn";
import { formatKRW } from "@/lib/format";
import type { ReportProduct } from "@/lib/reports/catalog";
import { productFont } from "@/lib/reports/fonts";
import { getPitch } from "@/lib/reports/pitch";
import { getGuide } from "@/lib/story/guides";
import { josa } from "@/lib/text/josa";

interface ProductIntroProps {
  report: ReportProduct;
  /** 이 상품을 이미 몇 사람이 받아 갔는지. 모르면 숨긴다 — 숫자를 지어내지 않는다 */
  soldCount?: number | null;
  onStart: () => void;
  resuming?: boolean;
}

/** 스크롤해서 들어올 때 한 번 떠오르는 블록 */
function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: "-12% 0px" },
    );
    observer.observe(node);

    // 관찰자가 돌지 않는 자리가 있다. 배경 탭처럼 화면을 그리지 않는 상태가 그렇고,
    // 미리보기·썸네일 캡처도 그렇다. 등장 연출 하나 때문에 본문이 통째로 사라지면
    // 그건 연출이 아니라 고장이다. 일정 시간이 지나면 무조건 보여 준다.
    const fallback = window.setTimeout(() => setShown(true), 1200);
    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <div
      ref={ref}
      style={shown ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(
        "transition-all duration-700 ease-out",
        shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * 상품 상세 화면.
 *
 * 카드를 누르면 곧바로 생년월일을 묻던 자리다. 무엇을 사는지 보여 주고 나서 묻는다.
 *
 * 맨 위는 이 상품만의 포스터가 화면을 채우고, 그 위에 한자 한 글자가 크게 깔린다.
 * 그 아래로는 이 풀이가 실제로 내놓는 것 셋, 하지 않는 것 한 줄, 받는 것 셋, 목차.
 * 값과 시작 버튼은 아래에 붙어 어디까지 읽든 손이 닿는다.
 */
export function ProductIntro({ report, soldCount, onStart, resuming = false }: ProductIntroProps) {
  const guide = getGuide(report.guide);
  const pitch = getPitch(report.slug);
  const poster = getPoster(report.slug, report.guide);
  const font = productFont(report.slug);

  return (
    <div className="flex w-full flex-col pb-[calc(7rem+env(safe-area-inset-bottom,0px))]">
      {/* ─ 히어로 — 이 상품만의 포스터 ─ */}
      <header className="relative -mx-margin flex min-h-[78svh] flex-col justify-end overflow-hidden">
        {poster ? (
          <WebtoonMedia asset={poster} className="absolute inset-0" />
        ) : (
          <div
            role="img"
            aria-label=""
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${STITCH_ASSETS[report.cover]}')` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/45 to-surface/20" />

        {/* 한자 한 글자 — 글씨가 아니라 무늬로 읽히게 아주 옅게 */}
        {pitch && (
          <span
            aria-hidden
            className="pointer-events-none absolute right-[-0.08em] top-[6%] select-none text-[9rem] leading-none text-on-surface/[0.07]"
            style={{ fontFamily: "'Song Myung', serif" }}
          >
            {pitch.hanja}
          </span>
        )}

        <div className="relative flex flex-col items-center gap-space-sm px-margin pb-space-xl text-center">
          <span className="rounded-full bg-secondary px-3 py-1 font-label-sm text-label-sm text-on-secondary">
            {report.categoryLabel}
          </span>
          <p className="font-body-sm text-body-sm text-on-surface-variant [text-shadow:0_1px_8px_rgb(0_0_0/0.9)]">
            {report.tagline}
          </p>
          <h1
            className="text-[2.6rem] leading-[1.1] text-on-surface [text-shadow:0_0_24px_rgb(0_0_0/0.9),0_2px_6px_rgb(0_0_0/0.85)]"
            style={font ? { fontFamily: font } : undefined}
          >
            {report.title}
          </h1>
          <span className="mt-space-xs flex items-center gap-1.5 font-label-sm text-label-sm text-outline">
            <Icon name="south" className="animate-bounce text-[16px]" />
            아래로 밀어 보세요
          </span>
        </div>
      </header>

      {pitch && (
        <>
          {/* ─ 이 풀이가 내놓는 것 셋 ─ */}
          <section className="flex flex-col gap-space-lg pt-space-xl">
            {pitch.claims.map((claim, index) => (
              <Reveal key={claim} delay={index * 90}>
                <div className="flex gap-space-md">
                  <span className="font-headline-md text-headline-md leading-none text-tertiary/60">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="flex-1 font-headline-sm text-headline-sm leading-snug text-on-surface">{claim}</p>
                </div>
              </Reveal>
            ))}
          </section>

          {/* ─ 하지 않는 것까지 밝히는 한 줄 ─ */}
          <Reveal className="mt-space-xl">
            <blockquote className="flex flex-col gap-space-sm rounded-2xl bg-surface-container p-space-lg">
              <Icon name="format_quote" className="text-[20px] text-tertiary" />
              <p className="font-body-lg text-body-lg leading-relaxed text-on-surface">{pitch.promise}</p>
              <div className="mt-space-xs flex items-center gap-space-sm">
                <GuideAvatar guide={guide} size="sm" />
                <span className="font-label-sm text-label-sm text-on-surface-variant">— {guide.title}</span>
              </div>
            </blockquote>
          </Reveal>

          {/* ─ 받는 것 ─ */}
          <section className="mt-space-xl flex flex-col gap-space-md">
            <Reveal>
              <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">이런 걸 받아요</h2>
            </Reveal>
            {pitch.gets.map((item, index) => (
              <Reveal key={item.title} delay={index * 80}>
                <div className="flex flex-col gap-1 rounded-2xl bg-surface-container p-space-lg">
                  <span className="font-label-sm text-label-sm tracking-widest text-tertiary">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="font-headline-sm text-headline-sm text-on-surface">{item.title}</span>
                  <span className="font-body-md text-body-md leading-relaxed text-on-surface-variant">{item.body}</span>
                </div>
              </Reveal>
            ))}
          </section>
        </>
      )}

      {/* ─ 목차 ─ */}
      <Reveal className="mt-space-xl">
        <section className="flex flex-col gap-space-sm rounded-2xl bg-surface-container-low p-space-lg">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">보고서 목차</h2>
          <ol className="flex flex-col gap-space-sm">
            {report.chapters.map((chapter, index) => (
              <li key={chapter} className="flex gap-space-sm">
                <span className="w-6 shrink-0 font-label-md text-label-md text-tertiary">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="font-body-md text-body-md leading-snug text-on-surface">{chapter}</span>
              </li>
            ))}
          </ol>
          <p className="mt-space-xs border-t border-outline-variant/40 pt-space-sm font-body-sm text-body-sm text-on-surface-variant">
            ＋ 흐름 시기표 · 해 보면 좋은 것 / 피하면 좋은 것 · 문장마다 붙는 명리 근거
          </p>
        </section>
      </Reveal>

      {/* ─ 어떻게 쓰는지 ─ */}
      <Reveal className="mt-space-lg">
        <ul className="flex flex-col gap-space-sm rounded-2xl bg-surface-container p-space-lg">
          {[
            { icon: "calendar_month", text: "생년월일시로 만세력을 직접 계산해요. 절기와 진태양시까지 맞춰서요." },
            { icon: "fact_check", text: "모든 문장에 근거가 붙어요. 어느 글자에서 나온 말인지 함께 보여 드려요." },
            { icon: "lock_open", text: "한 번 사면 계속 볼 수 있어요. 구독 결제가 아니에요." },
          ].map((item) => (
            <li key={item.icon} className="flex gap-space-sm">
              <Icon name={item.icon} className="mt-0.5 shrink-0 text-[18px] text-tertiary" />
              <span className="font-body-sm text-body-sm leading-relaxed text-on-surface-variant">{item.text}</span>
            </li>
          ))}
        </ul>
      </Reveal>

      {report.disclaimer && (
        <p className="mt-space-lg font-body-sm text-body-sm leading-relaxed text-outline">{report.disclaimer}</p>
      )}

      {/* ─ 값과 시작 ─ */}
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] z-30 mx-auto w-full max-w-md border-t border-outline-variant/40 bg-surface/95 px-margin py-space-sm backdrop-blur">
        {soldCount != null && soldCount > 0 && (
          <p className="mb-1 text-center font-label-sm text-label-sm text-tertiary">
            지금까지 {soldCount.toLocaleString("ko-KR")}명이 이 풀이를 받아 갔어요
          </p>
        )}
        <div className="flex items-center gap-space-md">
          <div className="flex min-w-0 flex-col">
            <span className="flex items-baseline gap-1.5">
              {report.originalPrice && (
                <span className="font-label-sm text-label-sm text-outline line-through">
                  {formatKRW(report.originalPrice)}
                </span>
              )}
              {report.discountLabel && (
                <span className="rounded bg-secondary px-1.5 py-0.5 font-label-sm text-label-sm font-bold text-on-secondary">
                  {report.discountLabel}
                </span>
              )}
            </span>
            <span className="font-price-display text-price-display text-on-surface">{formatKRW(report.price)}</span>
          </div>
          <button
            type="button"
            onClick={onStart}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-on-surface py-3.5 font-label-md text-label-md text-surface shadow-lg transition-transform active:scale-[0.98]"
          >
            <Icon name="play_arrow" className="text-[18px]" />
            {resuming ? "이어서 보기" : `${josa(guide.name, "을/를")} 만나러 가기`}
          </button>
        </div>
        <p className="mt-1 text-center font-label-sm text-label-sm text-outline">대화 입력은 무료 · 결제는 마지막에</p>
      </div>
    </div>
  );
}
