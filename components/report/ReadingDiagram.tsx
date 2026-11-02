import { DecadeTimeline } from "@/components/saju/DecadeTimeline";
import { YearFlowTable } from "@/components/saju/YearFlowTable";
import type { ReadingCardWindow } from "@/lib/story/cards";
import type { ReportSection } from "@/lib/story/report";
import type { ReportPanels } from "./ReportDocument";

const ELEMENTS = [
  { key: "wood", label: "목 · 나무", color: "#d9b968" },
  { key: "fire", label: "화 · 불", color: "#d87d70" },
  { key: "earth", label: "토 · 흙", color: "#b88d6c" },
  { key: "metal", label: "금 · 쇠", color: "#b7bbbf" },
  { key: "water", label: "수 · 물", color: "#81a5cf" },
] as const;

/** 수치와 날짜는 저장된 계산값만 그린다. 능력·수익·만남 확률로 바꾸지 않는다. */
export function ReadingDiagram({ section, panels, windows }: { section: ReportSection; panels: ReportPanels; windows?: ReadingCardWindow[] }) {
  if (windows?.length) return <figure className="reading-book-figure" data-book-ignore-swipe>
    <figcaption>{/귀인/.test(section.title) ? "사람의 도움을 살펴볼 시기" : "인연의 단서가 겹치는 시기"}</figcaption>
    <ol className="book-people-timeline">{windows.map(window => <li key={window.period}><span aria-hidden className="book-timeline-dot" /><strong>{window.period}</strong><span>{window.monthly ? "그달의 절기가 시작된 뒤" : "그해 입춘 이후의 흐름"}</span></li>)}</ol>
    <p>원국과 이 시기의 글자를 함께 읽은 흐름입니다.</p>
  </figure>;
  if (panels.counts && (section.panel === "elements" || section.panel === "pillars" || /어떤 사람|타고난 그릇|타고난 기질/.test(section.title))) {
    const counts = panels.counts;
    const max = Math.max(...ELEMENTS.map(element => counts[element.key]), 1);
    const total = ELEMENTS.reduce((sum, element) => sum + counts[element.key], 0);
    return <figure className="reading-book-figure" data-book-ignore-swipe>
      <figcaption>타고난 다섯 기운을 한눈에</figcaption>
      <svg viewBox="0 0 320 218" role="img" aria-label={ELEMENTS.map(element => `${element.label} ${counts[element.key]}`).join(", ")}>
        {ELEMENTS.map((element, index) => <g key={element.key} transform={`translate(0 ${index * 41 + 7})`}>
          <text x="0" y="21" fill="#ddd8d1" fontSize="14">{element.label}</text>
          <rect x="85" y="4" width="198" height="23" rx="5" fill="#ffffff0b" />
          {counts[element.key] > 0 && <rect x="85" y="4" width={counts[element.key] / max * 198} height="23" rx="5" fill={element.color} />}
          <text x="309" y="21" textAnchor="end" fill="#f5ece1" fontSize="15" fontWeight="600">{counts[element.key]}</text>
        </g>)}
      </svg>
      <p>원국 {total}글자의 분포입니다. 기운의 많고 적음을 함께 봅니다.</p>
    </figure>;
  }
  if (panels.decade && (section.panel === "decade" || /지나온 시간|열 해마다|전환점/.test(section.title))) return <figure className="reading-book-figure" data-book-ignore-swipe>
    <figcaption>삶의 배경이 바뀌는 큰 흐름</figcaption><DecadeTimeline {...panels.decade} /><p>가로로 넘겨 앞뒤의 흐름을 함께 볼 수 있어요.</p>
  </figure>;
  if (panels.years && section.panel === "years") return <figure className="reading-book-figure" data-book-ignore-swipe><figcaption>해마다 달라지는 흐름</figcaption><YearFlowTable {...panels.years} /></figure>;
  const money = /재물|돈/.test(section.title);
  const work = /사업|간판|밑에서/.test(section.title);
  if (!money && !work) return null;
  const labels = money ? ["들어오는 길", "나누는 몫", "손에 남는 것"] : ["만드는 일", "전달하는 일", "보상받는 일"];
  return <figure className="reading-book-figure" data-book-ignore-swipe><figcaption>{money ? "재물을 읽는 세 가지 관점" : "일의 방식을 살펴보는 순서"}</figcaption><div className="book-flow-diagram">{labels.map((label, index) => <div key={label}><span>{label}</span>{index < labels.length - 1 && <i aria-hidden>→</i>}</div>)}</div><p>{money ? "얼마를 버는지와 어떻게 남기는지는 함께 살펴야 해요." : "각 과정에서 내 장점이 살아나는 자리를 읽어 봅니다."}</p></figure>;
}
