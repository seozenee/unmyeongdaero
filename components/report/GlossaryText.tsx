"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";

interface GlossaryTextProps {
  text: string;
  glossary: Record<string, string>;
  className?: string;
}

/**
 * 명리 용어에 뜻을 달아 주는 글.
 *
 * 근거 카드는 "일주 병인 · 편인 · 장생" 처럼 적힌다. 쓰는 사람에게는 가장 짧고 정확한
 * 표기지만, 처음 보는 사람에게는 읽을 수 없는 줄이다. 뜻을 보려면 보고서 맨 아래
 * 용어 서랍까지 내려갔다 돌아와야 했다.
 *
 * 아는 낱말에 점선을 긋고, 누르면 그 자리에서 뜻이 열리게 한다. 글의 흐름을 끊지 않도록
 * 한 번에 하나만 열린다.
 *
 * 용어 사전은 보고서마다 함께 내려오므로, 모르는 낱말은 그냥 평범한 글자로 지나간다 —
 * 뜻이 없는데 점선만 긋는 것이 가장 나쁘다.
 */
export function GlossaryText({ text, glossary, className }: GlossaryTextProps) {
  const [open, setOpen] = useState<string | null>(null);

  // 긴 낱말부터 찾는다. "십이운성"이 "운성"으로 잘리면 뜻이 어긋난다.
  const terms = useMemo(
    () =>
      Object.keys(glossary)
        .filter((term) => term.length >= 2)
        .sort((a, b) => b.length - a.length),
    [glossary],
  );

  const pieces = useMemo(() => {
    const result: Array<{ text: string; term?: string }> = [];
    let rest = text;

    while (rest.length > 0) {
      let hitAt = -1;
      let hitTerm = "";
      for (const term of terms) {
        const at = rest.indexOf(term);
        if (at !== -1 && (hitAt === -1 || at < hitAt || (at === hitAt && term.length > hitTerm.length))) {
          hitAt = at;
          hitTerm = term;
        }
      }
      if (hitAt === -1) {
        result.push({ text: rest });
        break;
      }
      if (hitAt > 0) result.push({ text: rest.slice(0, hitAt) });
      result.push({ text: hitTerm, term: hitTerm });
      rest = rest.slice(hitAt + hitTerm.length);
    }
    return result;
  }, [text, terms]);

  const hasTerms = pieces.some((piece) => piece.term);

  return (
    <span className={className}>
      {pieces.map((piece, index) =>
        piece.term ? (
          <button
            key={`${piece.term}-${index}`}
            type="button"
            aria-expanded={open === piece.term}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setOpen((current) => (current === piece.term ? null : piece.term!));
            }}
            className={cn(
              "underline decoration-dotted decoration-from-font underline-offset-[3px] transition-colors",
              open === piece.term ? "text-tertiary" : "text-inherit hover:text-tertiary",
              // 종이에서는 점선이 오해를 부른다 — 누를 수 없는 곳이니 평범한 글자로 찍는다
              "print:no-underline",
            )}
          >
            {piece.text}
          </button>
        ) : (
          <span key={index}>{piece.text}</span>
        ),
      )}

      {hasTerms && open && glossary[open] && (
        <span className="mt-1 flex gap-1.5 rounded-md bg-surface-container-lowest px-space-sm py-1.5 font-body-sm text-body-sm text-on-surface-variant print:hidden">
          <span className="shrink-0 font-label-sm text-label-sm text-tertiary">{open}</span>
          <span>{glossary[open]}</span>
        </span>
      )}
    </span>
  );
}
