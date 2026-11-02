"use client";

import { getGuide } from "@/lib/story/guides";
import { getPoster } from "@/components/home/posters";
import { chapterPreview } from "@/lib/reports/preview-topics";
import type { ReportProduct } from "@/lib/reports/catalog";
import { SalesAssurance, SalesCard, SalesChapter, SalesLockNote, SalesMosaic, SalesReveal, SalesSay, SalesScene } from "@/components/manse/CinematicSales";

/** 아직 생일을 입력하지 않은 손님에게는 자신의 결과처럼 보이는 임의 값을 넣지 않는다. */
export function CinematicProductIntro({ report, onStart, onWatchIntro, resuming = false }: {
  report: ReportProduct; onStart: () => void; onWatchIntro?: () => void; resuming?: boolean;
}) {
  const guide = getGuide(report.guide);
  const blunt = report.slug === "factbomb";
  const say = (polite: string, direct: string) => blunt ? direct : polite;
  return <div className="destiny-sales -mx-margin">
    <div className="ds-opening">
      <SalesScene guide={guide.id} shot="sales-hero" fallback="intro-4" asset={blunt ? undefined : getPoster(report.slug, guide.id)} className="ds-hero" />
      <div className="ds-hero-caption"><span>운명대로 · {guide.title}</span><h1>{report.title}</h1></div>
    </div>
    <SalesSay>{say("당신에게 다가올", "네게 다가올")}<br /><em>{say("운명을 펼쳐 볼게요", "운명을 펼쳐 보자")}</em></SalesSay>
    <SalesReveal className="ds-opening-preview">
      {[{ label: "내가 타고난 진짜 모습", color: "#d6b272" }, { label: "배우자와 귀인이 드러나는 때", color: "#7594d4" }, { label: "돈과 일이 풀리는 나만의 길", color: "#b45c62" }].map(item => <div key={item.label} style={{ "--ds-dot": item.color } as React.CSSProperties}><span className="ds-time-dot" /><div><p><SalesMosaic /> <small>년</small> <SalesMosaic /> <small>월</small></p><b>{item.label}</b></div></div>)}
      <SalesLockNote>생년월일시를 입력하면 내 명식부터 무료로 확인할 수 있어요.</SalesLockNote>
    </SalesReveal>
    <button className="ds-main-cta" onClick={onStart}>{resuming ? "입력하던 이야기 이어가기" : "내 사주 먼저 펼쳐 보기"}</button>
    {onWatchIntro && <button className="ds-watch" onClick={onWatchIntro}>{guide.name} 이야기 보기</button>}
    <SalesSay>{say("그런데 당신,", "그런데 너,")}<br /><em>{say("왜 늘 같은 데서 마음이 걸릴까요?", "왜 늘 같은 데서 마음이 걸릴까?")}</em></SalesSay>
    <SalesScene guide={guide.id} shot="sales-eye" className="ds-eye" />
    <SalesSay>{say("잘 지내는 모습 뒤에도", "잘 지내는 모습 뒤에도")}<br />{say("말하지 못한 마음이 있지요", "말 못 한 마음 하나쯤 있지")}<br /><em>{say("이번에는 그 이유를 볼게요", "이번엔 그 이유부터 볼게")}</em></SalesSay>
    <SalesChapter title="사주 원국 분석" />
    <SalesCard seal="本性" title={<>{say("남들이 아는 모습과", "남들이 아는 너랑")}<br /><em>{say("내가 아는 나는 왜 다를까요?", "네가 아는 넌 왜 다를까?")}</em></>}>
      <p>{say("사람들 앞에서 잘해 내는 나와, 혼자 있을 때 마음에 걸리는 것. 같은 성격이라고 해도 그 두 모습은 다를 수 있어요.", "남들 앞에서는 잘해 내는데, 돌아서면 혼자 마음에 담아 두는 것. 겉으로 보이는 모습이 네 전부는 아니잖아.")}</p>
      <p className="ds-question">{say("답은 타고난 여덟 글자의 조합에 있어요.", "답은 네 여덟 글자의 조합에 있어.")}</p>
      <p>{say("태어난 날의 글자 하나로 성격을 정하지 않아요. 어느 계절에 태어났는지, 다른 글자들이 어떤 힘을 보태는지까지 함께 읽어요.", "태어난 날의 글자 하나만 보고 널 정하지 않아. 어느 계절에 태어났고, 다른 글자들이 무슨 힘을 보태는지까지 같이 읽을 거야.")}</p>
      <SalesLockNote>입력 후 내 사주에 맞는 성향 풀이를 먼저 보여 드려요.</SalesLockNote>
    </SalesCard>
    <SalesScene guide={guide.id} shot="sales-love" fallback="panel-second" className="ds-love-scene" />
    <SalesSay>{say("성격 이야기만으로", "성격 얘기만으로")}<br /><em>{say("끝내지는 않을게요", "끝내진 않을 거야")}</em></SalesSay>
    <SalesChapter title="인연 · 재물 · 직업 · 귀인" />
    <SalesCard seal="緣" title={<>{say("누구에게 끌리고", "넌 누구에게 끌리고")}<br /><em>{say("누구와 오래 편안할까요?", "누구랑 오래 편할까?")}</em></>}><p>{say("연애와 배우자의 자리, 가까워지는 방식과 관계의 흐름이 겹치는 시기를 함께 읽어요.", "연애랑 배우자의 자리, 가까워지는 방식과 관계의 흐름이 겹치는 때를 같이 짚을게.")}</p><div className="ds-wealth-reveal"><SalesMosaic wide /></div><SalesLockNote /></SalesCard>
    <SalesCard seal="財物" title={<>{say("돈을 버는 힘과", "돈 버는 힘이랑")}<br /><em>{say("내 손에 남기는 힘은 달라요", "손에 남기는 힘은 달라")}</em></>}><p>{say("직장과 사업 중 어떤 방식에서 장점이 살아나는지, 내 표현과 기술이 돈으로 이어지는 길은 어디인지 살펴봐요.", "직장이랑 사업 중 어떤 방식에서 네 장점이 사는지, 네 말과 기술이 돈으로 이어지는 길이 어딘지 읽어줄게.")}</p><div className="ds-wealth-reveal"><SalesMosaic wide /></div><SalesLockNote /></SalesCard>
    <SalesCard seal="貴人" title={<>{say("내 편이 되는 사람,", "네 편이 되는 사람,")}<br /><em>{say("언제 어떻게 알아볼까요?", "언제 어떻게 알아볼까?")}</em></>}><p>{say("조언과 소개가 실마리가 되는 시기, 도움이 되는 사람의 역할, 가까운 사이에서 반복되는 엇갈림까지 함께 읽어요.", "조언이나 소개가 실마리가 되는 때, 도움이 되는 사람의 역할, 가까운 사이에서 반복되는 엇갈림까지 같이 읽을게.")}</p><SalesLockNote /></SalesCard>
    <div className="ds-domain-grid">{["성격", "배우자", "귀인", "직업", "재물", "삶의 흐름"].map((label, i) => <div key={label}><span aria-hidden="true">{["命", "緣", "貴", "業", "財", "運"][i]}</span><p>{label}</p></div>)}</div>
    <SalesSay>{say("좋은 말만 듣고 끝내기엔,", "좋은 말만 듣고 끝내기엔,")}<br /><em>{say("당신 이야기는 더 깊어요", "네 이야기는 더 깊어")}</em></SalesSay>
    <SalesScene guide={guide.id} shot="sales-finale" fallback="report-cover" className="ds-finale" />
    <SalesSay>{say("타고난 모습부터", "타고난 네 모습부터")}<br />{say("지나온 시간과 앞으로의 선택까지", "지나온 시간과 앞으로의 선택까지")}<br /><em>{say("한 사람의 이야기로 읽어 드려요", "한 사람의 이야기로 읽어줄게")}</em></SalesSay>
    <SalesAssurance />
    <SalesChapter title="어떤 이야기가 이어질까요" />
    <div className="ds-toc">{report.chapters.map(title => <SalesReveal key={title} className="ds-toc-item"><h3><span aria-hidden="true">◆</span>{title}</h3><ul>{chapterPreview(title).map(item => <li key={item}>{item}</li>)}</ul></SalesReveal>)}</div>
    <p className="ds-preview-label">아직 개인 풀이가 작성되기 전이에요.<br />이름과 생년월일시를 입력하면 내 사주로 이어집니다.</p>
    <div className="ds-sticky-cta"><button className="ds-main-cta" onClick={onStart}>{resuming ? "입력하던 이야기 이어가기" : "내 사주 먼저 펼쳐 보기"}</button><p className="ds-footnote">명식과 첫 풀이까지 무료 · 전체 풀이를 원할 때 결제</p></div>
    <p className="ds-font-credit">이 화면은 가평군의 가평한석봉 큰붓B 서체를 사용합니다.</p>
  </div>;
}
