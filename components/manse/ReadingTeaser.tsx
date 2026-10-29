"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import type { ReadingTeaser as Teaser } from "@/lib/manse/teaser";

/** 스크롤해 들어올 때 한 번 떠오른다 */
function Rise({ children, className }: { children: React.ReactNode; className?: string }) {
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
      { rootMargin: "-10% 0px" },
    );
    observer.observe(node);
    // 관찰자가 돌지 않는 자리에서도 글이 사라지면 안 된다
    const fallback = window.setTimeout(() => setShown(true), 1500);
    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={cn("transition-all duration-700 ease-out", shown ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0", className)}
    >
      {children}
    </div>
  );
}

/** 구간 머리 — 運 01 처럼 번호를 크게 */
function Chapter({ no, eyebrow, title }: { no: string; eyebrow: string; title: string }) {
  return (
    <div className="flex flex-col items-center gap-1 pt-space-xl text-center">
      <span className="font-headline-md text-headline-md text-secondary/50">運</span>
      <span className="font-label-md text-label-md tracking-widest text-secondary">
        {no} · {eyebrow}
      </span>
      <h2 className="text-[1.6rem] font-bold leading-snug tracking-tight text-on-surface">{title}</h2>
    </div>
  );
}

/** 결제해야 열리는 칸 */
function Locked({ label, teaser }: { label: string; teaser: string }) {
  return (
    <div className="relative flex flex-col gap-1 overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container p-space-lg">
      <span className="font-label-md text-label-md text-on-surface">{label}</span>
      <span className="font-body-sm text-body-sm text-on-surface-variant">{teaser}</span>
      <span className="mt-space-xs flex w-fit items-center gap-1 rounded-full bg-secondary/15 px-2.5 py-1 font-label-sm text-label-sm text-secondary">
        <Icon name="lock" className="text-[14px]" />
        열람하면 공개
      </span>
    </div>
  );
}

/**
 * 돈을 받기 전에 읽히는 화면.
 *
 * 전에는 만세력을 보여 주고 바로 결제 버튼을 놓았다. 한자 여덟 글자는 처음 보는 사람에게
 * 읽을거리가 아니라서, 읽은 것 없이 값부터 마주하는 꼴이었다.
 *
 * 여기서는 먼저 읽힌다. 맞혀 보이고, 열리는 달을 짚고, 조심할 때를 말하고, 그다음에
 * 가장 궁금한 것만 잠근다. 잠근 칸도 무엇이 들었는지는 밝힌다 — 뭐가 들었는지 모르는
 * 자물쇠에는 아무도 돈을 내지 않는다.
 *
 * 여기 나오는 값은 전부 계산 결과다. 매력 점수나 상위 몇 퍼센트처럼 우리가 세지 않는
 * 숫자는 쓰지 않는다. 파는 것과 속이는 것은 거기서 갈린다.
 */
export function ReadingTeaser({ teaser, name }: { teaser: Teaser; name: string }) {
  return (
    <div className="flex flex-col gap-space-lg">
      {/* 단언 한 줄 */}
      <Rise>
        <div className="flex flex-col items-center gap-space-sm rounded-2xl border border-secondary/25 bg-secondary/[0.07] p-space-xl text-center">
          <span className="font-label-sm text-label-sm tracking-widest text-secondary">방금 계산했습니다</span>
          <h1 className="text-[2rem] font-bold leading-tight tracking-tight text-on-surface">{teaser.headline}</h1>
          {teaser.best && (
            <p className="font-body-md text-body-md text-on-surface-variant">
              {teaser.best.ganji} · {teaser.best.note}
            </p>
          )}
        </div>
      </Rise>

      {/* 運 01 — 맞혀 보이기 */}
      {teaser.scenes.length > 0 && (
        <>
          <Rise>
            <Chapter no="01" eyebrow="지금의 결" title={`${name}님, 이런 적 있으셨죠`} />
          </Rise>
          {teaser.scenes.map((scene) => (
            <Rise key={scene}>
              <div className="flex gap-space-sm rounded-xl bg-surface-container p-space-lg">
                <Icon name="check" className="mt-0.5 shrink-0 text-[18px] text-secondary" />
                <span className="font-body-md text-body-md leading-relaxed text-on-surface">{scene}</span>
              </div>
            </Rise>
          ))}
          <Rise>
            <p className="px-space-sm text-center font-body-md text-body-md italic text-on-surface-variant">
              여기까지 맞았다면, 나머지도 같은 여덟 글자에서 나옵니다.
            </p>
          </Rise>
        </>
      )}

      {/* 運 02 — 열리는 때 */}
      {teaser.months.length > 0 && (
        <>
          <Rise>
            <Chapter no="02" eyebrow="시기" title="문이 열리는 달, 쉬어 갈 달" />
          </Rise>
          <Rise>
            <ol className="flex flex-col gap-space-xs rounded-2xl bg-surface-container p-space-lg">
              {teaser.months.slice(0, 6).map((month) => (
                <li key={month.label} className="flex items-center gap-space-sm">
                  <span
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full",
                      month.tone === "good" ? "bg-tertiary" : month.tone === "caution" ? "bg-secondary" : "bg-outline",
                    )}
                  />
                  <span className="w-[6.5rem] shrink-0 font-label-md text-label-md text-on-surface">{month.label}</span>
                  <span className="line-clamp-1 font-body-sm text-body-sm text-on-surface-variant">{month.note}</span>
                </li>
              ))}
            </ol>
          </Rise>
          {teaser.risk && (
            <Rise>
              <div className="flex flex-col gap-space-xs rounded-2xl border border-secondary/30 bg-secondary/[0.07] p-space-lg">
                <span className="flex items-center gap-1.5 font-label-md text-label-md text-secondary">
                  <Icon name="warning" className="text-[18px]" />
                  {teaser.risk.label}은 조심해야 합니다
                </span>
                <span className="font-body-md text-body-md leading-relaxed text-on-surface">{teaser.risk.note}</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  이때 무엇을 하면 안 되는지는 풀이에 적어 두었습니다.
                </span>
              </div>
            </Rise>
          )}
        </>
      )}

      {/* 運 03 — 타고난 결, 일부만 */}
      {teaser.traits.length > 0 && (
        <>
          <Rise>
            <Chapter no="03" eyebrow="타고난 결" title="여덟 글자가 말하는 것" />
          </Rise>
          <Rise>
            <dl className="grid grid-cols-2 gap-space-sm">
              {teaser.traits.map((trait) => (
                <div key={trait.label} className="flex flex-col gap-0.5 rounded-xl bg-surface-container p-space-md">
                  <dt className="font-label-sm text-label-sm text-outline">{trait.label}</dt>
                  <dd className="font-headline-sm text-headline-sm text-on-surface">{trait.value}</dd>
                </div>
              ))}
            </dl>
          </Rise>
          <Rise>
            <p className="px-space-sm text-center font-body-md text-body-md italic text-on-surface-variant">
              글자는 여기까지 보셨고 — 이게 삶에서 어떻게 나오는지가 남았습니다.
            </p>
          </Rise>
        </>
      )}

      {/* 運 04 — 잠긴 것 */}
      <Rise>
        <Chapter no="04" eyebrow="풀이" title="열면 이것들이 나옵니다" />
      </Rise>
      <div className="flex flex-col gap-space-sm">
        {teaser.locked.map((item) => (
          <Rise key={item.label}>
            <Locked label={item.label} teaser={item.teaser} />
          </Rise>
        ))}
      </div>
    </div>
  );
}
