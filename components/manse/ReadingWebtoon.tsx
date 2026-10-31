"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { GuideAvatar } from "@/components/story/GuideAvatar";
import { Icon } from "@/components/ui/Icon";
import { SpeechBalloon } from "@/components/webtoon/ComicText";
import { WebtoonMedia } from "@/components/webtoon/WebtoonMedia";
import type { WebtoonAsset } from "@/components/webtoon/assets";
import { cn } from "@/lib/cn";
import type { ReadingTeaser as Teaser } from "@/lib/manse/teaser";
import type { Guide } from "@/lib/story/guides";

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
      <p className="text-[1.4rem] font-bold leading-snug tracking-tight text-on-surface">{title}</p>
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

/**
 * 돈을 받기 전에 읽히는 웹툰.
 *
 * 전에는 표와 목록이었다. 맞는 말이 적혀 있어도 읽는 사람 입장에서는 "분석 결과"라,
 * 읽는 게 아니라 확인하게 된다. 확인은 설득하지 않는다.
 *
 * 여기서는 안내자가 말을 건다. 그림 한 칸에 말 한 마디씩, 내려가면서 읽힌다.
 * 하는 말은 전부 계산에서 나온 것이다 — 신강약과 오행 분포가 일상에서 어떤 장면으로
 * 나오는지를 옮긴 것뿐이라, 맞히는 것처럼 보이는 이유는 점이 아니라 분류다.
 *
 * 매력 점수나 상위 몇 퍼센트처럼 우리가 세지 않는 숫자는 쓰지 않는다. 파는 것과
 * 속이는 것은 거기서 갈린다.
 */
export function ReadingWebtoon({
  teaser,
  name,
  guide,
  poster,
  scenes,
  chapters,
}: {
  teaser: Teaser;
  name: string;
  guide: Guide;
  poster: WebtoonAsset | null;
  /**
   * 맞혀 보이는 장면. 서버가 화면을 그리기 전에 AI 로 받아 둔 글이다.
   *
   * 한동안 표에서 골라 썼다. 신강약 셋 × 넘치는 기운 다섯 × 비는 기운 다섯 = 일흔다섯
   * 가지뿐이라, 같은 조합인 사람은 토씨 하나까지 같은 글을 봤다. 친구끼리 비교하면 바로
   * 들킨다 — 맞혀 보이는 자리에서 들키면 그 뒤는 아무 소용이 없다.
   *
   * 못 받았으면 null 이고, 그때는 이 칸을 통째로 비운다. 지어낸 말로 채우느니 비워
   * 두는 편이 낫다.
   */
  scenes: string[] | null;
  /** 잠긴 장의 제목들. 몇 장이 더 있는지 눈으로 보여 주는 데 쓴다 */
  chapters: readonly string[];
}) {
  return (
    <section className="-mx-margin flex flex-col">
      {/* 첫 칸 — 그림이 화면을 채우고 안내자가 말을 건다 */}
      <Panel>
        <div className="relative aspect-[4/5] w-full overflow-hidden">
          {poster && <WebtoonMedia asset={poster} className="absolute inset-0" />}
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/60 to-transparent" />
          <div className="absolute inset-x-margin bottom-space-lg flex flex-col gap-space-sm">
            <span className="font-label-sm text-label-sm tracking-widest text-white/70">방금 계산했어요</span>
            <h2 className="text-[1.9rem] font-bold leading-tight tracking-tight text-white">{teaser.headline}</h2>
          </div>
        </div>
      </Panel>

      {/* 맞혀 보이는 칸들 */}
      {scenes && scenes.length > 0 && (
        <div className="flex flex-col gap-space-md bg-surface px-margin py-space-xl">
          <Panel>
            <Says guide={guide}>{name}님, 여덟 글자를 펼쳐 놓고 보니 짚이는 게 있어요.</Says>
          </Panel>

          {scenes.map((scene, index) => (
            <Panel key={scene} className={index === 0 ? "pt-space-sm" : undefined}>
              <div className="flex flex-col gap-space-xs rounded-2xl bg-surface-container p-space-lg">
                <span className="font-body-md text-body-md leading-relaxed text-on-surface">{scene}</span>
              </div>
            </Panel>
          ))}

          <Panel>
            <Says guide={guide}>맞죠? 저는 {name}님을 만난 적이 없어요. 생년월일만 봤습니다.</Says>
          </Panel>
        </div>
      )}

      {/* 열리는 때 */}
      {teaser.best && (
        <Panel>
          <div className="relative overflow-hidden bg-surface-container-low px-margin py-space-xl">
            <span className="font-label-sm text-label-sm tracking-widest text-outline">문이 열리는 때</span>
            <p className="mt-space-xs text-[1.75rem] font-bold leading-tight tracking-tight text-on-surface">
              {teaser.best.label}
            </p>
            <p className="mt-space-xs font-body-md text-body-md leading-relaxed text-on-surface-variant">
              {teaser.best.note}
            </p>
          </div>
        </Panel>
      )}

      {teaser.risk && (
        <Panel>
          <div className="flex flex-col gap-space-xs bg-surface px-margin py-space-xl">
            <span className="flex items-center gap-1.5 font-label-sm text-label-sm tracking-widest text-secondary">
              <Icon name="warning" className="text-[16px]" />
              쉬어 갈 때
            </span>
            <p className="text-[1.5rem] font-bold leading-tight tracking-tight text-on-surface">{teaser.risk.label}</p>
            <p className="font-body-md text-body-md leading-relaxed text-on-surface-variant">{teaser.risk.note}</p>
          </div>
        </Panel>
      )}

      {/*
        여기서부터가 파는 자리다.
        지금까지 읽은 것이 전부처럼 느껴지면 아무도 열지 않는다. 읽은 것이 "극히 일부"
        였다는 걸 먼저 말하고, 남은 장이 몇이고 무엇인지 눈으로 보여 준다.
      */}
      <Punch lead="방금 읽으신 건" hit="여덟 글자의 극히 일부예요" />

      {poster && (
        <Panel>
          <div className="relative aspect-[3/2] w-full overflow-hidden">
            <WebtoonMedia asset={poster} className="absolute inset-0" />
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-surface/60" />
          </div>
        </Panel>
      )}

      <Punch lead={`${name}님, 좋은 말만 하지는 않을 거예요.`} hit="그래도 들어 보시겠어요?" />

      {/* 잠긴 장 — 무엇이 들었는지는 밝히고 내용만 가린다 */}
      <div className="flex flex-col gap-space-md pb-space-xl">
        {chapters.slice(0, 5).map((title, index) => (
          <Panel key={title}>
            <ChapterMark no={index + 1} title={title} />
            <div className="mt-space-sm px-margin">
              <div className="relative overflow-hidden rounded-2xl bg-surface-container p-space-lg">
                {/* 글이 있긴 한데 읽히지는 않는 모양 — 비어 있는 것과 가린 것은 다르다 */}
                <div className="flex flex-col gap-2" aria-hidden>
                  <span className="h-3 w-full rounded-full bg-on-surface/10" />
                  <span className="h-3 w-11/12 rounded-full bg-on-surface/10" />
                  <span className="h-3 w-4/5 rounded-full bg-on-surface/10" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-surface-container/40 backdrop-blur-[2px]">
                  <Icon name="lock" className="text-[22px] text-outline" />
                </div>
              </div>
            </div>
          </Panel>
        ))}

        {chapters.length > 5 && (
          <Panel>
            <p className="px-margin text-center font-body-md text-body-md text-on-surface-variant">
              이 밖에 {chapters.length - 5}장이 더 있어요.
            </p>
          </Panel>
        )}

        {teaser.locked.length > 0 && (
          <Panel>
            <div className="mt-space-sm flex flex-col gap-space-sm px-margin">
              <p className="font-label-md text-label-md text-on-surface">열면 이런 것들이 나와요</p>
              {teaser.locked.map((item) => (
                <div key={item.label} className="flex items-start gap-space-sm rounded-xl bg-surface-container p-space-md">
                  <Icon name="check" className="mt-0.5 shrink-0 text-[17px] text-secondary" />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="font-label-md text-label-md text-on-surface">{item.label}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{item.teaser}</span>
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        )}

        <Punch lead="여기까지는 돈이 들지 않았어요." hit="나머지는 열어야 보입니다" />
      </div>
    </section>
  );
}
