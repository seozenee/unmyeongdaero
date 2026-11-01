"use client";

import { useEffect, useRef, useState } from "react";
import { GuideAvatar } from "@/components/story/GuideAvatar";
import { Icon } from "@/components/ui/Icon";
import { SpeechBalloon } from "@/components/webtoon/ComicText";
import { WebtoonMedia } from "@/components/webtoon/WebtoonMedia";
import type { WebtoonAsset } from "@/components/webtoon/assets";
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
    const failOpen = window.setTimeout(() => setShown(true), 1200);
    return () => {
      observer.disconnect();
      window.clearTimeout(failOpen);
    };
  }, []);

  return (
    <div
      ref={ref}
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
 * 크게 던지는 두 줄.
 *
 * 윗줄은 흰 글씨로 깔고, 아랫줄만 브랜드 색으로 때린다. 한 덩어리로 다 굵게 쓰면
 * 어디를 보라는 건지 알 수 없어 그냥 시끄러운 글이 된다. 눈이 한 군데에만 걸려야
 * 그 한 줄이 남는다.
 */
function Punch({ lead, hit }: { lead: string; hit: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 bg-surface px-margin py-space-xl text-center">
      <p className="text-[1.5rem] font-bold leading-snug tracking-tight text-on-surface">{lead}</p>
      <p className="text-[1.75rem] font-bold leading-snug tracking-tight text-secondary">{hit}</p>
    </div>
  );
}

/** 잠긴 장을 예고하는 머리 — 몇 장이 더 있는지 눈으로 보여 준다 */
function ChapterMark({ no, title }: { no: number; title: string }) {
  return (
    <div className="flex flex-col items-center gap-1 bg-surface px-margin pt-space-xl">
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

/** 자기 인식 → 원국의 이유 → 과거 회고 → 잠긴 질문으로 이어지는 결제 전 미리보기. */
export function ReadingWebtoon({ teaser, name, guide, poster, narrative, context, chapters, productTitle, chart }: {
  teaser: Teaser; name: string; guide: Guide; poster: WebtoonAsset | null;
  narrative: PreviewReading; context: PreviewContext; chapters: readonly string[];
  productTitle: string; chart: React.ReactNode;
}) {
  const areaChapter = narrative.past.length > 0 ? 3 : 2;
  return (
    <section className="-mx-margin flex flex-col">
      <Panel>
        <div className="relative aspect-[4/5] w-full overflow-hidden">
          {poster && <WebtoonMedia asset={poster} className="absolute inset-0" />}
          <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black via-black/65 to-transparent" />
          <div className="absolute inset-x-margin bottom-space-xl flex flex-col gap-space-md">
            <span className="font-label-sm text-label-sm tracking-widest text-white/70">{productTitle} · {name}님의 풀이</span>
            <h1 className="text-[2rem] font-bold leading-[1.3] tracking-tight text-white">{name}님,<br />{narrative.headline}</h1>
            <p className="font-body-sm text-body-sm leading-relaxed text-white/70">왜 늘 같은 데서 마음이 걸리는지, 먼저 짚어볼게요</p>
          </div>
        </div>
      </Panel>

      <Panel className="px-margin py-space-xl">
        <Says guide={guide}>{narrative.intro}</Says>
        <p className="mt-space-lg text-center font-body-md text-body-md leading-relaxed text-on-surface-variant">익숙하게 느껴지는 모습이 있다면, 원국에서 그 이유를 함께 볼게요.</p>
      </Panel>
      <ChapterMark no={1} title="어떻게 이런 모습이 나올까요?" />
      <div className="px-margin py-space-md">{chart}</div>
      <Panel><ReadingBlock block={narrative.personality} facts={context.facts} /></Panel>

      {narrative.past.length > 0 && <>
        <ChapterMark no={2} title="지나온 시간에 남은 흔적" />
        <p className="px-margin pt-space-md font-body-sm text-body-sm leading-relaxed text-outline">지난 해의 운을 따로 계산해 읽었어요. 당시의 경험과 나란히 놓고 살펴보세요.</p>
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
        {[
          { label: "나에게 힘이 붙는 시기", value: teaser.best?.label ?? "흐름이 바뀌는 시기", detail: "그때 무엇을 준비하고 어떤 선택을 해야 하는지" },
          { label: context.minor || context.child ? "배움과 관계에서의 갈림길" : "인연과 돈에서 반복되는 선택", value: "자꾸 같은 데서 막히는 이유", detail: "남에게 맞는 답과 나에게 맞는 답이 달라지는 지점" },
          { label: "앞으로의 방향", value: "지금 붙들 것과 바꿀 것", detail: "지나온 시간과 앞으로의 흐름을 함께 놓고 읽는 기준" },
        ].map(item => <div key={item.label} className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-space-lg">
          <span className="font-label-sm text-label-sm text-secondary">{item.label}</span>
          <p className="mt-space-sm text-[1.2rem] font-bold leading-snug text-on-surface">{item.value}</p>
          <div className="mt-space-sm flex items-center gap-space-xs font-body-sm text-body-sm text-outline"><Icon name="lock" className="text-[16px]" /><span>{item.detail}</span></div>
        </div>)}
      </div>
      <Punch lead="여기까지 읽으며 떠오른 장면이 있었나요?" hit={`${name}님의 이야기는 여기서 끝나지 않아요`} />
      <div className="px-margin pb-space-lg">
        <h2 className="text-[1.35rem] font-bold text-on-surface">전체 풀이에서 확인할 이야기</h2>
        <ol className="mt-space-md divide-y divide-outline-variant/30 rounded-2xl border border-outline-variant/30 bg-surface-container-low px-space-md">
          {chapters.map((title, index) => <li key={title} className="flex items-center gap-space-sm py-space-md">
            <span className="font-label-sm text-label-sm text-secondary">{String(index + 1).padStart(2, "0")}</span>
            <span className="flex-1 font-body-md text-body-md text-on-surface">{title}</span>
            <Icon name="lock" className="text-[17px] text-outline" />
          </li>)}
        </ol>
        <p className="mt-space-md font-body-sm text-body-sm leading-relaxed text-outline">성격만이 아니라 지나온 변화, 앞으로의 시기와 선택까지 한 편으로 이어서 읽어 드려요.</p>
        <a href="#reading-purchase" className="mt-space-lg flex w-full items-center justify-center gap-space-xs rounded-xl bg-secondary px-space-md py-space-md font-label-md text-label-md font-bold text-on-secondary">내 전체 풀이 확인하기<Icon name="arrow_forward" className="text-[18px]" /></a>
      </div>
    </section>
  );
}
