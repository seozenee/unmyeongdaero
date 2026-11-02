"use client";

import dynamic from "next/dynamic";
import { Icon } from "@/components/ui/Icon";
import type { WebtoonAsset } from "@/components/webtoon/assets";
import { chapterPreview, lockedTopicsFor } from "@/lib/reports/preview-topics";
import type { ReadingTeaser as Teaser } from "@/lib/manse/teaser";
import type { Guide } from "@/lib/story/guides";
import type { PreviewContext, PreviewReading } from "@/lib/manse/preview";
import { SalesAssurance, SalesCard, SalesChapter, SalesLockNote, SalesMosaic, SalesReveal, SalesSay, SalesScene } from "./CinematicSales";

const LegacyReadingWebtoon = dynamic(() => import("./LegacyReadingWebtoon").then(module => module.LegacyReadingWebtoon));

const NATURE: Record<string, [string, string]> = {
  갑: ["쉽게 꺾이지 않는", "큰 나무의 결"], 을: ["유연하게 길을 찾는", "풀과 덩굴의 결"],
  병: ["사람들 앞을 밝히는", "태양의 결"], 정: ["작은 차이를 놓치지 않는", "등불의 결"],
  무: ["쉽게 자리를 내주지 않는", "큰 산의 결"], 기: ["사람과 일을 품어내는", "대지의 결"],
  경: ["결정한 것은 밀고 나가는", "단단한 쇠의 결"], 신: ["작은 차이까지 가려내는", "잘 다듬은 보석의 결"],
  임: ["넓게 보고 길을 찾아가는", "큰 물길의 결"], 계: ["조용히 스며들어 이해하는", "비와 이슬의 결"],
};

function Pillars({ context }: { context: PreviewContext }) {
  return <div className="ds-pillars" aria-label={`${context.name}님의 사주 원국`}>
    <span className="ds-pillars-seal" aria-hidden="true">命式</span>
    <div className="ds-pillar-grid">{(["hour", "day", "month", "year"] as const).map((key, index) => {
      const pillar = context.pillars[key];
      return <div key={key} className={key === "day" ? "ds-day" : ""}>
        <p>{["時", "日", "月", "年"][index]}</p>
        <strong>{pillar?.hanja[0] ?? "—"}</strong><strong>{pillar?.hanja[1] ?? "—"}</strong>
        <small>{pillar?.full ?? "시간 미상"}</small>
      </div>;
    })}</div>
  </div>;
}

function LockedRows({ labels }: { labels: readonly string[] }) {
  return <dl className="ds-locked-rows">{labels.map(label => <div key={label}><dt>{label}</dt><dd><SalesMosaic wide /></dd></div>)}</dl>;
}

function FortuneGraph({ context }: { context: PreviewContext }) {
  const months = context.months.slice(0, 6);
  if (!months.length) return null;
  const y = (tone: string) => tone === "good" ? 33 : tone === "caution" ? 115 : 76;
  const points = months.map((month, i) => `${26 + i * (288 / Math.max(months.length - 1, 1))},${y(month.tone)}`);
  return <figure className="ds-fortune-graph">
    <svg viewBox="0 0 340 160" role="img" aria-label="계산한 앞으로의 월별 흐름. 구체적인 해석은 전체 풀이에서 공개합니다.">
      {[35, 78, 121].map(v => <line key={v} x1="20" x2="320" y1={v} y2={v} stroke="#756051" strokeOpacity=".2" strokeDasharray="3 5" />)}
      <path d={`M${points.join(" L")}`} fill="none" stroke="#e4bd80" strokeWidth="2.5" />
      {points.map((point, i) => <circle key={i} cx={point.split(",")[0]} cy={point.split(",")[1]} r="4" fill={months[i]!.tone === "caution" ? "#b45c62" : "#e4bd80"} />)}
      {months.map((month, i) => <text key={month.period} x={26 + i * (288 / Math.max(months.length - 1, 1))} y="153" textAnchor="middle" fill="#a68e80" fontSize="10">{month.period.replace(/\d{4}년\s*/, "")}</text>)}
    </svg>
    <figcaption>좋은 흐름과 신중하게 살펴볼 흐름을 함께 읽습니다.</figcaption>
  </figure>;
}

/** 입력한 명식 → 원국의 이유 → 인연·재물·귀인·시기 → 구입으로 이어지는 한 편의 상세 화면. */
export function ReadingWebtoon(props: React.ComponentProps<typeof CinematicReadingWebtoon>) {
  return ["factbomb", "destiny-full", "life"].includes(props.context.slug)
    ? <CinematicReadingWebtoon {...props} /> : <LegacyReadingWebtoon {...props} />;
}

function CinematicReadingWebtoon({ name, guide, poster, narrative, context, chapters, productTitle, chart, purchaseHref }: {
  teaser: Teaser; name: string; guide: Guide; poster: WebtoonAsset | null;
  narrative: PreviewReading; context: PreviewContext; chapters: readonly string[];
  productTitle: string; chart: React.ReactNode; purchaseHref: string;
}) {
  const blunt = context.speech === "반말";
  const say = (polite: string, direct: string) => blunt ? direct : polite;
  const person = context.child ? `${name}의` : blunt ? name : `${name}님`;
  const topics = lockedTopicsFor(context);
  const stem = context.pillars.day;
  const nature = NATURE[stem.stem] ?? NATURE.갑!;
  const adult = !context.minor && !context.child;
  const broad = ["factbomb", "destiny-full", "life"].includes(context.slug);
  const partnerWindow = context.focus?.partnership.filter(window => window.year >= Number(context.today.slice(0, 4))).sort((a, b) => a.year - b.year || (a.month ?? 0) - (b.month ?? 0))[0];
  const benefactor = context.focus?.benefactor.filter(window => window.year >= Number(context.today.slice(0, 4))).sort((a, b) => a.year - b.year || (a.month ?? 0) - (b.month ?? 0))[0];
  const relationTitle = adult ? "연애·배우자운" : "사람과의 인연";
  return <section className="destiny-sales reading-story -mx-margin">
    <div className="ds-opening">
      <SalesScene guide={guide.id} shot="sales-hero" fallback="intro-4" className="ds-hero" asset={guide.id === "gangho" ? undefined : poster} />
      <div className="ds-hero-caption"><span>{productTitle}</span><h1>{person},<br />{say("잘 오셨어요.", "그래 잘 왔어.")}</h1></div>
    </div>
    <SalesSay>{say("당신에게 다가올", "네게 다가올")}<br /><em>{say("운명을 펼쳐 볼게요", "운명을 펼쳐 보자")}</em></SalesSay>
    <SalesReveal className="ds-opening-preview">
      {[
        { label: adult ? "마음이 움직이는 인연" : "곁에서 힘이 되는 사람", color: "#7594d4" },
        { label: context.minor || context.child ? "타고난 재능이 살아나는 길" : "돈이 모이는 나만의 방식", color: "#d6b272" },
        { label: "한 번 더 살펴봐야 할 선택", color: "#b45c62" },
      ].map(item => <div key={item.label} style={{ "--ds-dot": item.color } as React.CSSProperties}><span className="ds-time-dot" /><div><p><SalesMosaic /> <small>년</small> <SalesMosaic /> <small>월</small></p><b>{item.label}</b></div></div>)}
      <SalesLockNote>시기와 구체적인 이유는 전체 풀이에서 공개돼요.</SalesLockNote>
    </SalesReveal>
    <SalesSay>{say("오호라, 잠시만요…", "오호라, 잠시만…")}</SalesSay>
    <SalesScene guide={guide.id} shot="sales-eye" className="ds-eye" />
    <SalesSay>{say("좋은 모습만으로는", "좋은 말만으로는")}<br /><em>{say("설명되지 않는 사주예요", "다 설명 안 되는 사주야")}</em></SalesSay>
    <SalesSay className="ds-say-small">{say("방금 본 건", "방금 본 건")}<br />{say("당신 이야기의 극히 일부예요", "네 이야기의 극히 일부일 뿐")}</SalesSay>
    <SalesScene guide={guide.id} shot="intro-4" className="ds-turn" />
    <SalesSay>{say("잘하는 것부터", "네가 잘하는 것부터")}<br />{say("자꾸 같은 데서 막히는 이유까지,", "자꾸 같은 데서 막히는 이유까지,")}<br /><em>{say("이제 하나씩 짚어 볼게요", "이제 제대로 짚어줄게")}</em></SalesSay>

    <SalesChapter title="사주 원국 분석" />
    <SalesSay>{person},<br /><em>{narrative.headline}</em></SalesSay>
    <Pillars context={context} />
    <SalesCard seal="本性" title={<>{say("당신은", "넌")} {nature[0]}<br /><em>{nature[1]}</em>{say("을 타고났어요", "을 타고났어")}<span className="ds-stem">{stem.hanja[0]}</span><small>나를 나타내는 글자 · {stem.stem}</small></>}>
      <p>{say(`${name}님, 가장 먼저 짚이는 모습이 있어요.`, `${name}, 네가 가장 잘하는 걸 짚어볼까?`)}</p>
      <p className="ds-emphasis">{narrative.personality.lead}</p>
      <p>{narrative.personality.body[0]}</p>
      <p>{narrative.personality.body[1]}</p>
      <p className="ds-question">{say("왜 이런 모습이 반복될까요?", "왜 이런 모습이 반복될까?")}</p>
      <p>{say("답은 태어난 여덟 글자에 있어요.", "답은 네 사주에 있어.")}</p>
      <p>{narrative.personality.reason}</p>
      <details className="ds-evidence"><summary>이렇게 읽은 근거</summary>{narrative.personality.evidenceIds.flatMap(id => context.facts.filter(fact => fact.id === id)).map(fact => <p key={fact.id}><b>{fact.label}</b><br />{fact.note}</p>)}</details>
    </SalesCard>
    <div id="reading-first-reveal" />
    <details className="ds-input-check"><summary>입력한 생년월일과 계산된 사주표 확인</summary><div>{chart}</div></details>

    {narrative.past.length > 0 && <>
      <SalesChapter title="지나온 시간의 흔적" />
      <SalesSay>{say("미래 이야기 전에,", "앞날 얘기 전에,")}<br /><em>{say("지나온 시간부터 볼게요", "네가 지나온 때부터 볼게")}</em></SalesSay>
      {narrative.past.slice(0, 1).map(item => <SalesCard key={item.year} seal="過去" title={<>{item.year}년,<br /><em>{item.title}</em></>}>
        <p>{item.body[0]}</p><p className="ds-question">{item.check}</p>
        <SalesLockNote>지나온 경험과 앞으로의 흐름을 함께 이어서 읽어요.</SalesLockNote>
      </SalesCard>)}
    </>}

    <SalesScene guide={guide.id} shot="sales-love" fallback="panel-second" className="ds-love-scene" />
    <SalesSay>{say("그런데 이 사주,", "그런데 네 사주,")}<br /><em>{say("사람과의 인연도 빼놓을 수 없어요", "사람과의 인연을 빼놓을 수 없지")}</em></SalesSay>
    <SalesChapter title="영역별 점사" />
    <h2 className="ds-area-title">{relationTitle}</h2>
    <SalesSay>{say("누구에게 끌리고,", "넌 누구에게 끌리고,")}<br /><em>{say("누구와 오래 편안할까요?", "누구랑 오래 편할까?")}</em></SalesSay>
    <SalesCard seal="緣" title={<>{person},<br /><em>{adult ? "인연의 모습" : "곁에 둘 사람의 모습"}</em></>}>
      <p>{narrative.areas.find(area => /관계|거리|가까/.test(area.title))?.lead ?? say("마음이 끌리는 방식과 가까워진 뒤의 모습은 다를 수 있어요.", "마음이 끌리는 방식이랑 가까워진 뒤의 모습은 다를 수 있어.")}</p>
      <div className="ds-partner-art" aria-hidden="true"><div /><span>緣</span><i /><i /></div>
      <LockedRows labels={adult ? ["인연을 살펴볼 시기", "마음이 가까워지는 자리", "끌리는 사람의 성향", "오래 가는 관계의 조건"] : ["마음이 편한 사람", "서로 배우는 관계", "도움을 주고받는 방식"]} />
      {adult && partnerWindow && <p className="ds-date-hint"><b>{partnerWindow.year}년</b>, <SalesMosaic /> {say("흐름이 겹치는 시기를 더 자세히 읽어요.", "흐름이 겹치는 때를 더 자세히 짚어줄게.")}</p>}
      <SalesLockNote>{say("누가 잘 맞는지, 왜 그때인지까지 이어서 읽어요.", "누가 잘 맞고, 왜 그때인지까지 짚어줄게.")}</SalesLockNote>
    </SalesCard>

    <SalesSay>{person},<br />{say("인연 말고도", "인연 말고도")}<br /><em>{say("중요하게 봐야 할 게 있어요", "짚어야 할 게 더 있어")}</em></SalesSay>
    <h2 className="ds-area-title">{context.minor || context.child ? "재능과 배움" : "재물·직업운"}</h2>
    <SalesScene guide={guide.id} shot="panel-unfold" className="ds-money-scene" />
    <SalesCard seal={adult ? "財物" : "才能"} title={<>{person}{blunt ? "의" : "의"}<br /><em>{adult ? "돈이 들어오는 길" : "타고난 힘을 쓰는 길"}</em></>}>
      <p className="ds-emphasis">{adult ? (blunt ? context.focus?.business.lead.replace(/사주예요\.$/, "사주야.").replace(/어울려요\.$/, "어울려.") : context.focus?.business.lead) : narrative.areas[0]?.lead}</p>
      <div className="ds-wealth-reveal"><SalesMosaic wide /><span>{adult ? "재물의 흐름" : "재능의 쓰임"}</span></div>
      <LockedRows labels={adult ? ["월급과 사업, 맞는 방식", "내 강점이 돈으로 이어지는 분야", "기회를 살펴볼 시기", "돈이 새는 지점"] : ["이해가 빠른 설명 방식", "직접 해 볼 때의 강점", "준비한 것을 펼쳐 볼 시기"]} />
      <SalesLockNote />
    </SalesCard>

    {(broad || /귀인/.test(context.concern)) && <>
      <SalesSay>{say("그리고 꼭 짚고 싶은 건", "그리고 꼭 짚고 싶은 건")}<br /><em>{say("내 편이 되어 주는 사람이에요", "네 편이 되어 주는 사람이야")}</em></SalesSay>
      <SalesCard seal="貴人" title={<>{say("도움의 실마리가 열리는", "도움의 실마리가 열리는")}<br /><em>{say("귀인의 시기와 모습", "귀인의 때와 모습")}</em></>}>
        <p>{say("혼자 밀어붙일 때보다 조언과 소개가 길을 만들어 주는 때가 있어요. 어떤 관계에서 그 도움을 살펴보면 좋을지 함께 읽어요.", "혼자 밀어붙일 때보다 조언이나 소개가 길을 만들어 주는 때가 있어. 어떤 관계에서 그 도움을 살펴볼지 같이 읽어줄게.")}</p>
        <p className="ds-date-hint">{benefactor ? `${benefactor.year}년` : "다가오는 시간"} <SalesMosaic /></p>
        <LockedRows labels={["도움이 되는 사람의 역할", "조언과 소개를 살펴볼 때", "도움과 간섭을 구별할 기준"]} />
        <SalesLockNote />
      </SalesCard>
    </>}

    <div className="ds-domain-grid">{(adult ? ["연애운", "재물운", "직업운", "배우자운", "귀인운", "삶의 흐름"] : ["성격", "재능", "배움", "친구", "가족", "삶의 흐름"]).map((label, index) => <div key={label}><span aria-hidden="true">{["緣", "財", "業", "合", "貴", "運"][index]}</span><p>{label}</p></div>)}</div>
    <SalesChapter title="다가올 선택의 갈림길" />
    <SalesSay>{say("다만,", "근데 너,")}<br />{say("이 부분은", "이 부분은")}<br /><em>{say("한 번 더 살펴봐야 해요", "꼭 짚고 가야겠어")}</em></SalesSay>
    <SalesCard seal="轉機" title={<SalesMosaic wide />}>
      <FortuneGraph context={context} />
      <LockedRows labels={["기회가 겹치는 시기", "신중하게 볼 선택", "같은 실수를 줄이는 기준"]} />
      <p>{say("좋은 때라는 이유로 서두르거나, 부담스러운 때라는 이유로 포기하지 않도록. 무엇을 살피고 어떻게 움직이면 좋을지까지 이어서 읽어요.", "좋은 때라고 서두르고, 부담스러운 때라고 다 포기하면 안 돼. 뭘 살피고 어떻게 움직일지까지 짚어줄게.")}</p>
    </SalesCard>
    {context.concern && <SalesCard seal="問" title={say("남겨 주신 그 질문도", "네가 남긴 그 질문도")}><blockquote>“{context.concern.slice(0, 300)}”</blockquote><p>{say("전체 사주 안에서 이 질문에 대한 답도 함께 짚어요.", "네 사주 전체를 읽고, 이 질문에 대한 답도 같이 짚을게.")}</p><SalesMosaic wide /></SalesCard>}
    <SalesSay>{say("여기까지 읽으며", "여기까지 읽으면서")}<br />{say("떠오른 내 모습이 있나요?", "떠오른 네 모습이 있지?")}<br /><em>{say("이제, 다음 선택을 볼 차례예요", "이제 네 다음 차례를 볼게")}</em></SalesSay>
    <SalesScene guide={guide.id} shot="sales-finale" fallback="report-cover" className="ds-finale" />
    <SalesSay>{person}{blunt ? ", 네" : "의"} 운명,<br /><em>{say("하나씩 펼쳐 드릴게요", "내가 낱낱이 펼쳐줄게")}</em></SalesSay>
    <SalesSay className="ds-say-small">{say("누구에게 마음을 쓰고,", "누구에게 마음을 쓰고,")}<br />{say("어디에서 내 힘을 펼치고,", "어디에서 네 힘을 펼치고,")}<br /><em>{say("언제 손을 뻗으면 좋을지까지", "언제 손을 뻗으면 좋을지까지")}</em></SalesSay>
    <SalesAssurance />
    <SalesChapter title="전체 풀이에서 확인할 이야기" />
    <div className="ds-toc">{chapters.map(title => <SalesReveal className="ds-toc-item" key={title}><h3><span aria-hidden="true">◆</span>{title}</h3><ul>{chapterPreview(title).map(item => <li key={item}>{item}</li>)}</ul></SalesReveal>)}</div>
    {topics.length > 0 && <p className="ds-footnote">{topics.map(topic => topic.title).join(" · ")}까지 함께 읽어요.</p>}
    <a href={purchaseHref} className="ds-main-cta">내 전체 풀이 확인하기<Icon name="arrow_forward" className="text-[20px]" /></a>
    <p className="ds-footnote">한 번 결제로 보관함에서 12개월 열람 · PDF 내려받기</p>
    <p className="ds-font-credit">이 화면은 가평군의 가평한석봉 큰붓B 서체를 사용합니다.</p>
  </section>;
}
