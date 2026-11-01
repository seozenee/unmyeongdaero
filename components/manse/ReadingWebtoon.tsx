"use client";

import { useEffect, useRef, useState } from "react";
import { GuideAvatar } from "@/components/story/GuideAvatar";
import { useInView } from "@/components/home/useInView";
import { LockedReadingCard } from "./LockedReadingCard";
import { Icon } from "@/components/ui/Icon";
import { SpeechBalloon } from "@/components/webtoon/ComicText";
import { WebtoonMedia } from "@/components/webtoon/WebtoonMedia";
import { getWebtoonAsset, type WebtoonAsset } from "@/components/webtoon/assets";
import { chapterPreview, lockedTopicsFor } from "@/lib/reports/preview-topics";
import { cn } from "@/lib/cn";
import type { ReadingTeaser as Teaser } from "@/lib/manse/teaser";
import type { Guide } from "@/lib/story/guides";
import type { PreviewContext, PreviewEvidence, PreviewReading } from "@/lib/manse/preview";

/** 스크롤해 들어올 때 한 번 떠오른다 */
function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
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
    // 관찰자가 돌지 않는 자리에서도 글이 사라지면 안 된다
    const failOpen = window.setTimeout(() => {
      const bounds = node.getBoundingClientRect();
      if (bounds.top < window.innerHeight && bounds.bottom > 0) setShown(true);
    }, 1200);
    return () => {
      observer.disconnect();
      window.clearTimeout(failOpen);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "story-reveal transition-all duration-700 ease-out",
        shown && "is-shown",
        shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * 크게 던지는 두 줄.
 *
 * 윗줄은 흰 글씨로 깔고, 아랫줄만 브랜드 색으로 때린다. 한 덩어리로 다 굵게 쓰면
 * 어디를 보라는 건지 알 수 없어 그냥 시끄러운 글이 된다. 눈이 한 군데에만 걸려야
 * 그 한 줄이 남는다.
 */
function Punch({ lead, hit }: { lead: string; hit: string }) {
  return (
    <div className="story-punch flex flex-col items-center gap-2 bg-surface px-margin py-space-xl text-center">
      <p className="text-[1.5rem] font-bold leading-snug tracking-tight text-on-surface">{lead}</p>
      <p className="story-highlight text-[1.9rem] font-bold leading-snug tracking-tight text-secondary">{hit}</p>
    </div>
  );
}

/** 잠긴 장을 예고하는 머리 — 몇 장이 더 있는지 눈으로 보여 준다 */
function ChapterMark({ no, title }: { no: number; title: string }) {
  return (
    <div className="story-chapter flex flex-col items-center gap-2 bg-surface px-margin pt-space-xl">
      <span aria-hidden="true" className="story-chapter-seal">{String(no).padStart(2, "0")}</span>
      <span className="font-label-sm text-label-sm tracking-[0.3em] text-secondary">
        CHAPTER {String(no).padStart(2, "0")}
      </span>
      <h2 className="text-[1.4rem] font-bold leading-snug tracking-tight text-on-surface">{title}</h2>
    </div>
  );
}

/** 안내자가 건네는 말 한 칸 */
function Says({ guide, children }: { guide: Guide; children: React.ReactNode }) {
  return (
    <div className="flex items-end gap-space-sm">
      <GuideAvatar guide={guide} size="sm" />
      <SpeechBalloon tail="bottom-left" className="flex-1">
        {children}
      </SpeechBalloon>
    </div>
  );
}

function Evidence({ ids, facts }: { ids: string[]; facts: PreviewEvidence[] }) {
  const selected = ids.flatMap(id => facts.filter(fact => fact.id === id));
  return (
    <details className="mt-space-md rounded-xl border border-outline-variant/40 bg-surface-container-low px-space-md py-space-sm">
      <summary className="cursor-pointer font-label-sm text-label-sm text-secondary">이렇게 읽은 근거</summary>
      <dl className="mt-space-sm flex flex-col gap-space-sm">
        {selected.map(fact => <div key={fact.id}>
          <dt className="font-label-sm text-label-sm text-on-surface">{fact.label}</dt>
          <dd className="mt-1 font-body-sm text-body-sm leading-relaxed text-on-surface-variant">{fact.note}</dd>
        </div>)}
      </dl>
    </details>
  );
}

function ReadingBlock({ block, facts, limit = 2 }: { block: PreviewReading["personality"]; facts: PreviewEvidence[]; limit?: number }) {
  return <article className="px-margin py-space-lg">
    <h3 className="text-[1.4rem] font-bold leading-snug tracking-tight text-on-surface">{block.title}</h3>
    <p className="mt-space-md text-[1.1rem] font-semibold leading-relaxed text-secondary">{block.lead}</p>
    <div className="mt-space-md flex flex-col gap-space-md">
      {block.body.slice(0, limit).map((paragraph, index) => <p key={index} className="font-body-md text-body-md leading-[1.9] text-on-surface-variant">{paragraph}</p>)}
    </div>
    <Evidence ids={block.evidenceIds} facts={facts} />
  </article>;
}

function PreviewScene({ guide, assetKey, caption, impact = false }: { guide: Guide; assetKey: string; caption: string; impact?: boolean }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const asset = getWebtoonAsset(guide.id, assetKey);
  if (!asset) return null;
  return <div ref={ref} data-visible={inView} className={cn("story-scene relative my-space-md aspect-[4/3] overflow-hidden", assetKey === "intro-5" && "story-eye", impact && "story-impact")}>
    <WebtoonMedia asset={asset} active={inView} />
    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
    {impact && <><span aria-hidden="true" className="story-sfx">탁</span><span aria-hidden="true" className="story-impact-ring" /></>}
    <p className="absolute inset-x-margin bottom-space-lg text-center text-[1.4rem] font-bold leading-snug text-white">{caption}</p>
  </div>;
}

/** 자기 인식 → 원국의 이유 → 과거 회고 → 잠긴 질문으로 이어지는 결제 전 미리보기. */
export function ReadingWebtoon({ name, guide, poster, narrative, context, chapters, productTitle, chart, purchaseHref }: {
  teaser: Teaser; name: string; guide: Guide; poster: WebtoonAsset | null;
  narrative: PreviewReading; context: PreviewContext; chapters: readonly string[];
  productTitle: string; chart: React.ReactNode; purchaseHref: string;
}) {
  const areaChapter = narrative.past.length > 0 ? 3 : 2;
  const blunt = context.speech === "반말";
  const topics = lockedTopicsFor(context);
  return (
    <section className="reading-story -mx-margin flex flex-col">
      <Panel>
        <div className="story-opening relative aspect-[9/14] w-full overflow-hidden">
          {poster && <WebtoonMedia asset={poster} className="absolute inset-0" />}
          <div aria-hidden="true" className="story-orbit"><i /><i /><i /></div>
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black to-transparent" />
          <div className="absolute inset-x-margin bottom-space-lg text-center">
            <span className="font-label-sm text-label-sm tracking-widest text-white/70">{productTitle} · {name}님의 풀이</span>
          </div>
        </div>
      </Panel>

      <Panel className="px-margin pb-space-md pt-space-xl text-center">
        <p className="mb-space-md font-label-sm text-label-sm tracking-[0.2em] text-secondary">{blunt ? "돌려 말하지 않을게." : "당신의 이야기를 펼쳐 볼게요."}</p>
        <h1 className="text-[2rem] font-bold leading-[1.4] tracking-tight text-white">{name}{context.child ? "의 이야기" : blunt ? "" : "님"},<br />{narrative.headline}</h1>
      </Panel>

      <Panel><Punch lead={blunt ? "남들은 모르는 너의 선택" : "남들은 모르는 나의 선택"} hit={blunt ? "왜 늘 같은 데서 막힐까?" : "왜 늘 같은 데서 막힐까요?"} /></Panel>
      <PreviewScene guide={guide} assetKey="intro-5" caption={blunt ? "좋은 말만 들으러 온 건 아니지?" : "좋은 말보다, 내게 맞는 답이 필요할 때"} />

      <Panel className="px-margin py-space-xl">
        <Says guide={guide}>{narrative.intro}</Says>
        <p className="mt-space-lg text-center font-body-md text-body-md leading-relaxed text-on-surface-variant">{blunt ? "실제로 겪은 모습과 비교하며 읽어 봐." : "실제로 겪은 모습과 비교하며 읽어 보세요."}</p>
        {Object.values(context.lifeContext).some(Boolean) && <div className="mt-space-lg border-t border-white/10 pt-space-md">
          <p className="mb-space-sm font-label-sm text-label-sm text-outline">직접 알려준 지금의 상황</p>
          <div className="flex flex-wrap gap-space-xs">{Object.values(context.lifeContext).filter(Boolean).map(value => <span key={value} className="rounded-full border border-secondary/25 px-3 py-1.5 font-body-sm text-body-sm text-on-surface-variant">{value}</span>)}</div>
        </div>}
      </Panel>
      <PreviewScene guide={guide} assetKey="intro-4" impact caption={blunt ? "이제, 네 사주를 펼쳐 보자." : "이제, 내 사주를 펼쳐 볼게요."} />
      <ChapterMark no={1} title={blunt ? "너, 이런 모습 있지?" : "이런 모습, 익숙하지 않으세요?"} />
      <Panel><ReadingBlock block={narrative.personality} facts={context.facts} /></Panel>
      <div id="reading-first-reveal" aria-hidden="true" />
      <details className="mx-margin mb-space-lg rounded-2xl border border-outline-variant/40 bg-surface-container-low p-space-md">
        <summary className="cursor-pointer font-label-md text-label-md text-on-surface">입력한 생년월일과 내 사주표 확인하기</summary>
        <div className="pt-space-lg">{chart}</div>
      </details>
      <PreviewScene guide={guide} assetKey="panel-brush" caption={blunt ? "잘하는 것과, 같은 데서 막히는 이유" : "내가 잘하는 것과, 같은 데서 막히는 이유"} />

      {narrative.past.length > 0 && <>
        <ChapterMark no={2} title="지나온 시간에 남은 흔적" />
        <p className="px-margin pt-space-md font-body-sm text-body-sm leading-relaxed text-outline">{blunt ? "그해에 어떤 모습이 있었는지 떠올려 봐." : "그해에 어떤 모습이 있었는지 떠올려 보세요."}</p>
        <div className="flex flex-col gap-space-lg px-margin py-space-lg">
          {narrative.past.slice(0, 1).map(item => {
            const source = context.past.find(past => past.year === item.year)!;
            return <Panel key={item.year}>
              <article className="rounded-2xl border border-secondary/20 bg-surface-container-low p-space-lg">
                <p className="font-label-sm text-label-sm tracking-widest text-secondary">{item.year}년 · {source.age}살 무렵</p>
                <h3 className="mt-space-sm text-[1.35rem] font-bold leading-snug tracking-tight text-on-surface">{item.title}</h3>
                <div className="mt-space-md flex flex-col gap-space-md">
                  {item.body.slice(0, 1).map((paragraph, index) => <p key={index} className="font-body-md text-body-md leading-[1.9] text-on-surface-variant">{paragraph}</p>)}
                </div>
                <p className="mt-space-lg border-l-2 border-secondary/60 pl-space-md font-body-sm text-body-sm leading-relaxed text-on-surface">{item.check}</p>
                <details className="mt-space-md font-body-sm text-body-sm text-outline">
                  <summary className="cursor-pointer">{item.year}년 해석의 근거</summary>
                  <p className="mt-space-sm leading-relaxed">{source.interpretation}</p>
                  {source.reasons.slice(0, 2).map((reason, index) => <p key={index} className="mt-space-xs leading-relaxed">{reason}</p>)}
                </details>
              </article>
            </Panel>;
          })}
        </div>
      </>}

      <PreviewScene guide={guide} assetKey="panel-second" caption="같은 성향도, 관계와 일에서는 다르게 나타나요" />
      <ChapterMark no={areaChapter} title="같은 모습이 다른 곳에서도 나타나요" />
      {narrative.areas.map(block => <Panel key={block.title}>
        <ReadingBlock block={block} facts={context.facts} limit={1} />
        <div className="mx-margin mb-space-lg flex items-start gap-space-sm rounded-xl bg-surface-container p-space-md">
          <Icon name="lock" className="mt-1 text-[18px] text-secondary" />
          <p className="font-body-sm text-body-sm leading-relaxed text-on-surface-variant">이 성향이 언제 강점이 되고, 어떤 선택에서 발목을 잡는지. 구체적인 시기와 대응은 전체 풀이로 이어집니다.</p>
        </div>
      </Panel>)}

      <ChapterMark no={areaChapter + 1} title="그다음 이야기는 아직 남아 있어요" />
      <div className="flex flex-col gap-space-sm px-margin py-space-lg">
        {topics.map((topic, index) => <LockedReadingCard key={topic.title} topic={topic} no={index + 1} />)}
      </div>
      {context.months.length > 0 && <section className="mx-margin mb-space-lg rounded-3xl border border-outline-variant/40 bg-surface-container-low p-space-lg">
        <p className="font-label-sm text-label-sm tracking-widest text-secondary">앞으로의 시간</p>
        <h2 className="mt-space-sm text-[1.35rem] font-bold leading-snug text-on-surface">언제 시작하고, 언제 한 번 더 살펴볼까요?</h2>
        <div className="mt-space-lg flex gap-space-xs" aria-label="앞으로 여섯 달의 상세 풀이 미리보기">
          {context.months.map(month => <div key={month.period} className="flex min-w-0 flex-1 flex-col items-center gap-space-sm">
            <span className="h-1.5 w-full rounded-full bg-secondary/30" />
            <span className="text-center font-label-sm text-[11px] text-outline">{month.period.replace("년 ", ".").replace("월", "")}</span>
            <span aria-hidden="true" className="h-12 w-full rounded-lg bg-on-surface/10 blur-[3px]" />
            <Icon name="lock" className="text-[15px] text-outline" />
          </div>)}
        </div>
        <p className="mt-space-md font-body-sm text-body-sm leading-relaxed text-outline">각 시기에 무엇을 준비하고 어떤 선택을 점검할지는 전체 풀이에 이어집니다.</p>
      </section>}
      {context.concern && <section className="mx-margin mb-space-lg rounded-3xl border border-secondary/20 bg-secondary/5 p-space-lg">
        <p className="font-label-sm text-label-sm text-secondary">직접 남긴 질문</p>
        <blockquote className="mt-space-md whitespace-pre-wrap text-[1.15rem] font-semibold leading-relaxed text-on-surface">“{context.concern.slice(0, 300)}”</blockquote>
        <p className="mt-space-md font-body-sm text-body-sm leading-relaxed text-on-surface-variant">이 질문에서 확인할 조건과 선택 기준도 전체 풀이에 함께 담아요.</p>
        <div aria-hidden="true" className="mt-space-lg flex flex-col gap-space-sm">{[1, 2, 3].map(i => <div key={i} className="h-3 rounded bg-on-surface/10 blur-[3px] last:w-2/3" />)}</div>
        <p className="mt-space-md flex items-center gap-space-xs font-label-sm text-label-sm text-outline"><Icon name="lock" className="text-[16px]" /> 결제 후 사주와 질문을 함께 읽어 작성돼요</p>
      </section>}
      <PreviewScene guide={guide} assetKey="report-cover" caption="지금 읽은 모습에서, 다음 선택까지" />
      <Panel><Punch lead={blunt ? "성향을 알았다면, 다음은 선택이야." : "성향을 알았다면, 다음은 선택이에요."} hit="언제 움직일지, 무엇을 바꿀지까지." /></Panel>
      <div className="px-margin pb-space-lg">
        <h2 className="text-[1.35rem] font-bold text-on-surface">전체 풀이에서 확인할 이야기</h2>
        <ol className="mt-space-md divide-y divide-outline-variant/30 rounded-2xl border border-outline-variant/30 bg-surface-container-low px-space-md">
          {chapters.map((title, index) => <li key={title} className="story-toc-item flex items-start gap-space-sm py-space-lg">
            <span className="font-label-sm text-label-sm text-secondary">{String(index + 1).padStart(2, "0")}</span>
            <div className="flex-1"><p className="font-body-md text-body-md font-semibold text-on-surface">{title}</p><ul className="mt-space-sm flex flex-col gap-space-xs">{chapterPreview(title).map(item => <li key={item} className="font-body-sm text-body-sm leading-relaxed text-outline">· {item}</li>)}</ul></div>
            <Icon name="lock" className="text-[17px] text-outline" />
          </li>)}
        </ol>
        <p className="mt-space-md font-body-sm text-body-sm leading-relaxed text-outline">성격만이 아니라 지나온 변화, 앞으로의 시기와 선택까지 한 편으로 이어서 읽어 드려요.</p>
        <a href={purchaseHref} className="mt-space-lg flex w-full items-center justify-center gap-space-xs rounded-xl bg-secondary px-space-md py-space-md font-label-md text-label-md font-bold text-on-secondary">내 전체 풀이 확인하기<Icon name="arrow_forward" className="text-[18px]" /></a>
      </div>
    </section>
  );
}
