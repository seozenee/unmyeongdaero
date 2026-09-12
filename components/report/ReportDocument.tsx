"use client";

import { DecadeTimeline } from "@/components/saju/DecadeTimeline";
import { FiveElementsRadar } from "@/components/saju/FiveElementsRadar";
import { FourPillarsChart } from "@/components/saju/FourPillarsChart";
import { GuideAvatar } from "@/components/story/GuideAvatar";
import { Reveal } from "@/components/report/Reveal";
import { Icon } from "@/components/ui/Icon";
import { GuideFigure } from "@/components/webtoon/GuideFigure";
import { SceneBackdrop } from "@/components/webtoon/SceneBackdrop";
import { getWebtoonAsset, WebtoonMedia } from "@/components/webtoon/WebtoonMedia";
import { cn } from "@/lib/cn";
import type { BasisFact } from "@/lib/saju/basis";
import type { DecadeItem, ElementCounts, FourPillarsInput } from "@/lib/saju/modules";
import type { Guide } from "@/lib/story/guides";
import type { StoryPanel, StoryReport, TimelineItem } from "@/lib/story/report";

export interface ReportPanels {
  pillars: FourPillarsInput | null;
  counts: ElementCounts | null;
  decade: { items: DecadeItem[]; direction?: string; currentIndex: number } | null;
}

interface ReportDocumentProps {
  report: StoryReport;
  guide: Guide;
  categoryLabel: string;
  title: string;
  subjectName: string;
  partnerName: string | null;
  issuedAt: string;
  panels: ReportPanels;
  basisFacts: BasisFact[];
  glossary: Record<string, string>;
  disclaimer?: string;
}

const TONE: Record<TimelineItem["tone"], { dot: string; label: string; text: string }> = {
  good: { dot: "bg-tertiary ring-tertiary/30", label: "힘이 실리는 때", text: "text-tertiary" },
  neutral: { dot: "bg-outline ring-outline/30", label: "고르게 흐르는 때", text: "text-on-surface-variant" },
  caution: { dot: "bg-secondary ring-secondary/30", label: "살펴 갈 때", text: "text-secondary" },
};

function Panel({ panel, panels }: { panel: StoryPanel | null; panels: ReportPanels }) {
  if (panel === "pillars" && panels.pillars) return <FourPillarsChart pillars={panels.pillars} />;
  if (panel === "elements" && panels.counts) return <FiveElementsRadar counts={panels.counts} />;
  if (panel === "decade" && panels.decade) {
    return <DecadeTimeline items={panels.decade.items} direction={panels.decade.direction} currentIndex={panels.decade.currentIndex} />;
  }
  return null;
}

export function ReportDocument(props: ReportDocumentProps) {
  const { report, guide, panels } = props;
  const reportText = [report.summary, ...report.sections.flatMap((section) => section.body)].join("\n");
  const usedGlossary = Object.entries(props.glossary).filter(([term]) => reportText.includes(term)).slice(0, 14);
  const usedPanels = new Set(report.sections.map((section) => section.panel));

  return (
    <article className="flex w-full flex-col gap-space-xl pb-space-xl">
      {/* 인쇄 표지 — 종이에서는 어두운 장면 대신 활자 표지 한 장을 쓴다 */}
      <header className="hidden print:flex print:h-[220mm] print:break-after-page print:flex-col print:justify-center print:gap-space-lg">
        <span className="font-label-sm text-label-sm tracking-[0.3em] text-tertiary">UNMYEONGDAERO REPORT</span>
        <div className="flex flex-col gap-space-sm border-y border-outline-variant py-space-xl">
          <span className="font-label-md text-label-md text-secondary">{props.categoryLabel}</span>
          <h1 className="font-headline-xl text-headline-xl tracking-tight text-on-surface">{props.title}</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            {props.subjectName}님{props.partnerName ? ` · ${props.partnerName}님` : ""}을 위한 풀이
          </p>
        </div>
        <dl className="flex flex-col gap-1 font-body-sm text-body-sm text-on-surface-variant">
          <div className="flex gap-space-sm">
            <dt className="w-16 text-outline">풀이</dt>
            <dd>{guide.title}</dd>
          </div>
          <div className="flex gap-space-sm">
            <dt className="w-16 text-outline">발행일</dt>
            <dd>{props.issuedAt}</dd>
          </div>
          <div className="flex gap-space-sm">
            <dt className="w-16 text-outline">발행</dt>
            <dd>운명대로 · unmyeongdaero.com</dd>
          </div>
        </dl>
      </header>

      {/* 표지 */}
      <header className="relative -mx-margin h-[26rem] overflow-hidden print:hidden">
        {getWebtoonAsset(guide.id, "report-cover") ? (
          <WebtoonMedia asset={getWebtoonAsset(guide.id, "report-cover")!} still />
        ) : (
          <>
            <SceneBackdrop theme={guide.id} camera="wide" />
            <div className="absolute -right-6 bottom-0 h-[78%] opacity-90">
              <GuideFigure guide={guide} />
            </div>
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/70 to-surface/10" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-margin pt-space-md">
          <span className="font-label-sm text-label-sm tracking-[0.3em] text-tertiary">UNMYEONGDAERO REPORT</span>
          <span className="flex h-12 w-12 rotate-[-8deg] items-center justify-center rounded-sm border-2 border-secondary-container font-label-sm text-[10px] font-bold leading-tight text-secondary-container">
            운명
            <br />
            대로
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-space-sm px-margin pb-space-lg">
          <span className="font-label-md text-label-md text-secondary">{props.categoryLabel}</span>
          <h1 className="font-headline-xl-mobile text-headline-xl-mobile tracking-tight text-on-surface">{props.title}</h1>
          <p className="font-label-md text-label-md text-on-surface-variant">
            {props.subjectName}님{props.partnerName ? ` · ${props.partnerName}님` : ""}을 위한 풀이 · {props.issuedAt}
          </p>
          <div className="flex items-center gap-space-xs">
            <GuideAvatar guide={guide} size="sm" />
            <span className="font-label-sm text-label-sm text-outline">풀이 · {guide.title}</span>
          </div>
        </div>
      </header>

      {/* 한 줄 결론 */}
      <Reveal className="flex flex-col gap-space-md rounded-xl bg-surface-container-low p-space-lg">
        <Icon name="format_quote" filled className="text-[32px] text-tertiary" />
        <p className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">{report.headline}</p>
        <p className="font-body-lg text-body-lg leading-relaxed text-on-surface-variant">{report.summary}</p>
        <div className="flex flex-wrap gap-space-xs">
          {report.keywords.map((keyword) => (
            <span key={keyword} className="rounded-full bg-primary/15 px-space-sm py-1 font-label-md text-label-md text-primary">
              #{keyword}
            </span>
          ))}
        </div>
      </Reveal>

      {/* 목차 */}
      <Reveal className="flex flex-col gap-space-sm rounded-xl bg-surface-container p-space-lg">
        <span className="font-label-sm text-label-sm tracking-widest text-outline">CONTENTS</span>
        <ol className="flex flex-col">
          {report.sections.map((section, index) => (
            <li key={section.title}>
              <a href={`#section-${index + 1}`} className="flex items-baseline gap-space-sm border-b border-outline-variant/30 py-2.5 last:border-0">
                <span className="font-label-md text-label-md text-tertiary">{String(index + 1).padStart(2, "0")}</span>
                <span className="flex-1 font-body-md text-body-md text-on-surface">{section.title}</span>
                <Icon name="south" className="text-[14px] text-outline" />
              </a>
            </li>
          ))}
          <li>
            <a href="#timeline" className="flex items-baseline gap-space-sm py-2.5">
              <span className="font-label-md text-label-md text-tertiary">＋</span>
              <span className="flex-1 font-body-md text-body-md text-on-surface">시기표 · 실천 가이드</span>
            </a>
          </li>
        </ol>
      </Reveal>

      {/* 본문 */}
      {report.sections.map((section, index) => (
        <Reveal key={section.title} as="section" id={`section-${index + 1}`} className="flex scroll-mt-20 flex-col gap-space-md">
          <div className="flex items-end gap-space-sm border-b border-outline-variant/40 pb-space-sm">
            <span className="font-headline-xl text-headline-xl font-bold leading-none text-outline-variant">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h2 className="pb-1 font-headline-md text-headline-md text-on-surface">{section.title}</h2>
          </div>
          <p className="border-l-2 border-primary pl-space-md font-body-lg text-body-lg font-semibold leading-relaxed text-primary">
            {section.lead}
          </p>
          {section.body.map((paragraph, paragraphIndex) => (
            <p key={paragraphIndex} className="font-body-lg text-body-lg leading-[1.85] text-on-surface">
              {paragraph}
            </p>
          ))}
          <Panel panel={section.panel} panels={panels} />
          {section.evidence.length > 0 && (
            <aside className="flex flex-col gap-space-sm rounded-lg bg-surface-container-high p-space-md print:break-inside-avoid">
              <span className="flex items-center gap-1 font-label-sm text-label-sm tracking-wider text-tertiary">
                <Icon name="fact_check" className="text-[15px]" /> 명리 근거
              </span>
              <ul className="flex flex-col gap-space-sm">
                {section.evidence.map((item) => (
                  <li key={item.label} className="flex flex-col gap-0.5">
                    <span className="font-label-md text-label-md text-on-surface">{item.label}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{item.detail}</span>
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </Reveal>
      ))}

      {/* 보고서에서 쓰이지 않은 명식 자료는 부록으로 */}
      {(!usedPanels.has("pillars") || !usedPanels.has("elements")) && (panels.pillars || panels.counts) && (
        <Reveal className="flex flex-col gap-space-md">
          <span className="font-label-sm text-label-sm tracking-widest text-outline">APPENDIX · 나의 명식</span>
          {!usedPanels.has("pillars") && <Panel panel="pillars" panels={panels} />}
          {!usedPanels.has("elements") && <Panel panel="elements" panels={panels} />}
        </Reveal>
      )}

      {/* 시기표 */}
      <Reveal as="section" id="timeline" className="flex scroll-mt-20 flex-col gap-space-md rounded-xl bg-surface-container p-space-lg">
        <div className="flex items-center justify-between">
          <h2 className="font-headline-md text-headline-md text-on-surface">흐름 시기표</h2>
          <Icon name="event_note" className="text-[22px] text-tertiary" />
        </div>
        <ol className="relative flex flex-col gap-space-lg pl-space-lg before:absolute before:bottom-2 before:left-[5px] before:top-2 before:w-px before:bg-outline-variant">
          {report.timeline.map((item) => (
            <li key={`${item.period}-${item.title}`} className="relative flex flex-col gap-1">
              <span className={cn("absolute -left-space-lg top-1.5 h-[11px] w-[11px] rounded-full ring-4", TONE[item.tone].dot)} />
              <span className="font-label-sm text-label-sm text-outline">
                {item.period} · <span className={TONE[item.tone].text}>{TONE[item.tone].label}</span>
              </span>
              <span className="font-label-md text-label-md text-on-surface">{item.title}</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">{item.note}</span>
            </li>
          ))}
        </ol>
      </Reveal>

      {/* 실천 가이드 */}
      <Reveal className="grid grid-cols-1 gap-space-sm">
        <div className="flex flex-col gap-space-sm rounded-xl bg-surface-container p-space-lg print:break-inside-avoid">
          <span className="flex items-center gap-1.5 font-label-md text-label-md text-primary">
            <Icon name="check_circle" className="text-[18px]" /> 해 보면 좋은 것
          </span>
          <ul className="flex flex-col gap-space-sm">
            {report.actions.do.map((action) => (
              <li key={action} className="flex gap-space-sm font-body-md text-body-md text-on-surface">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {action}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-space-sm rounded-xl bg-surface-container p-space-lg print:break-inside-avoid">
          <span className="flex items-center gap-1.5 font-label-md text-label-md text-secondary">
            <Icon name="do_not_disturb_on" className="text-[18px]" /> 피하면 좋은 것
          </span>
          <ul className="flex flex-col gap-space-sm">
            {report.actions.avoid.map((action) => (
              <li key={action} className="flex gap-space-sm font-body-md text-body-md text-on-surface">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
                {action}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>

      {/* 마무리 */}
      <Reveal className="flex flex-col items-center gap-space-md rounded-xl bg-surface-container-low p-space-lg text-center print:break-inside-avoid">
        <GuideAvatar guide={guide} size="lg" />
        <p className="font-body-lg text-body-lg leading-relaxed text-on-surface">{report.closing}</p>
        <span className="font-label-sm text-label-sm text-outline">— {guide.title}</span>
      </Reveal>

      <details className="group rounded-xl bg-surface-container p-space-lg">
        <summary className="flex cursor-pointer list-none items-center justify-between font-label-md text-label-md text-on-surface-variant">
          <span className="flex items-center gap-1.5">
            <Icon name="menu_book" className="text-[18px] text-tertiary" /> 명식 요약 · 용어 풀이
          </span>
          <Icon name="expand_more" className="text-[20px] transition-transform group-open:rotate-180" />
        </summary>
        <dl className="mt-space-md flex flex-col gap-1.5">
          {props.basisFacts.map((fact) => (
            <div key={fact.label} className="flex gap-space-sm font-body-sm text-body-sm">
              <dt className="w-16 shrink-0 text-outline">{fact.label}</dt>
              <dd className="text-on-surface-variant">{fact.value}</dd>
            </div>
          ))}
        </dl>
        {usedGlossary.length > 0 && (
          <dl className="mt-space-md flex flex-col gap-1.5 border-t border-outline-variant/40 pt-space-sm">
            {usedGlossary.map(([term, meaning]) => (
              <div key={term} className="font-body-sm text-body-sm">
                <dt className="inline font-semibold text-tertiary">{term}</dt>
                <dd className="inline text-on-surface-variant"> — {meaning}</dd>
              </div>
            ))}
          </dl>
        )}
      </details>

      <p className="rounded-lg bg-surface-container-low p-space-sm text-center font-label-sm text-label-sm text-outline">
        참고용 콘텐츠입니다 · 명리 계산을 바탕으로 한 해석이며 미래를 단정하지 않습니다.
        {props.disclaimer ? ` ${props.disclaimer}` : ""}
      </p>

      {/* 인쇄본 발행 정보 */}
      <footer className="hidden print:flex print:flex-col print:gap-1 print:border-t print:border-outline-variant print:pt-space-sm">
        <span className="font-label-sm text-label-sm text-outline">
          운명대로 · unmyeongdaero.com · {props.issuedAt} 발행 · {props.subjectName}님 소장본
        </span>
        <span className="font-label-sm text-label-sm text-outline">
          이 문서는 구매자 본인을 위해 발행되었습니다. 재판매·재배포를 금합니다.
        </span>
      </footer>
    </article>
  );
}
