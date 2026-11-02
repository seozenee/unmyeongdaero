import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import type { ReadingCardWindow } from "@/lib/story/cards";
import type { ReportSection } from "@/lib/story/report";
import { ReadingProse } from "./ReadingProse";

/** 한 주제를 책의 한 페이지로 읽는다. 본문은 생략하거나 접지 않는다. */
export function ReadingCard({ section, index, children, timingWindows }: { section: ReportSection; index: number; children: ReactNode; timingWindows?: ReadingCardWindow[] }) {
  return <section id={`section-${index + 1}`} className="reading-card reading-book-page scroll-mt-36">
    <h2 className="reading-card-title">{section.title}</h2>
    {Boolean(timingWindows?.length) && <div className="reading-card-dates">
      <span className="reading-timing-label">가장 가까운 시기</span>
      <strong>{timingWindows![0]!.period}</strong>
      <span className="text-xs text-on-surface-variant">{timingWindows![0]!.monthly ? "그달의 절기가 시작된 뒤" : "그해 입춘 이후"}</span>
      {timingWindows!.length > 1 && <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">이어서 {timingWindows!.slice(1).map(window => window.period).join(" · ")}</p>}
    </div>}
    <p className="reading-book-lead">{section.lead}</p>
    <div className="reading-book-prose">{section.body.map((paragraph, paragraphIndex) => <ReadingProse key={paragraphIndex} text={paragraph} opening={paragraphIndex === 0} />)}</div>
    {children && <details className="reading-card-basis">
      <summary><span className="flex items-center gap-2"><Icon name="fact_check" className="text-[17px]" />왜 이렇게 풀이했을까요?</span><Icon name="expand_more" className="reading-card-chevron text-[20px]" /></summary>
      <div className="flex flex-col gap-5 pt-5">{children}</div>
    </details>}
  </section>;
}
