import { Fragment, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import type { ReadingCardWindow } from "@/lib/story/cards";
import type { ReportSection } from "@/lib/story/report";
import { ReadingProse } from "./ReadingProse";

/** 한 주제를 책의 한 페이지로 읽는다. 본문은 생략하거나 접지 않는다. */
export function ReadingCard({ section, index, children, timingWindows, diagram }: { section: ReportSection; index: number; children: ReactNode; timingWindows?: ReadingCardWindow[]; diagram?: ReactNode }) {
  return <section id={`section-${index + 1}`} className="reading-card reading-book-page scroll-mt-36">
    <h2 className="reading-card-title">{section.title}</h2>
    {Boolean(timingWindows?.length) && <p className="reading-book-dates-note">살펴볼 시기 · {timingWindows!.map(window => window.period).join(" · ")}</p>}
    <p className="reading-book-lead">{section.lead}</p>
    <div className="reading-book-prose">{section.body.map((paragraph, paragraphIndex) => <Fragment key={paragraphIndex}><ReadingProse text={paragraph} opening={paragraphIndex === 0} />{paragraphIndex === Math.min(1, section.body.length - 1) && diagram}</Fragment>)}</div>
    {children && <details className="reading-card-basis">
      <summary><span className="flex items-center gap-2"><Icon name="fact_check" className="text-[17px]" />왜 이렇게 풀이했을까요?</span><Icon name="expand_more" className="reading-card-chevron text-[20px]" /></summary>
      <div className="flex flex-col gap-5 pt-5">{children}</div>
    </details>}
  </section>;
}
