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

      {/* 잠긴 칸 — 무엇이 들었는지는 밝히고 내용만 가린다 */}
      <div className="flex flex-col gap-space-sm bg-surface px-margin pb-space-xl">
        <Panel>
          <Says guide={guide}>여기까지는 공짜예요. 나머지는 열어야 보입니다.</Says>
        </Panel>

        {teaser.locked.map((item) => (
          <Panel key={item.label}>
            <div className="flex items-start gap-space-sm rounded-2xl border border-outline-variant/50 bg-surface-container p-space-lg">
              <Icon name="lock" className="mt-0.5 shrink-0 text-[18px] text-outline" />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="font-label-md text-label-md text-on-surface">{item.label}</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">{item.teaser}</span>
              </span>
            </div>
          </Panel>
        ))}

        {teaser.traits.length > 0 && (
          <Panel>
            <dl className="mt-space-xs grid grid-cols-2 gap-space-sm">
              {teaser.traits.map((trait) => (
                <div key={trait.label} className="flex flex-col gap-0.5 rounded-xl bg-surface-container p-space-md">
                  <dt className="font-label-sm text-label-sm text-outline">{trait.label}</dt>
                  <dd className="font-headline-sm text-headline-sm text-on-surface">{trait.value}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        )}

        <Panel>
          <Link
            href="#결제"
            className="mt-space-xs flex items-center justify-center gap-1 rounded-2xl bg-secondary py-4 font-label-md text-label-md font-bold text-on-secondary"
          >
            내 풀이 열어 보기
            <Icon name="arrow_forward" className="text-[18px]" />
          </Link>
        </Panel>
      </div>
    </section>
  );
}
