"use client";

import { getWebtoonAsset } from "@/components/webtoon/assets";
import { WebtoonMedia } from "@/components/webtoon/WebtoonMedia";
import { GuideAvatar } from "@/components/story/GuideAvatar";
import { Icon } from "@/components/ui/Icon";
import { formatKRW } from "@/lib/format";
import { productAccent } from "@/lib/reports/accents";
import type { ReportProduct } from "@/lib/reports/catalog";
import { productFont } from "@/lib/reports/fonts";
import { getPitch } from "@/lib/reports/pitch";
import { getGuide } from "@/lib/story/guides";

/**
 * 예시 질문.
 *
 * 실제로 묻는 사람이 가장 먼저 막히는 지점은 "무엇을 물어야 하나" 다. 흔히 오는 질문을
 * 먼저 보여 주면 첫 문장이 쉬워진다. 답을 지어내 보여 주지는 않는다 — 답의 모양만 둔다.
 */
const SAMPLE_QUESTIONS = [
  "올해 이직해도 괜찮을까요?",
  "지금 만나는 사람과 결이 맞나요?",
  "돈이 자꾸 새는 이유가 뭘까요?",
  "이사는 언제가 좋아요?",
];

/**
 * 채팅 진입 화면의 윗부분.
 *
 * 아래쪽(명식 입력·결제)은 서버가 로그인 상태를 보고 그리므로 여기서는 건드리지 않는다.
 * 이 파일은 "무엇을 사는 자리인가" 만 보여 준다.
 */
export function ConsultIntro({ product, turnLimit }: { product: ReportProduct; turnLimit: number }) {
  const guide = getGuide(product.guide);
  const pitch = getPitch(product.slug);
  const poster = getWebtoonAsset(product.guide, "poster-consult");
  const font = productFont(product.slug);

  const chips = [guide.name, `${turnLimit}번까지`, "근거 표기", "기록 보관"];

  return (
    <div
      style={{ "--accent": productAccent(product.slug) } as React.CSSProperties}
      className="relative flex flex-col"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-[-1rem] top-0 h-[110svh] bg-[radial-gradient(70%_40%_at_50%_16%,rgb(var(--accent)/0.26),transparent_72%)]"
      />
      {/* ─ 히어로 ─ */}
      <header className="relative -mx-margin flex min-h-[62svh] flex-col justify-end overflow-hidden">
        {poster && <WebtoonMedia asset={poster} className="absolute inset-0" />}
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-surface/10" />
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-[linear-gradient(to_top,rgb(var(--accent)/0.38),transparent)]" />

        <div className="relative flex flex-col gap-space-sm px-margin pb-space-lg">
          <span className="flex items-center gap-1.5">
            <GuideAvatar guide={guide} size="sm" />
            <span className="font-label-sm text-label-sm text-on-surface/80 [text-shadow:0_1px_8px_rgb(0_0_0/0.9)]">
              {guide.title}가 맞은편에 앉아요
            </span>
          </span>
          <h1
            className="text-[2.9rem] leading-[1] tracking-tight text-on-surface [text-shadow:0_0_26px_rgb(0_0_0/0.9)]"
            style={font ? { fontFamily: font } : undefined}
          >
            {product.title}
          </h1>
          <p className="font-headline-sm text-headline-sm leading-snug text-on-surface/90 [text-shadow:0_1px_10px_rgb(0_0_0/0.95)]">
            {product.tagline}
          </p>
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
        </div>
      </header>

      {/* ─ 어떻게 흐르는지. 답은 모양만 보여 준다 ─ */}
      <section className="relative mt-space-lg flex flex-col gap-space-md rounded-3xl bg-[rgb(var(--accent)/0.12)] p-space-lg ring-1 ring-[rgb(var(--accent)/0.28)]">
        <div className="flex flex-col gap-0.5">
          <span className="font-label-sm text-label-sm font-bold tracking-[0.2em] text-[rgb(var(--accent))]">HOW IT GOES</span>
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">이런 걸 물어요</h2>
        </div>

        <ul className="flex flex-wrap justify-end gap-1.5">
          {SAMPLE_QUESTIONS.map((question) => (
            <li
              key={question}
              className="rounded-3xl rounded-br-md bg-[rgb(var(--accent)/0.28)] px-space-md py-2 font-body-sm text-body-sm text-on-surface"
            >
              {question}
            </li>
          ))}
        </ul>

        <div className="flex items-end gap-space-xs">
          <GuideAvatar guide={guide} size="sm" />
          <div className="flex-1 rounded-3xl rounded-bl-md bg-surface-container-highest px-space-md py-space-sm">
            <div className="flex flex-col gap-2">
              {[100, 88, 94, 60].map((width) => (
                <span
                  key={width}
                  className="h-2.5 rounded-full bg-on-surface/10 motion-safe:animate-pulse"
                  style={{ width: `${width}%` }}
                />
              ))}
            </div>
            <span className="mt-space-sm block font-label-sm text-label-sm text-tertiary">
              답마다 어느 글자에서 나온 말인지 함께 붙어요
            </span>
          </div>
        </div>

        <p className="font-label-sm text-label-sm leading-snug text-on-surface-variant">
          예시 질문이에요. 실제로는 무엇을 물어도 돼요 — 한 번 결제로 {turnLimit}번까지 이어서 물을 수 있어요.
        </p>
      </section>

      {pitch && (
        <>
          {/* ─ 내놓는 것 셋 ─ */}
          <section className="mt-space-xl flex flex-col gap-space-md">
            {pitch.claims.map((claim, index) => (
              <div key={claim} className={index % 2 === 1 ? "flex flex-row-reverse items-start gap-space-sm text-right" : "flex items-start gap-space-sm"}>
                <span aria-hidden className="text-[3.4rem] font-bold leading-[0.78] tabular-nums text-[rgb(var(--accent)/0.55)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="flex-1 pt-1 font-headline-md text-headline-md leading-snug tracking-tight text-on-surface">
                  {claim}
                </p>
              </div>
            ))}
          </section>

          {/* ─ 하지 않는 것까지 ─ */}
          <div className="mt-space-lg flex items-end gap-space-sm">
            <GuideAvatar guide={guide} size="md" />
            <div className="flex-1">
              <p className="rounded-3xl rounded-bl-md bg-surface-container-highest px-space-lg py-space-md font-body-lg text-body-lg leading-relaxed text-on-surface">
                {pitch.promise}
              </p>
              <span className="mt-1 block px-space-sm font-label-sm text-label-sm text-outline">— {guide.title}</span>
            </div>
          </div>

          {/* ─ 받는 것 ─ */}
          <ol className="no-scrollbar -mx-margin mt-space-xl flex snap-x gap-space-sm overflow-x-auto px-margin pb-1">
            {pitch.gets.map((item, index) => (
              <li key={item.title} className="w-[64vw] max-w-[15rem] shrink-0 snap-start">
                <div className="flex h-full flex-col gap-1 rounded-3xl bg-surface-container p-space-lg">
                  <span className="font-label-sm text-label-sm font-bold tracking-[0.2em] text-[rgb(var(--accent))]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="font-headline-sm text-headline-sm text-on-surface">{item.title}</span>
                  <span className="font-body-md text-body-md leading-relaxed text-on-surface-variant">{item.body}</span>
                </div>
              </li>
            ))}
          </ol>
        </>
      )}

      {/* ─ 값과 조건 ─ */}
      <section className="mt-space-lg flex items-center justify-between gap-space-md rounded-3xl bg-surface-container-low p-space-lg">
        <div className="flex flex-col">
          <span className="font-price-display text-price-display text-on-surface">{formatKRW(product.price)}</span>
          <span className="font-label-sm text-label-sm text-outline">한 번 결제 · 질문 {turnLimit}개</span>
        </div>
        <ul className="flex flex-col gap-1 text-right">
          {[
            { icon: "schedule", text: "세션은 30일 동안 열려 있어요" },
            { icon: "auto_stories", text: "대화는 보관함에 남아요" },
          ].map((item) => (
            <li key={item.icon} className="flex items-center justify-end gap-1.5 font-label-sm text-label-sm text-on-surface-variant">
              {item.text}
              <Icon name={item.icon} className="text-[16px] text-tertiary" />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
