"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { STITCH_ASSETS } from "@/components/home/assets";
import { FaqSection } from "@/components/home/FaqSection";
import { getPoster } from "@/components/home/posters";
import { useInView } from "@/components/home/useInView";
import { GuideAvatar } from "@/components/story/GuideAvatar";
import { Icon } from "@/components/ui/Icon";
import { getWebtoonAsset } from "@/components/webtoon/assets";
import { WebtoonMedia } from "@/components/webtoon/WebtoonMedia";
import { cn } from "@/lib/cn";
import { productAccent } from "@/lib/reports/accents";
import type { ReportProduct } from "@/lib/reports/catalog";
import { productFont } from "@/lib/reports/fonts";
import { getPitch } from "@/lib/reports/pitch";
import { getGuide } from "@/lib/story/guides";
import { josa } from "@/lib/text/josa";

interface ProductIntroProps {
  report: ReportProduct;
  /** 이 상품을 이미 몇 사람이 받아 갔는지. 모르면 숨긴다 — 숫자를 지어내지 않는다 */
  soldCount?: number | null;
  /** 같은 고민을 보던 사람이 함께 보는 다른 풀이 */
  related?: ReportProduct[];
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

/** 화면에 들어오면 재생하는 한 컷 */
function SceneCut({ guide, cut, className }: { guide: ReportProduct["guide"]; cut: string; className?: string }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const asset = getWebtoonAsset(guide, cut);
  if (!asset) return null;

  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)}>
      <WebtoonMedia asset={asset} active={inView} className="absolute inset-0" />
    </div>
  );
}

/** "이런 걸 받아요" 카드에 얹는 장면. 안내자가 실제로 하는 동작 순서대로 */
const GET_CUTS = ["panel-brush", "panel-second", "panel-unfold"] as const;

/** 섹션 머리. 작은 라틴 라벨 + 큰 한글 한 줄 */
function SectionHead({ label, title }: { label: string; title: string }) {
  return (
    <div className="flex flex-col gap-0.5 px-space-xs">
      <span className="font-label-sm text-label-sm font-bold tracking-[0.2em] text-[rgb(var(--accent))]">{label}</span>
      <h2 className="font-headline-lg-mobile text-headline-lg-mobile leading-tight text-on-surface">{title}</h2>
    </div>
  );
}

/**
 * 상품 상세 화면.
 *
 * 카드를 누르면 곧바로 생년월일을 묻던 자리다. 무엇을 사는지 보여 주고 나서 묻는다.
 *
 * 한동안 이 화면은 "회색 둥근 카드를 세로로 쌓은 문서" 였다. 간격도 모서리도 글자 크기도
 * 전부 같아서, 내용이 달라도 같은 틀로 읽혔다. 자동으로 찍어 낸 화면처럼 보이는 이유가
 * 그것이다 — 어디에도 눈이 멈추는 자리가 없다.
 *
 * 그래서 리듬을 넣는다. 꽉 찬 포스터 → 흐르는 띠 → 번호가 큰 단언 → 안내자의 말풍선 →
 * 미는 장면 카드 → 영수증처럼 끊어 둔 목차. 크기와 모양이 번갈아 바뀌면 손이 멈추는
 * 자리가 생긴다. 묶음은 모두 옆으로 미는 줄이다.
 *
 * 값과 시작 버튼은 아래에 붙어 어디까지 읽든 손이 닿는다.
 */
export function ProductIntro({ report, soldCount, related = [], onStart, resuming = false }: ProductIntroProps) {
  const guide = getGuide(report.guide);
  const pitch = getPitch(report.slug);
  const poster = getPoster(report.slug, report.guide);
  const font = productFont(report.slug);
  const others = related.filter((item) => item.slug !== report.slug).slice(0, 8);
  // 해시태그. 장 제목을 붙여 쓰면 "#두사람이어디서부터엇갈렸나" 처럼 읽을 수 없는 말이
  // 되므로, 짧고 사실인 것만 건다 — 분류·안내자·분량·결제 조건.
  const chips = [
    report.categoryLabel.replace(/\s+/g, ""),
    guide.name,
    `${report.chapters.length}장`,
    "12개월열람",
    "단건결제",
    // 할인율은 값 이야기다. 여기는 "이게 나한테 맞는가"를 재는 자리라 값을 끌어오지 않는다
    "명식까지무료",
  ];
  // 흐르는 띠는 목차 그대로. 띠에서는 띄어쓰기가 살아 있어 길어도 읽힌다
  const marquee = [...report.chapters, ...report.chapters];

  return (
    <div
      // 이 상품의 색. 아래쪽 블록들이 모두 이 한 값을 섞어 쓴다
      style={{ "--accent": productAccent(report.slug) } as React.CSSProperties}
      className="relative flex w-full flex-col pb-[calc(7rem+env(safe-area-inset-bottom,0px))]"
    >
      {/* 포스터 아래로 이어지는 빛. 그림의 색이 화면으로 번져 내려온다 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-[-1rem] top-0 h-[120svh] bg-[radial-gradient(70%_40%_at_50%_18%,rgb(var(--accent)/0.28),transparent_72%)]"
      />

      {/* ─ 히어로 — 이 상품만의 포스터 ─ */}
      <header className="relative -mx-margin flex min-h-[86svh] flex-col justify-end overflow-hidden">
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
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-surface/10" />
        {/* 아래 끝을 상품 색으로 물들여 본문과 이어 붙인다 */}
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-[linear-gradient(to_top,rgb(var(--accent)/0.38),transparent)]" />

        {/* 한자 한 글자 — 글씨가 아니라 무늬로 읽히게 아주 옅게 */}
        {pitch && (
          <span
            aria-hidden
            className="pointer-events-none absolute right-[-0.08em] top-[5%] select-none text-[9rem] leading-none text-on-surface/[0.07]"
            style={{ fontFamily: "'Song Myung', serif" }}
          >
            {pitch.hanja}
          </span>
        )}

        {/*
          전에는 여기 할인율 스티커가 비뚜로 붙어 있었다. 눈에 가장 먼저 걸리는 자리에
          값 이야기를 둔 셈이다. 값은 명식을 다 보여 준 뒤 결제 직전에 한 번만 꺼낸다.
        */}
        <span className="absolute right-space-md top-space-xl -rotate-[8deg] rounded-xl bg-secondary px-3 py-1.5 font-label-md text-label-md font-bold text-on-secondary shadow-xl">
          여덟 글자까지 무료
        </span>

        {/* 아래 버튼 막대(약 9rem)에 해시태그가 가려지지 않게 그만큼 띄운다 */}
        <div className="relative flex flex-col gap-space-sm px-margin pb-[9.5rem]">
          <span className="flex items-center gap-1.5">
            <GuideAvatar guide={guide} size="sm" />
            <span className="font-label-sm text-label-sm text-on-surface/80 [text-shadow:0_1px_8px_rgb(0_0_0/0.9)]">
              {josa(guide.title, "이/가")} 써 드려요
            </span>
          </span>

          <h1
            className="text-[3.1rem] leading-[0.98] tracking-tight text-on-surface [text-shadow:0_0_28px_rgb(0_0_0/0.9),0_2px_6px_rgb(0_0_0/0.9)]"
            style={font ? { fontFamily: font } : undefined}
          >
            {report.title}
          </h1>
          <p className="max-w-[22rem] font-headline-sm text-headline-sm leading-snug text-on-surface/90 [text-shadow:0_1px_10px_rgb(0_0_0/0.95)]">
            {report.tagline}
          </p>

          {/* 해시태그 — 이 풀이가 실제로 다루는 장 제목 */}
          <ul className="no-scrollbar -mx-margin mt-space-xs flex gap-1.5 overflow-x-auto px-margin">
            {chips.map((chip) => (
              <li
                key={chip}
                className="shrink-0 rounded-full border border-[rgb(var(--accent)/0.55)] bg-[rgb(var(--accent)/0.18)] px-2.5 py-1 font-label-sm text-label-sm text-on-surface backdrop-blur"
              >
                #{chip.replace(/\s+/g, "")}
              </li>
            ))}
          </ul>

          <span className="mt-space-sm flex items-center gap-1.5 self-start rounded-full bg-surface-container-lowest/60 px-3 py-1 font-label-sm text-label-sm text-on-surface/80 backdrop-blur">
            <Icon name="south" className="animate-bounce text-[15px]" />
            아래로 밀어 보세요
          </span>
        </div>
      </header>

      {/* ─ 흐르는 띠 — 목차가 지나간다 ─ */}
      <div
        aria-hidden
        className="relative -mx-margin mt-0 overflow-hidden border-y border-[rgb(var(--accent)/0.35)] bg-[rgb(var(--accent)/0.14)] py-2"
      >
        <div className="flex w-max motion-safe:animate-marquee">
          {marquee.map((chapter, index) => (
            <span
              key={`${chapter}-${index}`}
              className="flex items-center gap-space-sm px-space-sm font-label-sm text-label-sm tracking-wide text-on-surface/85"
            >
              {chapter}
              <span className="text-[rgb(var(--accent))]">◆</span>
            </span>
          ))}
        </div>
      </div>

      {pitch && (
        <>
          {/* ─ 이 풀이가 내놓는 것 셋 — 번호를 크게, 좌우를 번갈아 ─ */}
          <section className="flex flex-col gap-space-md pt-space-xl">
            {pitch.claims.map((claim, index) => (
              <Reveal key={claim} delay={index * 90}>
                <div className={cn("flex items-start gap-space-sm", index % 2 === 1 && "flex-row-reverse text-right")}>
                  <span
                    aria-hidden
                    className="text-[3.4rem] font-bold leading-[0.78] tabular-nums text-[rgb(var(--accent)/0.55)]"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="flex-1 pt-1 font-headline-md text-headline-md leading-snug tracking-tight text-on-surface">
                    {claim}
                  </p>
                </div>
              </Reveal>
            ))}
          </section>

          {/* ─ 하지 않는 것까지 밝히는 한 줄 — 안내자의 말풍선으로 ─ */}
          <Reveal className="mt-space-xl">
            <div className="flex items-end gap-space-sm">
              <GuideAvatar guide={guide} size="md" />
              <div className="flex-1">
                <p className="rounded-3xl rounded-bl-md bg-surface-container-highest px-space-lg py-space-md font-body-lg text-body-lg leading-relaxed text-on-surface">
                  {pitch.promise}
                </p>
                <span className="mt-1 block px-space-sm font-label-sm text-label-sm text-outline">
                  — {guide.title}
                </span>
              </div>
            </div>
          </Reveal>

          {/* ─ 받는 것 — 미는 줄 ─ */}
          <section className="mt-space-xl flex flex-col gap-space-sm">
            <SectionHead label="WHAT YOU GET" title="이런 걸 받아요" />
            <ol className="no-scrollbar -mx-margin flex snap-x gap-space-sm overflow-x-auto px-margin pb-1">
              {pitch.gets.map((item, index) => (
                <li key={item.title} className="w-[74vw] max-w-[18rem] shrink-0 snap-start">
                  <div className="flex h-full flex-col overflow-hidden rounded-3xl bg-surface-container ring-1 ring-[rgb(var(--accent)/0.25)]">
                    <SceneCut
                      guide={report.guide}
                      cut={GET_CUTS[index % GET_CUTS.length]!}
                      className="aspect-[16/10] w-full"
                    />
                    <div className="flex flex-1 flex-col gap-1 p-space-lg">
                      <span className="font-label-sm text-label-sm font-bold tracking-[0.2em] text-[rgb(var(--accent))]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="font-headline-sm text-headline-sm leading-tight text-on-surface">
                        {item.title}
                      </span>
                      <span className="font-body-md text-body-md leading-relaxed text-on-surface-variant">
                        {item.body}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </>
      )}

      {/* ─ 목차 — 영수증처럼 끊어 둔다 ─ */}
      <Reveal className="mt-space-xl">
        <section className="relative overflow-hidden rounded-3xl border border-dashed border-[rgb(var(--accent)/0.45)] bg-surface-container-lowest p-space-lg">
          <div className="flex items-baseline justify-between">
            <span className="font-label-sm text-label-sm font-bold tracking-[0.2em] text-[rgb(var(--accent))]">CONTENTS</span>
            <span className="font-label-sm text-label-sm text-outline">{report.chapters.length}장</span>
          </div>
          <ol className="mt-space-sm flex flex-col">
            {report.chapters.map((chapter, index) => (
              <li
                key={chapter}
                className="flex items-baseline gap-space-sm border-b border-dashed border-outline-variant/40 py-space-sm last:border-0"
              >
                <span className="w-7 shrink-0 font-label-md text-label-md tabular-nums text-[rgb(var(--accent))]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 font-body-md text-body-md leading-snug text-on-surface">{chapter}</span>
              </li>
            ))}
          </ol>
          <p className="mt-space-sm border-t border-outline-variant/50 pt-space-sm font-body-sm text-body-sm text-on-surface-variant">
            ＋ 흐름 시기표 · 해 보면 좋은 것 / 피하면 좋은 것 · 문장마다 붙는 명리 근거
          </p>
        </section>
      </Reveal>

      {/* ─ 펼치면 어떻게 나오는지. 글은 가리고 모양만 보여 준다 ─ */}
      <Reveal className="mt-space-lg">
        <section className="relative overflow-hidden rounded-3xl bg-surface-container-lowest p-space-lg ring-1 ring-outline-variant/40">
          <span className="font-label-sm text-label-sm font-bold tracking-[0.2em] text-[rgb(var(--accent))]">PREVIEW</span>
          <h2 className="mt-0.5 font-headline-lg-mobile text-headline-lg-mobile text-on-surface">펼치면 이렇게 나와요</h2>

          <div className="mt-space-md flex flex-col gap-space-lg pb-space-xl">
            {report.chapters.slice(0, 2).map((chapter, index) => (
              <div key={chapter} className="flex flex-col gap-space-sm">
                <span className="font-headline-sm text-headline-sm leading-snug text-on-surface">
                  <span className="mr-1.5 text-[rgb(var(--accent))]">{String(index + 1).padStart(2, "0")}</span>
                  {chapter}
                </span>
                <div className="flex flex-col gap-2">
                  {[100, 94, 98, 72].map((width) => (
                    <span
                      key={width}
                      className="h-2.5 rounded-full bg-on-surface/10 motion-safe:animate-pulse"
                      style={{ width: `${width}%` }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 잠긴 자리 — 가린 것을 가렸다고 말한다 */}
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/92 to-transparent px-space-lg pb-space-lg pt-space-xl">
            <Icon name="lock" className="text-[22px] text-[rgb(var(--accent))]" />
            <span className="font-label-md text-label-md text-on-surface">
              결제하면 {report.chapters.length}장이 전부 열려요
            </span>
            <span className="font-label-sm text-label-sm text-outline">미리보기는 글의 모양만 보여 드려요</span>
          </div>
        </section>
      </Reveal>

      {/* ─ 들어가면 뭘 묻는지. 대화를 미리 보여 준다 ─ */}
      {report.questions.length > 0 && (
        <Reveal className="mt-space-lg">
          <section className="flex flex-col gap-space-md rounded-3xl bg-[rgb(var(--accent)/0.12)] p-space-lg ring-1 ring-[rgb(var(--accent)/0.28)]">
            <div className="flex flex-col gap-0.5">
              <span className="font-label-sm text-label-sm font-bold tracking-[0.2em] text-[rgb(var(--accent))]">BEFORE WE START</span>
              <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">들어가면 이런 걸 물어요</h2>
            </div>

            {report.questions.slice(0, 2).map((question) => (
              <div key={question.id} className="flex flex-col gap-space-xs">
                <div className="flex items-end gap-space-xs">
                  <GuideAvatar guide={guide} size="sm" />
                  <p className="rounded-3xl rounded-bl-md bg-surface-container-highest px-space-md py-2 font-body-md text-body-md leading-snug text-on-surface">
                    {question.question}
                  </p>
                </div>
                <ul className="flex flex-wrap justify-end gap-1.5">
                  {question.options.slice(0, 3).map((option) => (
                    <li
                      key={option}
                      className="rounded-full border border-[rgb(var(--accent)/0.6)] px-2.5 py-1 font-label-sm text-label-sm text-on-surface"
                    >
                      {option}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <p className="font-label-sm text-label-sm leading-snug text-on-surface-variant">
              답해 주신 내용은 그대로 풀이의 근거가 돼요. 여기까지는 무료예요.
            </p>
          </section>
        </Reveal>
      )}

      {/* ─ 받고 나면 어떻게 생겼는지 ─ */}
      <Reveal className="mt-space-lg">
        <section className="overflow-hidden rounded-3xl bg-surface-container">
          <SceneCut guide={report.guide} cut="report-cover" className="aspect-[4/3] w-full" />
          <div className="flex flex-col gap-space-sm p-space-lg">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">받고 나면 이렇게 생겼어요</h2>
            <ul className="flex flex-col gap-space-xs">
              {[
                {
                  icon: "menu_book",
                  text: `${report.chapters.length}장짜리 한 편의 글이에요. 장마다 근거와 시기표가 붙어요.`,
                },
                { icon: "download", text: "화면으로도 보고, PDF 로 내려받아 두실 수도 있어요." },
                { icon: "inventory_2", text: "보관함에 들어가요. 결제일부터 12개월 동안 다시 열려요." },
                { icon: "chat", text: "번호를 적어 두시면 다 쓰이는 대로 카카오톡으로 알려 드려요." },
              ].map((item) => (
                <li key={item.icon} className="flex gap-space-sm">
                  <Icon name={item.icon} className="mt-0.5 shrink-0 text-[18px] text-tertiary" />
                  <span className="font-body-sm text-body-sm leading-relaxed text-on-surface-variant">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </Reveal>

      {/* ─ 누가 써 주는지 ─ */}
      <Reveal className="mt-space-lg">
        <section className="flex gap-space-md overflow-hidden rounded-3xl bg-surface-container p-space-sm">
          <SceneCut guide={report.guide} cut="intro-5" className="aspect-[3/4] w-[38%] shrink-0 rounded-2xl" />
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-space-xs py-space-sm pr-space-sm">
            <span className="font-label-sm text-label-sm font-bold tracking-[0.2em] text-outline">YOUR READER</span>
            <span className="font-headline-sm text-headline-sm text-on-surface">{guide.title}</span>
            <p className="font-body-sm text-body-sm leading-relaxed text-on-surface-variant">{guide.persona}</p>
            <p className="font-label-sm text-label-sm leading-snug text-tertiary">{guide.voice}</p>
          </div>
        </section>
      </Reveal>

      {/* ─ 어떻게 쓰는지 ─ */}
      <Reveal className="mt-space-lg">
        <ul className="flex flex-col gap-space-sm rounded-3xl bg-surface-container-low p-space-lg">
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

      {/* ─ 결제 직전에 궁금한 것 ─ */}
      <FaqSection />

      {/* ─ 함께 보는 풀이 ─ */}
      {others.length > 0 && (
        <section className="mt-space-xl flex flex-col gap-space-sm">
          <SectionHead label="ALSO READ" title="이것도 함께 봐요" />
          <ol className="no-scrollbar -mx-margin flex snap-x gap-space-sm overflow-x-auto px-margin pb-1">
            {others.map((item) => (
              <li key={item.slug} className="w-[44vw] max-w-[11rem] shrink-0 snap-start">
                <RelatedCard report={item} />
              </li>
            ))}
          </ol>
        </section>
      )}

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
        {/*
          값을 여기서 뺐다. 상세페이지는 "이게 나한테 맞는가"를 재는 자리인데, 그 자리에
          값이 크게 박혀 있으면 맞는지보다 싼지를 먼저 재게 된다. 값은 명식을 다 보고
          결제 직전에 한 번만 보여 준다.

          비운 자리는 버튼이 통째로 쓴다. 누르기 전에 알아야 하는 것은 값이 아니라
          "여기서 돈이 나가지 않는다"는 것이다.
        */}
        <button
          type="button"
          onClick={onStart}
          className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-secondary py-4 font-label-md text-label-md font-bold text-on-secondary shadow-[0_6px_28px_rgb(var(--accent)/0.5)] transition-transform active:scale-[0.98]"
        >
          {resuming ? "이어서 보기" : `${josa(guide.name, "을/를")} 만나러 가기`}
          <Icon name="arrow_forward" className="text-[18px]" />
        </button>
        <p className="mt-1.5 text-center font-label-sm text-label-sm text-outline">
          내 여덟 글자까지 무료로 봐요 · 결제는 맨 마지막에 한 번
        </p>
      </div>
    </div>
  );
}

/** 함께 보는 풀이 한 장. 포스터 영상 그대로 작게 */
function RelatedCard({ report }: { report: ReportProduct }) {
  const { ref, inView } = useInView<HTMLAnchorElement>();
  const poster = getPoster(report.slug, report.guide);
  const font = productFont(report.slug);

  return (
    <Link ref={ref} href={`/reports/${report.slug}`} className="flex flex-col gap-space-xs active:scale-[0.98]">
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-surface-container shadow-lg">
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
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-surface-container-lowest/95 to-transparent" />
        <span
          className="absolute inset-x-0 bottom-0 px-2 pb-2 text-center text-[1.15rem] leading-tight text-on-surface [text-shadow:0_1px_10px_rgb(0_0_0/0.95)]"
          style={font ? { fontFamily: font } : undefined}
        >
          {report.title}
        </span>
      </div>
      <span className="px-0.5 font-label-sm text-label-sm text-on-surface-variant">{report.categoryLabel}</span>
    </Link>
  );
}
