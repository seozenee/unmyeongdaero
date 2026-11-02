"use client";

import { useEffect, useRef, useState } from "react";
import { GuideAvatar } from "@/components/story/GuideAvatar";
import { Icon } from "@/components/ui/Icon";
import { buildBookPages } from "@/lib/story/book";
import { readableSourceNames } from "@/lib/story/sanitize";
import { ReadingCard } from "./ReadingCard";
import { ReadingCardBasis } from "./ReadingCardBasis";
import { ReadingProse } from "./ReadingProse";
import { ReadingDiagram } from "./ReadingDiagram";
import { FourPillarsChart } from "@/components/saju/FourPillarsChart";
import { FiveElementsRadar } from "@/components/saju/FiveElementsRadar";
import type { ReportDocumentProps } from "./ReportDocument";

/** PDF를 넘기듯 한 주제씩 읽는다. 각 페이지에서는 전체 설명을 이어서 보여 준다. */
export function CardReportReader(props: ReportDocumentProps) {
  const report = readableSourceNames(props.report);
  const [position, setPosition] = useState(0);
  const [largeText, setLargeText] = useState(false);
  const storageKey = props.readingId ? `reading-position:v1:${props.readingId}` : null;
  const pageCount = useRef(0);
  const restored = useRef<string | null>(null);
  const cards = buildBookPages(report.sections, {
    chart: Boolean(props.panels.pillars || props.panels.counts),
    benefactor: Boolean(props.timingWindows?.benefactor.length),
    partnership: Boolean(props.timingWindows?.partnership.length),
  });
  pageCount.current = cards.length;
  useEffect(() => {
    setPosition(0);
    restored.current = storageKey;
    if (!storageKey) return;
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null");
      if (Number.isInteger(saved?.page) && saved.page >= 0 && saved.page < pageCount.current) setPosition(saved.page);
    } catch { /* 저장 공간을 쓸 수 없어도 읽기는 계속한다. */ }
  }, [storageKey]);
  const active = cards[Math.min(position, cards.length - 1)]!;
  const section = active.sectionIndex === undefined ? null : report.sections[active.sectionIndex];
  const touch = useRef<{ x: number; y: number } | null>(null);
  const move = (next: number) => {
    const page = Math.max(0, Math.min(next, cards.length - 1));
    setPosition(page);
    if (storageKey && restored.current === storageKey) {
      try { localStorage.setItem(storageKey, JSON.stringify({ page })); } catch { /* 읽기 유지 */ }
    }
  };
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [position]);
  const timingWindows = section && /귀인/.test(section.title) ? props.timingWindows?.benefactor
    : section && /연애|배우자|인연/.test(section.title) ? props.timingWindows?.partnership : undefined;
  const currentYear = Number(new Intl.DateTimeFormat("en", { timeZone: "Asia/Seoul", year: "numeric" }).format(new Date()));
  const upcoming = report.timeline.filter(item => Number(item.period.match(/\d{4}/)?.[0] ?? currentYear) >= currentYear);
  const menu = <label className="reading-book-menu"><Icon name="menu" className="text-[25px]" /><span className="sr-only">목차에서 읽을 이야기 선택</span>
    <select value={position} onChange={event => move(Number(event.target.value))}>{cards.map((card, index) => <option key={card.id} value={index}>{card.label}{card.kind === "chapter" ? " · 장 표지" : ""}</option>)}</select>
  </label>;

  return <article className={`reading-document reading-card-reader reading-book-reader${largeText ? " reading-large-text" : ""}`}
    onKeyDown={event => {
      if ((event.target as Element).closest("input,select,textarea,button,a,summary") || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); move(position + (event.key === "ArrowRight" ? 1 : -1)); }
    }} tabIndex={0}
    onTouchStart={event => {
      touch.current = null;
      if (event.touches.length !== 1 || (event.target as Element).closest("button,a,input,select,textarea,summary,[data-book-ignore-swipe]")) return;
      touch.current = { x: event.touches[0]!.clientX, y: event.touches[0]!.clientY };
    }}
    onTouchEnd={event => {
      const start = touch.current; touch.current = null;
      if (!start || !event.changedTouches[0]) return;
      const dx = event.changedTouches[0].clientX - start.x;
      const dy = event.changedTouches[0].clientY - start.y;
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) move(position + (dx < 0 ? 1 : -1));
    }} onTouchCancel={() => { touch.current = null; }}>
    {active.kind === "cover" ? <div className="reading-book-floating-menu">{menu}</div> : <header className="flex items-center gap-3 py-2">
      <GuideAvatar guide={props.guide} size="sm" />
      <div className="min-w-0 flex-1"><h1 className="text-lg font-bold text-on-surface">{props.title}</h1><p className="text-xs leading-relaxed text-on-surface-variant">{props.subjectName}님{props.partnerName ? ` · ${props.partnerName}님` : ""}의 풀이 · {props.issuedAt}</p></div>
      {menu}
    </header>}
    <div className="reading-reader-tools" data-book-ignore-swipe>
      <span>{position > 0 ? `${Math.round(position / (cards.length - 1) * 100)}% 읽었어요` : "한 장씩, 나를 알아가는 시간"}</span>
      <button type="button" aria-pressed={largeText} onClick={() => setLargeText(value => !value)}>가 {largeText ? "기본 글씨" : "큰 글씨"}</button>
    </div>
    <div className="reading-reader-progress" role="progressbar" aria-label="풀이 읽기 진행률" aria-valuemin={0} aria-valuemax={cards.length - 1} aria-valuenow={position}><span style={{ width: `${position / (cards.length - 1) * 100}%` }} /></div>
    <div key={active.id} className="motion-safe:animate-fade-up" role="region" aria-label={active.label}>
      {active.kind === "cover" ? <section className="reading-book-cover" aria-label="이름 표지"><h1>{props.subjectName}</h1></section>
      : active.kind === "chapter" ? <section className="reading-book-chapter"><Icon name={active.icon} className="book-chapter-symbol" /><span>CHAPTER</span><h2>{active.label}</h2></section>
      : section ? <ReadingCard section={section} index={active.sectionIndex!} timingWindows={timingWindows} diagram={<ReadingDiagram section={section} panels={props.panels} windows={timingWindows} />}>
        <ReadingCardBasis section={section} glossary={props.glossary} />
      </ReadingCard> : <section className="reading-card reading-book-page">
        <div className="reading-card-topic"><Icon name={active.icon} className="text-[18px]" />{active.label}</div>
        {active.kind === "opening" && <>
          <h2 className="reading-card-title">{props.subjectName}님께 드리는 첫 이야기</h2>
          <p className="reading-book-lead">{report.headline}</p>
          <ReadingProse text={report.summary} />
          <div className="flex flex-wrap gap-2">{report.keywords.map(keyword => <span key={keyword} className="reading-card-keyword">#{keyword}</span>)}</div>
        </>}
        {active.kind === "chart" && <>
          <h2 className="reading-card-title">나의 사주</h2>
          <div className="reading-book-data" data-book-ignore-swipe>
            {props.panels.pillars && <FourPillarsChart pillars={props.panels.pillars} />}
            {props.panels.counts && <FiveElementsRadar counts={props.panels.counts} />}
          </div>
          <dl className="flex flex-col gap-3">{props.basisFacts.map(fact => <div key={fact.label} className="flex gap-3 text-sm leading-relaxed"><dt className="w-16 shrink-0 text-on-surface-variant">{fact.label}</dt><dd className="text-on-surface">{fact.value}</dd></div>)}</dl>
        </>}
        {active.id === "timing" && <>
          <h2 className="reading-card-title">언제 힘을 쓰고, 언제 쉬어 갈까요?</h2>
          {upcoming.length === 0 && <p className="text-sm leading-relaxed text-on-surface-variant">현재 이후로 확인된 시기 정보가 없어요. 각 장의 해석과 선택 기준을 중심으로 읽어 주세요.</p>}
          <ol className="flex flex-col gap-4">{upcoming.map(item => <li key={`${item.period}-${item.title}`} className="reading-card-paragraph"><strong className="reading-timing-label">{item.period}</strong><p className="mt-2 text-base font-semibold text-on-surface">{item.title}</p><ReadingProse text={item.note} /></li>)}</ol>
        </>}
        {(active.id === "benefactor" || active.id === "partnership") && <>
          <h2 className="reading-card-title">{active.label}</h2>
          <ol className="flex flex-col gap-5">{(active.id === "benefactor" ? props.timingWindows?.benefactor : props.timingWindows?.partnership)?.map(window => <li key={window.period} className="reading-card-dates"><strong>{window.period}</strong><p className="text-sm text-on-surface-variant">{window.monthly ? "해당 달의 절기가 시작된 뒤" : "그해 입춘 이후의 흐름"}</p></li>)}</ol>
          <div className="reading-book-prose">
            <ReadingProse text={active.id === "benefactor" ? "귀인운은 누군가가 대신 인생을 바꿔 준다는 뜻보다, 사람을 통해 막힌 일의 실마리를 찾는 때로 읽습니다. 필요한 조언을 듣거나, 소개를 통해 접점이 생기거나, 두 사람 사이의 엇갈림을 누군가가 풀어 주는 모습과 연결해 보는 운입니다." : "인연의 시기는 새로운 사람과 만나는 일뿐 아니라 이미 가까운 관계가 한 단계 깊어지는 때도 함께 봅니다. 만남이 시작되는 모습과 오래 편안하게 지내는 모습은 다를 수 있어, 시기와 상대를 고르는 기준을 함께 읽는 것이 중요합니다."} />
            <ReadingProse text={active.id === "benefactor" ? "위 시기는 태어난 날의 글자를 기준으로 보는 귀인 자리와, 해 또는 달에 들어오는 글자가 겹친 때입니다. 같은 시기에 가까운 사이의 부딪힘을 읽는 단서도 있으면, 도움의 내용과 관계의 긴장을 함께 살펴봅니다." : "위 시기는 배우자를 뜻하는 기운, 가장 가까운 관계를 보는 자리 등 서로 다른 인연의 단서가 함께 겹친 기간입니다. 상대를 만나는 때와 관계가 자리를 잡는 과정까지 함께 살펴볼 만한 시기입니다."} />
            <ReadingProse text="월이 표시된 시기는 그달의 절기가 시작된 뒤를 기준으로 봅니다. 연도만 표시된 곳은 그해의 전체적인 관계 흐름을 살피는 뜻입니다. 조언이나 소개를 받는 방식, 가까운 사람과 약속을 정하는 모습이 어떻게 달라지는지 눈여겨보세요." />
          </div>
        </>}
        {active.id === "actions" && <>
          <h2 className="reading-card-title">오늘은 이것부터 해 보세요</h2>
          <div className="reading-card-paragraph"><h3 className="reading-timing-label">해 보면 좋은 것</h3><div className="reading-book-prose">{report.actions.do.map(action => <ReadingProse key={action} text={action} />)}</div></div>
          <div className="reading-card-paragraph"><h3 className="reading-timing-label">피하면 좋은 것</h3><div className="reading-book-prose">{report.actions.avoid.map(action => <ReadingProse key={action} text={action} />)}</div></div>
        </>}
        {active.id === "closing" && <>
          <h2 className="reading-card-title">{props.guide.name}의 마지막 한마디</h2>
          <ReadingProse text={report.closing} />
          <p className="text-xs leading-relaxed text-on-surface-variant">명리 계산을 바탕으로 읽은 풀이입니다. {props.disclaimer}</p>
        </>}
      </section>}
    </div>
    <nav className="reading-book-pager" aria-label="풀이 페이지 넘기기">
      <button type="button" aria-label="이전 페이지" disabled={position === 0} onClick={() => move(position - 1)}><Icon name="chevron_left" className="text-[28px]" /></button>
      <span aria-label={`현재 ${position + 1}페이지, 전체 ${cards.length}페이지`}>{position + 1} / {cards.length}</span>
      <button type="button" aria-label="다음 페이지" disabled={position === cards.length - 1} onClick={() => move(position + 1)}><Icon name="chevron_right" className="text-[28px]" /></button>
    </nav>
  </article>;
}
