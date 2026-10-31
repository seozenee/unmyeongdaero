"use client";

import { DecadeTimeline } from "@/components/saju/DecadeTimeline";
import { FiveElementsRadar } from "@/components/saju/FiveElementsRadar";
import { FourPillarsChart } from "@/components/saju/FourPillarsChart";
import { YearFlowTable } from "@/components/saju/YearFlowTable";
import { GuideAvatar } from "@/components/story/GuideAvatar";
import { GlossaryText } from "@/components/report/GlossaryText";
import { Reveal } from "@/components/report/Reveal";
import { Icon } from "@/components/ui/Icon";
import { ReadingProgress } from "./ReadingProgress";
import { WebtoonMedia } from "@/components/webtoon/WebtoonMedia";
import { getWebtoonAsset } from "@/components/webtoon/assets";
import { cn } from "@/lib/cn";
import type { BasisFact } from "@/lib/saju/basis";
import type { DecadeItem, ElementCounts, FourPillarsInput, YearItem } from "@/lib/saju/modules";
import type { Guide } from "@/lib/story/guides";
import type { StoryPanel, StoryReport, TimelineItem } from "@/lib/story/report";

export interface ReportPanels {
  pillars: FourPillarsInput | null;
  counts: ElementCounts | null;
  decade: { items: DecadeItem[]; direction?: string; currentIndex: number } | null;
  years: { items: YearItem[]; currentYear: number } | null;
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
  if (panel === "years" && panels.years) {
    return <YearFlowTable items={panels.years.items} currentYear={panels.years.currentYear} />;
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
      <ReadingProgress />
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
        {getWebtoonAsset(guide.id, "report-cover") && (
          <WebtoonMedia asset={getWebtoonAsset(guide.id, "report-cover")!} still />
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

      {/*
        ─ 한 줄 결론 ─

        큰 따옴표 하나를 얹어 두었는데, 정작 제일 큰 글씨여야 할 결론이 따옴표보다
        작게 보였다. 돈을 내고 받은 글에서 가장 먼저 읽혀야 하는 한 줄이다.
        라벨을 작게 깔고 결론을 간판만큼 키운다.
      */}
      <Reveal className="head-rule flex flex-col gap-space-md rounded-xl bg-surface-container-low p-space-lg">
        <span className="font-label-sm text-label-sm font-bold tracking-[0.14em] text-[rgb(var(--accent))]">
          결론
        </span>
        <p className="text-[1.75rem] font-extrabold leading-[1.3] tracking-[-0.03em] text-on-surface">
          {report.headline}
        </p>
        <p className="font-body-lg text-body-lg leading-relaxed text-on-surface-variant">{report.summary}</p>
        <div className="flex flex-wrap gap-space-xs">
          {report.keywords.map((keyword) => (
            <span
              key={keyword}
              className="rounded-full border border-[rgb(var(--accent)/0.45)] bg-[rgb(var(--accent)/0.14)] px-space-sm py-1 font-label-md text-label-md text-on-surface"
            >
              #{keyword}
            </span>
          ))}
        </div>
      </Reveal>

      {/* 목차 */}
      <Reveal className="flex flex-col gap-space-sm rounded-xl bg-surface-container p-space-lg">
        <span className="toc-eyebrow font-label-sm text-label-sm font-bold tracking-[0.14em] text-[rgb(var(--accent))]">
          목차
        </span>
        <h2 className="toc-title text-[1.45rem] font-extrabold leading-[1.35] tracking-[-0.02em] text-on-surface">
          이 글은 이렇게 갑니다
        </h2>
        <span aria-hidden className="toc-rule h-px w-full bg-[linear-gradient(90deg,rgb(var(--accent)/0.9),transparent)]" />
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
          <div className="head-rule flex flex-col gap-1">
            <span className="font-label-sm text-label-sm font-bold tracking-[0.14em] text-[rgb(var(--accent))]">
              {String(index + 1).padStart(2, "0")} · {props.categoryLabel}
            </span>
            <h2 className="text-[1.45rem] font-extrabold leading-[1.35] tracking-[-0.02em] text-on-surface">
              {section.title}
            </h2>
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
            <aside className="flex flex-col gap-space-md rounded-xl border border-[rgb(var(--accent)/0.3)] bg-surface-container-high p-space-lg print:break-inside-avoid">
              <span className="flex items-center gap-1.5 font-label-sm text-label-sm font-bold tracking-[0.14em] text-[rgb(var(--accent))]">
                <Icon name="fact_check" className="text-[15px]" /> 이 말이 어디서 나왔냐면
              </span>
              <ul className="flex flex-col gap-space-md">
                {section.evidence.map((item) => (
                  <li key={item.label} className="flex gap-space-sm">
                    <span
                      aria-hidden
                      className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-[rgb(var(--accent))]"
                    />
                    <div className="flex min-w-0 flex-col gap-1">
                      <GlossaryText
                        text={item.label}
                        glossary={props.glossary}
                        className="text-[1.02rem] font-bold leading-snug tracking-tight text-on-surface"
                      />
                      <span className="font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
                        {item.detail}
                      </span>
                    </div>
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
          <div className="head-rule flex flex-col gap-1">
            <span className="font-label-sm text-label-sm font-bold tracking-[0.14em] text-[rgb(var(--accent))]">
              부록
            </span>
            <h2 className="text-[1.45rem] font-extrabold leading-[1.35] tracking-[-0.02em] text-on-surface">
              내 여덟 글자
            </h2>
          </div>
          {!usedPanels.has("pillars") && <Panel panel="pillars" panels={panels} />}
          {!usedPanels.has("elements") && <Panel panel="elements" panels={panels} />}
        </Reveal>
      )}

      {/* 시기표 */}
      <Reveal as="section" id="timeline" className="flex scroll-mt-20 flex-col gap-space-md rounded-xl bg-surface-container p-space-lg">
        <div className="head-rule flex items-start justify-between gap-space-sm">
          <div className="flex flex-col gap-1">
            <span className="font-label-sm text-label-sm font-bold tracking-[0.14em] text-[rgb(var(--accent))]">
              시기
            </span>
            <h2 className="text-[1.45rem] font-extrabold leading-[1.35] tracking-[-0.02em] text-on-surface">
              흐름 시기표
            </h2>
          </div>
          <Icon name="event_note" className="mt-0.5 shrink-0 text-[22px] text-[rgb(var(--accent))]" />
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
        명리 계산을 바탕으로 읽은 풀이입니다 · 열람 기간 12개월
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
