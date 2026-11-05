"use client";
import { ScrollPurchaseCta } from "@/components/story/ScrollPurchaseCta";

import { ProductSalesFocus } from "./ProductSalesFocus";
import { salesFocusFor } from "@/lib/reports/sales-focus";
import { Icon } from "@/components/ui/Icon";
import type { WebtoonAsset } from "@/components/webtoon/assets";
import { chapterPreview, lockedTopicsFor } from "@/lib/reports/preview-topics";
import type { ReadingTeaser as Teaser } from "@/lib/manse/teaser";
import type { Guide } from "@/lib/story/guides";
import type { PreviewContext, PreviewReading } from "@/lib/manse/preview";
import { SalesAssurance, SalesCard, SalesChapter, SalesGauge, SalesLockNote, SalesLockedCount, SalesMosaic, SalesProof, SalesReveal, SalesSay, SalesScene } from "./CinematicSales";



const NATURE: Record<string, [string, string]> = {
  갑: ["쉽게 꺾이지 않는", "큰 나무의 결"], 을: ["유연하게 길을 찾는", "풀과 덩굴의 결"],
  병: ["사람들 앞을 밝히는", "태양의 결"], 정: ["작은 차이를 놓치지 않는", "등불의 결"],
  무: ["쉽게 자리를 내주지 않는", "큰 산의 결"], 기: ["사람과 일을 품어내는", "대지의 결"],
  경: ["결정한 것은 밀고 나가는", "단단한 쇠의 결"], 신: ["작은 차이까지 가려내는", "잘 다듬은 보석의 결"],
  임: ["넓게 보고 길을 찾아가는", "큰 물길의 결"], 계: ["조용히 스며들어 이해하는", "비와 이슬의 결"],
};

/**
 * 명식 표.
 *
 * 한자 여덟 자만 세워 두면 보는 사람은 그림으로만 받아들인다. 자리마다 십성을 위아래로
 * 붙여 두면 "이 글자가 나에게 무엇인지"가 표 안에서 읽힌다 — 계산한 값을 그대로 쓴다.
 * 태어난 시각을 모르면 시주 칸은 비워 두고 모른다고 적는다. 채워 넣지 않는다.
 */
function Pillars({ context }: { context: PreviewContext }) {
  const board = context.board.pillars;
  const slots = (["hour", "day", "month", "year"] as const).map((key, index) => ({
    key, label: ["時", "日", "月", "年"][index]!, pillar: context.pillars[key], god: board.find(item => item.slot === key),
  }));
  return <div className="ds-pillars" aria-label={`${context.name}님의 사주 원국`}>
    <span className="ds-pillars-seal" aria-hidden="true">命式</span>
    <div className="ds-pillar-grid">{slots.map(({ key, label, pillar, god }) => (
      <div key={key} className={key === "day" ? "ds-day" : ""}>
        <p>{label}</p>
        <em className="ds-pillar-god">{god?.stemGod ?? "—"}</em>
        <strong>{pillar?.hanja[0] ?? "—"}</strong><strong>{pillar?.hanja[1] ?? "—"}</strong>
        <em className="ds-pillar-god">{god?.branchGod ?? "—"}</em>
        <small>{pillar?.full ?? "시간 모름"}</small>
      </div>
    ))}</div>
    {context.unknownHour && <p className="ds-pillars-note">태어난 시각을 모르셔서 시주는 비워 두었어요. 나머지 세 기둥만으로도 큰 결은 읽혀요.</p>}
  </div>;
}

function LockedRows({ labels }: { labels: readonly string[] }) {
  return <dl className="ds-locked-rows">{labels.map((label, index) => <div key={label} style={{ "--ds-delay": `${index * 80}ms` } as React.CSSProperties}><dt>{label}</dt><dd><SalesMosaic wide /></dd></div>)}</dl>;
}

/**
 * 상품마다 다른 「영역별 점사」.
 *
 * 전에는 성격 다음의 영역 카드가 평생·종합·팩폭 세 상품에만 붙었다. 나머지 열다섯 상품은
 * 성격 한 장을 보고 바로 결제 버튼을 만났다. 그런데 영역 카드를 그대로 모든 상품에 붙이면
 * 재회사주 화면에서 재물운을 약속하는 꼴이 된다 — 본문이 못 지키는 약속은 환불 사유다.
 *
 * 그래서 상품이 실제로 다루는 주제(lockedTopicsFor)에서 카드를 만든다. 모든 상품이 같은
 * 밀도의 화면을 받고, 약속은 목차 안에 머문다.
 */
const TOPIC_SEALS = ["緣", "財", "運", "命"] as const;

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
  return <CinematicReadingWebtoon {...props} />;
}

function CinematicReadingWebtoon({ name, guide, poster, narrative, context, chapters, productTitle, chart, purchaseHref, onPurchase }: {
  teaser: Teaser; name: string; guide: Guide; poster: WebtoonAsset | null;
  narrative: PreviewReading; context: PreviewContext; chapters: readonly string[];
  productTitle: string; chart: React.ReactNode; purchaseHref: string; onPurchase?: () => void;
}) {
  const blunt = context.speech === "반말";
  const say = (polite: string, direct: string) => blunt ? direct : polite;
  const person = context.child ? `${name}의` : blunt ? name : `${name}님`;
  const topics = lockedTopicsFor(context);
  const stem = context.pillars.day;
  const nature = NATURE[stem.stem] ?? NATURE.갑!;
  const adult = !context.minor && !context.child;
  const productFocus = salesFocusFor(context,narrative);
  const broad = ["factbomb", "destiny-full", "life"].includes(context.slug);
  // 아래 여섯 칸은 이 상품이 실제로 다루는 영역만 적는다. 다루지 않는 운을 간판에 걸지 않는다.
  const domainLabels = broad
    ? (adult ? ["연애운", "재물운", "직업운", "배우자운", "귀인운", "삶의 흐름"] : ["성격", "재능", "배움", "친구", "가족", "삶의 흐름"])
    : ["나의 성향", "맞는 방식", "지금의 흐름", "주의할 선택", "확인할 기준", "다가올 시기"];
  const partnerWindow = context.focus?.partnership.filter(window => window.year >= Number(context.today.slice(0, 4))).sort((a, b) => a.year - b.year || (a.month ?? 0) - (b.month ?? 0))[0];
  const benefactor = context.focus?.benefactor.filter(window => window.year >= Number(context.today.slice(0, 4))).sort((a, b) => a.year - b.year || (a.month ?? 0) - (b.month ?? 0))[0];
  return <section className="destiny-sales reading-story -mx-margin">
    <div className="ds-opening">
      <SalesScene guide={guide.id} shot="sales-hero" fallback="intro-4" className="ds-hero" asset={guide.id === "gangho" ? undefined : poster} />
      <div className="ds-hero-caption"><span>{productTitle}</span><h1>{person},<br />{say("잘 오셨어요.", "그래 잘 왔어.")}</h1></div>
    </div>
    <SalesSay>{say("당신에게 다가올", "네게 다가올")}<br /><em>{say("운명을 펼쳐 볼게요", "운명을 펼쳐 보자")}</em></SalesSay>
    {/*
      결제 전 미리보기.

      전에는 세 줄이 전부 모자이크라 "무언가 가려져 있다"는 것만 보였다. 날짜는 실제로
      계산해 둔 값이므로 먼저 보여 준다 — 가려야 할 것은 그 시기에 무슨 일이 움직이는지다.
      계산된 시점이 모자랄 때만 상품의 질문으로 채운다. 없는 날짜를 만들지 않는다.
    */}
    <SalesReveal className="ds-opening-preview">
      {context.board.preview.map((item,index)=><div key={item.period} style={{"--ds-dot":["#7594d4","#d6b272","#b45c62"][index]} as React.CSSProperties}><span className="ds-time-dot"/><div><p>{item.period}</p><b>{item.label}</b><SalesMosaic wide/></div></div>)}
      {productFocus.questions.slice(context.board.preview.length).map((label,index)=><div key={label} style={{"--ds-dot":["#7594d4","#d6b272","#b45c62"][index+context.board.preview.length]} as React.CSSProperties}><span className="ds-time-dot"/><div><p><SalesMosaic wide/></p><b>{label}</b></div></div>)}
      <SalesLockNote>날짜는 입력한 사주로 계산한 시점이에요. 그때 무엇이 움직이는지는 전체 풀이에서 열려요.</SalesLockNote>
    </SalesReveal>
    <SalesSay>{say("오호라, 잠시만요…", "오호라, 잠시만…")}</SalesSay>
    <SalesScene guide={guide.id} shot="sales-eye" className="ds-eye" />
    <SalesSay>{say("좋은 모습만으로는", "좋은 말만으로는")}<br /><em>{say("설명되지 않는 사주예요", "다 설명 안 되는 사주야")}</em></SalesSay>
    <SalesScene guide={guide.id} shot="intro-4" className="ds-turn" />
    <SalesSay>{say("잘하는 것부터", "네가 잘하는 것부터")}<br />{say("자꾸 같은 데서 막히는 이유까지,", "자꾸 같은 데서 막히는 이유까지,")}<br /><em>{say("이제 하나씩 짚어 볼게요", "이제 제대로 짚어줄게")}</em></SalesSay>

    <SalesChapter index={1} title="사주 원국 분석" />
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

    <ProductSalesFocus context={context} narrative={narrative}/>

    {narrative.past.length > 0 && <>
      <SalesChapter title="지나온 시간의 흔적" />
      <SalesSay>{say("미래 이야기 전에,", "앞날 얘기 전에,")}<br /><em>{say("지나온 시간부터 볼게요", "네가 지나온 때부터 볼게")}</em></SalesSay>
      {narrative.past.slice(0, 1).map(item => <SalesCard key={item.year} seal="過去" title={<>{item.year}년,<br /><em>{item.title}</em></>}>
        <p>{item.body[0]}</p><p className="ds-question">{item.check}</p>
        <SalesLockNote>지나온 경험과 앞으로의 흐름을 함께 이어서 읽어요.</SalesLockNote>
      </SalesCard>)}
    </>}

    <SalesScene guide={guide.id} shot="sales-love" fallback="panel-second" className="ds-love-scene" />
    <SalesSay>{say("그런데 이 사주,", "그런데 네 사주,")}<br /><em>{say("여기서 끝이 아니에요", "여기서 끝이 아니야")}</em></SalesSay>
    <SalesChapter index={2} title="영역별 점사" />
    <SalesSay className="ds-say-small">{say(`${productTitle}에서 함께 읽는`, `${productTitle}에서 같이 읽는`)}<br /><em>{say(`${topics.length}가지 영역이에요`, `${topics.length}가지 영역이야`)}</em></SalesSay>
    {topics.map((topic, index) => <SalesCard key={topic.title} seal={TOPIC_SEALS[index] ?? "運"} title={<>{person}<br /><em>{topic.title}</em></>}>
      <p className="ds-emphasis">{topic.subtitle}</p>
      {index === 0 && <div className="ds-partner-art" aria-hidden="true"><div /><span>{TOPIC_SEALS[index] ?? "運"}</span><i /><i /></div>}
      {index === 1 && <div className="ds-wealth-reveal"><SalesMosaic wide /><span>{topic.format === "money" ? "들어오는 길과 새는 자리" : "아직 가려진 풀이"}</span></div>}
      <LockedRows labels={topic.rows} />
      {topic.format === "date" && (index === 0 ? partnerWindow : benefactor) && <p className="ds-date-hint">
        <b>{(index === 0 ? partnerWindow : benefactor)!.year}년</b>, <SalesMosaic /> {say("흐름이 겹치는 시기를 자세히 읽어요.", "흐름이 겹치는 때를 자세히 짚어줄게.")}
      </p>}
      <SalesLockNote />
    </SalesCard>)}
    {/*
      재물의 "크기".

      경쟁 화면은 여기에 "타고난 부의 크기 667억"을 박는다. 사주로 액수를 셈할 방법은 없다 —
      그건 파는 글이 아니라 거짓말이다. 대신 실제로 셀 수 있는 것을 센다: 재성이 원국의 몇
      자리에 드러나 있는지. 다섯 칸짜리 눈금으로만 보여 주고 숫자를 붙이지 않는다.
    */}
    {adult && <SalesCard seal="財物" title={<>{person}<br /><em>{say("타고난 재물의 자리", "네가 타고난 재물의 자리")}</em></>}>
      <SalesGauge level={context.board.wealth.level} label={context.board.wealth.label} min="적게 드러남" max="두텁게 드러남" />
      <p>{say("이 눈금은 원국에서 재물을 뜻하는 글자가 몇 자리에 드러나 있는지를 센 것이에요. 벌 수 있는 액수를 계산한 것이 아니라, 돈이 들어오는 길이 어떤 모양인지를 보는 출발점이에요.", "이 눈금은 네 원국에서 재물을 뜻하는 글자가 몇 자리에 드러났는지를 센 거야. 얼마를 번다는 계산이 아니라, 돈이 들어오는 길의 모양을 보는 출발점이지.")}</p>
      {context.board.wealth.basis.length > 0 && <details className="ds-evidence"><summary>이 눈금을 읽은 자리</summary>{context.board.wealth.basis.map(item => <p key={item}>{item}</p>)}</details>}
      <LockedRows labels={["돈이 들어오는 길", "손에 남기는 방식", "새는 자리와 막는 법"]} />
      <SalesLockNote />
    </SalesCard>}

    {/*
      운명의 상대.

      경쟁 화면은 "만남 장소: 집 근처 스타벅스 / 182cm 강아지상 / 김씨 / MBTI ENFP"까지 적는다.
      생년월일로는 어느 것도 나오지 않는다. 계산되는 것은 "인연의 흐름이 겹치는 시기" 하나뿐이라,
      그것만 날짜로 보여 주고 나머지 칸은 가려 둔다. 가린 칸은 결제 후 사주로 읽을 수 있는
      범위(가까워지는 방식, 맞는 성향, 확인할 신호)로 열린다.
    */}
    {adult && partnerWindow && chapters.some(title => /연애|배우자|인연|궁합|재회|상대/.test(title)) && <SalesCard seal="緣" title={<>{say("다가올 인연의", "네게 올 인연의")}<br /><em>{say("시기와 모습", "때와 모습")}</em></>}>
      <dl className="ds-profile">
        <div><dt>흐름이 겹치는 때</dt><dd><b>{partnerWindow.period.replace(" 절입 이후", "")}</b></dd></div>
        <div><dt>가까워지는 방식</dt><dd><SalesMosaic wide /></dd></div>
        <div><dt>잘 맞는 상대의 성향</dt><dd><SalesMosaic wide /></dd></div>
        <div><dt>첫 자리에서 볼 신호</dt><dd><SalesMosaic wide /></dd></div>
        <div><dt>오래가는 관계의 조건</dt><dd><SalesMosaic wide /></dd></div>
      </dl>
      <p>{say("시기는 배우자를 뜻하는 기운과 가장 가까운 관계를 보는 자리가 겹친 기간이에요. 상대의 이름·키·직업처럼 사주로 알 수 없는 것은 적지 않아요.", "이 시기는 배우자를 뜻하는 기운이랑 가장 가까운 관계를 보는 자리가 겹친 기간이야. 상대 이름이나 키 같은 건 사주로 안 나오니까 안 적어.")}</p>
      <SalesLockNote>{say("만남을 보장하는 풀이가 아니라, 그때 무엇을 보고 고를지를 읽는 자리예요.", "만남을 보장하는 게 아니라, 그때 뭘 보고 고를지를 읽는 자리야.")}</SalesLockNote>
    </SalesCard>}

    <SalesLockedCount count={topics.reduce((sum, topic) => sum + topic.rows.length, 0)} label={say("아직 가려 둔 풀이예요. 전체 풀이에서 하나씩 열려요.", "아직 가려 둔 풀이야. 전체 풀이에서 하나씩 열어줄게.")} />
    {/* 여기까지 내려온 사람은 이미 사기로 마음이 기운 쪽이다. 끝까지 더 내려가게 하지 않는다. */}
    <ScrollPurchaseCta>
      <div className="ds-sticky-cta">
        {onPurchase
          ? <button type="button" onClick={onPurchase} className="ds-main-cta">{say("가려진 풀이 열어 보기", "가려진 풀이 열어 보자")}<Icon name="arrow_forward" className="text-[20px]" /></button>
          : <a href={purchaseHref} className="ds-main-cta">{say("가려진 풀이 열어 보기", "가려진 풀이 열어 보자")}<Icon name="arrow_forward" className="text-[20px]" /></a>}
        <p className="ds-footnote">한 번 결제 · 12개월 열람 · PDF 소장</p>
      </div>
    </ScrollPurchaseCta>

    {chapters.some(title => /귀인|사람|인간관계/.test(title)) && <>
      <SalesSay>{say("그리고 꼭 짚고 싶은 건", "그리고 꼭 짚고 싶은 건")}<br /><em>{say("내 편이 되어 주는 사람이에요", "네 편이 되어 주는 사람이야")}</em></SalesSay>
      <SalesCard seal="貴人" title={<>{say("도움의 실마리가 열리는", "도움의 실마리가 열리는")}<br /><em>{say("귀인의 시기와 모습", "귀인의 때와 모습")}</em></>}>
        <p>{say("혼자 밀어붙일 때보다 조언과 소개가 길을 만들어 주는 때가 있어요. 어떤 관계에서 그 도움을 살펴보면 좋을지 함께 읽어요.", "혼자 밀어붙일 때보다 조언이나 소개가 길을 만들어 주는 때가 있어. 어떤 관계에서 그 도움을 살펴볼지 같이 읽어줄게.")}</p>
        <p className="ds-date-hint">{benefactor ? `${benefactor.year}년` : "다가오는 시간"} <SalesMosaic /></p>
        <LockedRows labels={["도움이 되는 사람의 역할", "조언과 소개를 살펴볼 때", "도움과 간섭을 구별할 기준"]} />
        <SalesLockNote />
      </SalesCard>
    </>}

    <div className="ds-domain-grid">{domainLabels.map((label, index) => <div key={label} style={{ "--ds-delay": `${index * 70}ms` } as React.CSSProperties}><span aria-hidden="true">{["緣", "財", "業", "合", "貴", "運"][index]}</span><p>{label}</p></div>)}</div>
    <SalesChapter index={3} title="다가올 위기와 갈림길" />
    <SalesSay>{say("다만,", "근데 너,")}<br />{say("이 부분은", "이 부분은")}<br /><em>{say("한 번 더 살펴봐야 해요", "꼭 짚고 가야겠어")}</em></SalesSay>
    {/* 위기도 계산에서 고른다 — 그해 글자가 원국과 충·형으로 부딪히는 해만 짚는다 */}
    {context.board.risks.length > 0 && <SalesCard seal="危機" title={<>{say("한 번 더 살펴봐야 할", "꼭 짚고 가야 할")}<br /><em>{context.board.risks[0]!.period}</em></>}>
      <dl className="ds-profile">{context.board.risks.map(risk => <div key={risk.period}><dt>{risk.period}</dt><dd>{risk.reason}</dd></div>)}</dl>
      <p>{say("그해에 들어오는 글자가 원국의 자리와 부딪히는 해예요. 나쁜 일이 정해져 있다는 뜻이 아니라, 평소보다 한 번 더 확인하고 결정할 자리라는 뜻이에요.", "그해 들어오는 글자가 네 원국이랑 부딪히는 해야. 나쁜 일이 정해졌다는 게 아니라, 평소보다 한 번 더 확인하고 결정하라는 뜻이야.")}</p>
      <LockedRows labels={["어느 자리가 흔들리는지", "그때 미루면 좋은 결정", "부담을 줄이는 준비"]} />
      <SalesLockNote />
    </SalesCard>}
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
    {/* 숫자를 적되, 운명대로가 실제로 주는 것만 적는다. 남의 특허·출간·누적 인원을 옮겨 적지 않는다. */}
    <SalesProof chapters={chapters.length} topics={topics.length} />
    <SalesChapter index={4} title="전체 풀이에서 확인할 이야기" />
    <div className="ds-toc">{chapters.map((title, index) => <SalesReveal className="ds-toc-item" key={title}>
      <h3><span className="ds-toc-no" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{title}</h3>
      <ul>{chapterPreview(title).map(item => <li key={item}>{item}</li>)}</ul>
    </SalesReveal>)}</div>
    <section id="purchase-final" className="ds-final-purchase">
      <h2>{say(`${name}님의 ${productTitle}, 지금 열어 볼까요?`, `${name}, 네 ${productTitle} 지금 열어 보자`)}</h2>
      <p>{chapters.length}개 주제의 전체 풀이 · 근거와 시기 · PDF 소장</p>
      {onPurchase
        ? <button type="button" onClick={onPurchase} className="ds-main-cta">내 전체 풀이 확인하기<Icon name="arrow_forward" className="text-[20px]" /></button>
        : <a href={purchaseHref} className="ds-main-cta">내 전체 풀이 확인하기<Icon name="arrow_forward" className="text-[20px]" /></a>}
      <p className="ds-footnote">한 번 결제로 보관함에서 12개월 열람 · PDF 내려받기</p>
    </section>
    <p className="ds-font-credit">이 화면은 가평군의 가평한석봉 큰붓B 서체를 사용합니다.</p>
  </section>;
}
