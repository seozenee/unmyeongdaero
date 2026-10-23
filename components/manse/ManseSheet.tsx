"use client";

import { useEffect, useRef, useState } from "react";
import { DecadeTimeline } from "@/components/saju/DecadeTimeline";
import { FiveElementsRadar } from "@/components/saju/FiveElementsRadar";
import { FourPillarsChart } from "@/components/saju/FourPillarsChart";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import type { ElementCounts, FourPillarsInput } from "@/lib/saju/modules";
import type { DecadeItem } from "@/lib/saju/modules";

export interface ManseFact {
  label: string;
  value: string;
  /** 짧은 뜻풀이 — 처음 보는 사람을 위한 한 줄 */
  hint?: string;
}

export interface ManseSheetProps {
  name: string;
  birthLine: string;
  pillars: FourPillarsInput | null;
  counts: ElementCounts | null;
  decade: { items: DecadeItem[]; currentIndex: number; direction: string | null } | null;
  facts: ManseFact[];
  /** 계산 근거 — 진태양시 보정 같은 것 */
  basis: string[];
}

/**
 * 계산된 만세력 한 벌.
 *
 * 결제 전에 보여 주는 화면이라 해석은 한 글자도 넣지 않는다. 여기 있는 건 전부 계산 결과다.
 * "내 사주가 이렇게 나왔구나"까지만 확인하고, 그 뜻은 결제 뒤에 읽는다.
 *
 * 한 덩어리씩 차례로 올라오게 한다. 여덟 글자가 한꺼번에 튀어나오면 어디를 볼지 모르지만,
 * 순서대로 들어오면 읽는 차례가 생긴다.
 */
export function ManseSheet({ name, birthLine, pillars, counts, decade, facts, basis }: ManseSheetProps) {
  return (
    <div className="flex flex-col gap-space-lg">
      <Reveal>
        <header className="flex flex-col gap-space-xs">
          <span className="font-label-sm text-label-sm tracking-[0.2em] text-primary">만세력</span>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-on-surface">
            {name}님의 여덟 글자
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">{birthLine}</p>
        </header>
      </Reveal>

      {pillars && (
        <Reveal delay={90}>
          <Block title="원국" caption="태어난 순간을 네 기둥으로 옮긴 것">
            <FourPillarsChart pillars={pillars} />
          </Block>
        </Reveal>
      )}

      {counts && (
        <Reveal delay={180}>
          <Block title="오행" caption="다섯 기운이 어떻게 나뉘어 있는지">
            <FiveElementsRadar counts={counts} />
          </Block>
        </Reveal>
      )}

      {facts.length > 0 && (
        <Reveal delay={270}>
          <Block title="판정" caption="여덟 글자에서 바로 읽히는 것들">
            <dl className="flex flex-col gap-space-xs">
              {facts.map((fact) => (
                <div
                  key={fact.label}
                  className="flex flex-col gap-0.5 rounded-lg bg-surface-container px-space-md py-space-sm"
                >
                  <div className="flex items-baseline gap-space-sm">
                    <dt className="w-14 shrink-0 font-label-sm text-label-sm text-outline">{fact.label}</dt>
                    <dd className="font-label-md text-label-md text-on-surface">{fact.value}</dd>
                  </div>
                  {fact.hint && (
                    <p className="pl-[calc(3.5rem+var(--space-sm,0.5rem))] font-label-sm text-label-sm text-on-surface-variant">
                      {fact.hint}
                    </p>
                  )}
                </div>
              ))}
            </dl>
          </Block>
        </Reveal>
      )}

      {decade && decade.items.length > 0 && (
        <Reveal delay={360}>
          <Block title="대운" caption="십 년마다 바뀌는 큰 흐름">
            <DecadeTimeline items={decade.items} currentIndex={decade.currentIndex} direction={decade.direction ?? undefined} />
          </Block>
        </Reveal>
      )}

      {basis.length > 0 && (
        <Reveal delay={450}>
          <details className="group rounded-lg bg-surface-container-low px-space-md py-space-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
              이 계산의 기준
              <Icon
                name="expand_more"
                className="text-[18px] transition-transform duration-200 group-open:rotate-180"
              />
            </summary>
            <ul className="mt-space-sm flex flex-col gap-1">
              {basis.map((line) => (
                <li key={line} className="font-label-sm text-label-sm text-outline">
                  · {line}
                </li>
              ))}
            </ul>
          </details>
        </Reveal>
      )}
    </div>
  );
}

function Block({ title, caption, children }: { title: string; caption: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-space-sm">
      <div className="flex items-baseline gap-space-sm">
        <h2 className="font-headline-md text-headline-md text-on-surface">{title}</h2>
        <p className="font-label-sm text-label-sm text-outline">{caption}</p>
      </div>
      {children}
    </section>
  );
}

/**
 * 화면에 들어올 때 한 번 떠오른다.
 *
 * 애니메이션을 끄고 쓰는 사람에게는 처음부터 보이게 둔다 — 움직임이 없다고 내용이 없어지면 안 된다.
 */
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
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
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        "transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none",
        shown ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100",
      )}
    >
      {children}
    </div>
  );
}
