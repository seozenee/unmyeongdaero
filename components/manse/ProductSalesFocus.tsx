"use client";
import type { PreviewContext, PreviewReading } from "@/lib/manse/preview";
import { salesFocusFor } from "@/lib/reports/sales-focus";
import { SalesCard, SalesChapter, SalesLockNote, SalesMosaic, SalesSay } from "./CinematicSales";

export function ProductSalesFocus({context,narrative}:{context:PreviewContext;narrative:PreviewReading}) {
 const focus=salesFocusFor(context,narrative);
 const blunt=context.speech === "반말";
 const person=context.child ? `${context.name}의` : blunt ? context.name : `${context.name}님,`;
 return <>
  <SalesChapter title={context.product}/>
  <SalesSay>{person}<br/><em>{focus.opening}</em></SalesSay>
  <SalesCard seal="方向" title={focus.turn}>
   <p className="ds-emphasis">{focus.preview.lead}</p>
   <p>{focus.preview.body[0]}</p>
   {context.partnerName && <p className="ds-question">{context.name}님과 {context.partnerName}님의 명식을 함께 읽고 있어요.</p>}
   {context.crossSummary && <p>{context.crossSummary}</p>}
   <details className="ds-evidence"><summary>이 사주에서 읽은 근거</summary>{focus.facts.map(fact=><p key={fact.id}><b>{fact.label}</b><br/>{fact.note}</p>)}</details>
  </SalesCard>
  <SalesCard seal="選擇" title="지금 해 볼 일과 조심할 선택">
   <p className="ds-question">{blunt ? "지금은 이렇게 해 봐" : "지금은 이렇게 해 보세요"}</p><p>{focus.action}</p>
   <p className="ds-question">{blunt ? "이 선택은 한 번 더 확인해" : "이 선택은 한 번 더 확인하세요"}</p><p>{focus.caution}</p>
  </SalesCard>
  {context.months.length>0 && <SalesCard seal="時機" title={focus.focus==="year" ? "열두 달, 같은 속도로 움직일 필요는 없어요" : "앞으로 눈여겨볼 시간"}>
   {focus.good && <><p className="ds-date-hint">{focus.good.period} · 시도와 준비에 힘을 쓸 때</p><p>{focus.good.note}</p></>}
   {focus.careful && <><p className="ds-date-hint">{focus.careful.period} · 계획과 부담을 점검할 때</p><p>{focus.careful.note}</p></>}
   {!focus.good && !focus.careful && <p>당장 한 달을 길흉으로 나누기보다, 계획을 작게 시험하고 반응을 확인하는 흐름부터 읽어요.</p>}
   {focus.focus==="year" && <div className="sales-month-grid" aria-label="사주에서 계산한 열두 달의 흐름">{context.months.map(month=><div key={month.period}><b>{month.period}</b><span>{month.tone==="good"?"기회와 준비":month.tone==="caution"?"점검과 조율":"꾸준히 쌓기"}</span></div>)}</div>}
   <SalesLockNote>시기를 읽는 근거와 구체적인 행동 순서는 전체 풀이에서 이어집니다.</SalesLockNote>
  </SalesCard>}
  {focus.partnership && ["love","reunion","pair"].includes(focus.focus) && !context.minor && <SalesCard seal="緣" title="관계의 흐름이 겹치는 때">
   <p className="ds-date-hint">{focus.partnership.period}</p><p>{focus.partnership.reasons[0]}</p>
   <p>{focus.focus==="reunion"?"이 시기가 상대의 마음이나 재회를 보장하지는 않아요. 실제 연락과 대화가 가능한 조건을 함께 확인하세요.":"새로운 만남뿐 아니라, 지금 관계에서 약속과 생활의 기준을 구체화하는 흐름으로도 읽어요."}</p>
  </SalesCard>}
  <SalesCard seal="解答" title={blunt ? "이제, 네가 가장 궁금한 답으로 이어갈게" : "이제, 가장 궁금한 답으로 이어갈게요"}>
   <dl className="ds-locked-rows">{focus.questions.map(question=><div key={question}><dt>{question}</dt><dd><SalesMosaic wide/></dd></div>)}</dl>
   <p>{blunt ? `${context.name}, 네 원국과 시기를 연결해서 왜 그런지, 뭘 먼저 바꿀지 한 권으로 짚어줄게.` : `${context.name}님의 원국과 시기를 연결해, 왜 그런지와 무엇부터 바꿀지를 한 권으로 이어서 읽어요.`}</p>
  </SalesCard>
 </>;
}
