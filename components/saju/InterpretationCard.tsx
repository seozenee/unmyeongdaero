"use client";

import { useId, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import type { BasisFact } from "@/lib/saju/basis";

interface InterpretationCardProps {
  eyebrow?: string;
  title: string;
  /** AI 해석 본문. 문단 단위 배열 */
  paragraphs: string[];
  /** 해석 근거: sazu modules 에서 뽑은 사실 */
  facts: BasisFact[];
  /** 해석 근거: sazu glossary 중 본문에 쓰인 용어 */
  glossary: Record<string, string>;
  className?: string;
}

export function InterpretationCard({ eyebrow, title, paragraphs, facts, glossary, className }: InterpretationCardProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const glossaryEntries = Object.entries(glossary);
  const hasBasis = facts.length > 0 || glossaryEntries.length > 0;

  return (
    <article className={cn("flex flex-col gap-space-md rounded-xl bg-surface-container p-space-lg shadow-sm", className)}>
      <header className="flex flex-col gap-space-xs">
        {eyebrow && <span className="font-label-sm text-label-sm tracking-widest text-primary">{eyebrow}</span>}
        <h3 className="font-headline-md text-headline-md text-on-surface">{title}</h3>
      </header>

      <div className="flex flex-col gap-space-sm">
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="font-body-md text-body-md leading-relaxed text-on-surface">
            {paragraph}
          </p>
        ))}
      </div>

      {hasBasis && (
        <div className="flex flex-col">
          <button
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((value) => !value)}
            className="flex items-center justify-between rounded-lg bg-surface-container-high px-space-md py-space-sm font-label-md text-label-md text-on-surface-variant transition-colors hover:text-on-surface"
          >
            <span className="flex items-center gap-1.5">
              <Icon name="fact_check" className="text-[18px] text-tertiary" />
              해석 근거 보기
            </span>
            <Icon name={open ? "expand_less" : "expand_more"} className="text-[20px]" />
          </button>

          {/* hidden 속성은 flex 클래스에 덮이므로 display 를 클래스로 토글한다 */}
          <div id={panelId} className={cn("mt-space-sm flex-col gap-space-md px-space-xs", open ? "flex" : "hidden")}>
            {facts.length > 0 && (
              <dl className="flex flex-col gap-1.5">
                {facts.map((fact) => (
                  <div key={fact.label} className="flex gap-space-sm font-body-sm text-body-sm">
                    <dt className="w-16 shrink-0 text-outline">{fact.label}</dt>
                    <dd className="text-on-surface-variant">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            {glossaryEntries.length > 0 && (
              <div className="flex flex-col gap-1.5 border-t border-outline-variant/40 pt-space-sm">
                <span className="font-label-sm text-label-sm text-outline">용어 풀이</span>
                <dl className="flex flex-col gap-1.5">
                  {glossaryEntries.map(([term, meaning]) => (
                    <div key={term} className="font-body-sm text-body-sm">
                      <dt className="inline font-semibold text-tertiary">{term}</dt>
                      <dd className="inline text-on-surface-variant"> — {meaning}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </div>
      )}

      <p className="font-label-sm text-label-sm text-outline">
        명리 계산 결과를 바탕으로 한 참고용 콘텐츠이며, 미래를 단정하지 않습니다.
      </p>
    </article>
  );
}
