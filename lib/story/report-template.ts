// ANTHROPIC_API_KEY 가 없을 때 쓰는 규칙 기반 보고서 생성기.
// sazu 응답에 이미 들어 있는 판정 문장·명칭만 엮는다(새 사실을 만들지 않음). 점수 숫자는 지우고, 겁주는 전통 표현은 순화한다.
import type { BirthProfile, Reading, StoredSazu } from "../db/types";
import { getReport, type ReportProduct } from "../reports/catalog";
import { ELEMENT_LABEL, FIVE_ELEMENTS, parseGanji, toFiveElement, type FiveElement } from "../saju/ganji";
import { findCurrentDecadeIndex, parseElementCounts, resolveCurrentAge } from "../saju/modules";
import { hasBatchim, josa } from "../text/josa";
import { getGuide } from "./guides";
import type { BriefingBeat, ReportSection, StoryPanel, StoryReport, TimelineItem } from "./report";
import { soften } from "./sanitize";

// ─── 안전한 접근 ─────────────────────────────────────────────────────────────

type Json = unknown;
const at = (value: Json, path: string): Json =>
  path.split(".").reduce<Json>((current, key) => {
    if (current === null || typeof current !== "object") return undefined;
    return (current as Record<string, Json>)[key];
  }, value);
const str = (value: Json) => (typeof value === "string" && value.trim() ? value.trim() : null);
const num = (value: Json) => (typeof value === "number" ? value : null);
const list = (value: Json): Json[] => (Array.isArray(value) ? value : []);

function sentences(text: string | null, count: number) {
  if (!text) return null;
  const parts = soften(text)
    .split(/(?<=[.!?。])\s+|\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.slice(0, count).join(" ") || null;
}

const endWithPeriod = (text: string) => (/[.!?…"」]$/.test(text) ? text : `${text}.`);

/** 비어 있을 수 있는 조각들을 잇는다. 빈 값이 섞여도 마침표만 남는 문장이 생기지 않게. */
const join = (...parts: Array<string | null>) => parts.filter(Boolean).join(" ") || null;
/** 값이 있을 때만 괄호를 연다 */
const paren = (value: string | null) => (value ? `(${value})` : "");
/** 값이 있을 때만 그 값을 쓴 구절을 만든다 */
const quoted = (value: string | null, build: (value: string) => string) => (value ? build(value) : "");

// ─── 명식 요약 ──────────────────────────────────────────────────────────────

const ELEMENT_VIRTUE: Record<FiveElement, { good: string; excess: string }> = {
  wood: { good: "배우고 새로 시작하는 힘", excess: "조급하게 벌이고 확장하려는 마음" },
  fire: { good: "표현하고 드러내는 활력", excess: "감정이 과열되어 앞서 나가는 말" },
  earth: { good: "믿음을 쌓고 사이를 잇는 힘", excess: "고집과 정체" },
  metal: { good: "정리하고 결단하는 힘", excess: "날 선 말과 단절" },
  water: { good: "돌아보고 쉬어 가는 힘", excess: "불안과 지나친 생각" },
};

function elementOf(value: Json): FiveElement | null {
  const text = str(value);
  return text ? toFiveElement(text) : null;
}

const POSITION_KO: Record<string, string> = { year: "년", month: "월", day: "일", hour: "시" };

interface Chart {
  name: string;
  modules: Record<string, Json>;
  pillar: (position: "year" | "month" | "day" | "hour") => Record<string, Json> | null;
  dayMaster: { char: string; element: string } | null;
  strength: string | null;
  strengthAnalysis: string | null;
  gyeokguk: { name: string; reasoning: string | null } | null;
  yongsin: { yong: FiveElement | null; hui: FiveElement | null; gi: FiveElement | null; reasoning: string | null; usage: string | null; huiUsage: string | null };
  counts: ReturnType<typeof parseElementCounts>;
  relations: Array<{ type: string; source: string; target: string; sourcePosition: string; targetPosition: string; meaning: string | null }>;
  relationSummary: string | null;
  goodSinsal: Array<{ name: string; description: string | null }>;
  cautionSinsal: Array<{ name: string; description: string | null }>;
  keywords: string[];
  strengths: Array<{ trait: string; basis: string | null }>;
  cautions: Array<{ trait: string; basis: string | null }>;
  decade: { list: Record<string, Json>[]; index: number; current: Record<string, Json> | null; next: Record<string, Json> | null };
  seun: { current: Record<string, Json> | null; next: Record<string, Json> | null };
  /** 연도별 흐름표가 쓰는 여섯 해 */
  seunYears: Record<string, Json>[];
  weoluns: Record<string, Json>[];
  yearForecast: { headline: string | null; advice: string | null };
}

function buildChart(name: string, modules: Record<string, Json>, birth: BirthProfile | null, today: Date): Chart {
  const pillar = (position: "year" | "month" | "day" | "hour") => {
    const value = at(modules, `fourPillars.${position}`);
    return value && typeof value === "object" ? (value as Record<string, Json>) : null;
  };
  const day = pillar("day");
  const decadeList = list(at(modules, "decadeFortune.list")) as Record<string, Json>[];
  const age = birth
    ? resolveCurrentAge(modules, { year: birth.birthYear, month: birth.birthMonth, day: birth.birthDay }, { year: today.getFullYear(), month: today.getMonth() + 1, day: today.getDate() })
    : num(at(modules, "evaluation.lifePhase.current.age")) ?? 0;
  const decadeIndex = findCurrentDecadeIndex(
    decadeList.map((item) => ({ startAge: num(item.startAge) ?? 0, full: str(item.full) ?? "" })),
    age,
  );

  const named = (items: Json[]) =>
    items
      .map((item) => ({ name: str(at(item, "name")), description: str(at(item, "description")) ?? str(at(item, "meaning")) }))
      .filter((item): item is { name: string; description: string | null } => Boolean(item.name));

  return {
    name,
    modules,
    pillar,
    dayMaster: day && str(day.sky)
      ? { char: str(day.sky)!, element: str(day.skyElement) ?? ELEMENT_LABEL[parseGanji(str(day.full) ?? "")?.stem.element ?? "earth"].ko }
      : null,
    strength: str(at(modules, "sinStrength.strength")) ?? str(at(modules, "gyeokguk.strength.level")),
    strengthAnalysis: sentences(str(at(modules, "sinStrength.analysis")), 2),
    gyeokguk: str(at(modules, "gyeokguk.name"))
      ? { name: str(at(modules, "gyeokguk.name"))!, reasoning: sentences(str(at(modules, "gyeokguk.reasoning")), 1) }
      : null,
    yongsin: {
      yong: elementOf(at(modules, "yongsin.yongsin.ko")),
      hui: elementOf(at(modules, "yongsin.huisin.ko")),
      gi: elementOf(at(modules, "yongsin.gisin.ko")),
      reasoning: sentences(str(at(modules, "yongsin.reasoning")), 1),
      usage: str(at(modules, "yongsin.usage")) ?? str(at(modules, "evaluation.yongsinGuide.yongsin.usage")),
      huiUsage: str(at(modules, "yongsin.huiUsage")) ?? str(at(modules, "evaluation.yongsinGuide.huisin.usage")),
    },
    counts: parseElementCounts(modules),
    relations: list(at(modules, "wongukInteraction.relations")).map((item) => ({
      type: str(at(item, "type")) ?? "",
      source: str(at(item, "source")) ?? "",
      target: str(at(item, "target")) ?? "",
      sourcePosition: str(at(item, "sourcePosition")) ?? "",
      targetPosition: str(at(item, "targetPosition")) ?? "",
      meaning: sentences(str(at(item, "meaning")), 1),
    })),
    relationSummary: str(at(modules, "wongukInteraction.summary")),
    goodSinsal: named(list(at(modules, "sinsal.angels"))),
    cautionSinsal: named(list(at(modules, "sinsal.devils"))),
    keywords: list(at(modules, "evaluation.personality.keywords")).map(str).filter((item): item is string => Boolean(item)),
    strengths: list(at(modules, "evaluation.personality.strengths"))
      .map((item) => ({ trait: str(at(item, "trait")), basis: str(at(item, "basis")) }))
      .filter((item): item is { trait: string; basis: string | null } => Boolean(item.trait)),
    cautions: list(at(modules, "evaluation.personality.cautions"))
      .map((item) => ({ trait: str(at(item, "trait")), basis: str(at(item, "basis")) }))
      .filter((item): item is { trait: string; basis: string | null } => Boolean(item.trait)),
    decade: { list: decadeList, index: decadeIndex, current: decadeList[decadeIndex] ?? null, next: decadeList[decadeIndex + 1] ?? null },
    seun: {
      current: (at(modules, "seun.currentSeun") as Record<string, Json>) ?? null,
      next: (at(modules, "seun.nextSeun") as Record<string, Json>) ?? null,
    },
    seunYears: list(at(modules, "seun.years")) as Record<string, Json>[],
    weoluns: [
      ...(list(at(modules, "weolun.upcomingWeoluns")) as Record<string, Json>[]),
      ...(list(at(modules, "weolun.yearWeoluns")) as Record<string, Json>[]),
    ],
    yearForecast: {
      headline: str(at(modules, "evaluation.yearForecast.headline")),
      advice: str(at(modules, "evaluation.yearForecast.advice")),
    },
  };
}

const elementKo = (element: FiveElement | null) => (element ? ELEMENT_LABEL[element].ko : "");

function dominantAndMissing(chart: Chart) {
  if (!chart.counts) return { dominant: [] as string[], missing: [] as string[] };
  const counts = chart.counts;
  const max = Math.max(...FIVE_ELEMENTS.map((element) => counts[element]));
  return {
    dominant: FIVE_ELEMENTS.filter((element) => counts[element] === max && max > 0).map((element) => ELEMENT_LABEL[element].ko),
    missing: FIVE_ELEMENTS.filter((element) => counts[element] === 0).map((element) => ELEMENT_LABEL[element].ko),
  };
}

function decadeLabel(item: Record<string, Json> | null) {
  if (!item) return null;
  return `${num(item.startAge) ?? "?"}세~ ${str(item.full) ?? ""} 대운`;
}

function fortuneTone(level: number | null): TimelineItem["tone"] {
  if (level === null) return "neutral";
  if (level >= 8) return "good";
  if (level <= 4) return "caution";
  return "neutral";
}

// ─── 답변 개인화 ────────────────────────────────────────────────────────────

const ANSWER_LINES: Record<string, Record<string, string>> = {
  whoEnded: {
    "제가 먼저": "이별을 먼저 꺼낸 쪽이 {name}님이라면, 그 사람은 '거절당했다'는 감정을 정리할 시간이 더 필요한 흐름이에요.",
    "그 사람이 먼저": "그 사람이 먼저 이별을 말했다면, 그 결정에는 {name}님 때문만이 아니라 그 사람 자신의 운 흐름이 함께 걸려 있어요.",
    "자연스럽게 멀어졌어요": "뚜렷한 계기 없이 멀어졌다면, 두 사람의 시기 흐름이 동시에 가라앉은 영향이 커요.",
  },
  contactStatus: {
    "완전히 끊겼어요": "연락이 끊긴 지금은 문을 두드리기보다, 다시 열릴 시기를 기다리며 내 자리를 단단히 하는 편이 유리해요.",
    "차단됐어요": "차단은 마음이 완전히 닫혔다는 뜻이기보다, 흔들리지 않으려는 방어일 때가 많아요. 지금 벽을 두드리면 방어만 두꺼워져요.",
    "가끔 연락해요": "가끔 닿는 연락은 불씨가 남아 있다는 신호예요. 다만 무게를 싣는 대화는 흐름이 바뀐 뒤로 미루는 게 좋아요.",
    "계속 연락하고 있어요": "연락이 이어지고 있다면, 관계의 결을 바꾸는 한마디를 언제 꺼낼지가 핵심이에요.",
  },
  wish: {
    "다시 만나고 싶어요": "다시 만나고 싶은 마음이 크다면, 조급함이 가장 큰 변수라는 점을 기억해 주세요.",
    "그 사람 마음만 알고 싶어요": "그 사람 마음을 알고 싶은 거라면, 아래 근거들이 그 사람의 결을 이해하는 지도가 되어 줄 거예요.",
    "후회 없이 정리하고 싶어요": "후회 없이 정리하고 싶다면, 이 풀이는 붙잡을 이유보다 놓아도 되는 이유를 찾는 데 쓰셔도 좋아요.",
  },
  concern: {
    "자주 싸워요": "자주 부딪힌다면, 누가 옳은지보다 어떤 기운끼리 부딪히는지를 먼저 보는 게 도움이 돼요.",
    "마음이 식은 것 같아요": "마음이 식은 듯 느껴진다면, 두 사람의 시기 흐름이 동시에 가라앉은 영향일 수 있어요.",
    "미래가 걱정돼요": "미래가 걱정된다면, 두 사람이 서로의 빈 오행을 채우는 방식에서 답을 찾을 수 있어요.",
    "더 깊어지고 싶어요": "더 깊어지고 싶다면, 서로를 끌어당기는 합의 자리를 일상에서 자주 만들어 주세요.",
    "진로·일": "요즘 일과 진로가 가장 마음에 걸린다면, 대운의 방향과 격국이 가리키는 쪽을 먼저 보세요.",
    "사람·관계": "요즘 사람 문제가 마음에 걸린다면, 원국의 형충이 어떤 자리에서 부딪히는지가 실마리예요.",
    돈: "요즘 돈이 가장 마음에 걸린다면, 용신의 결로 쓰는 돈과 새는 돈을 나눠 보는 게 출발점이에요.",
    "나 자신": "요즘 나 자신이 가장 궁금하다면, 일간과 격국이 말하는 타고난 결부터 천천히 읽어 보세요.",
  },
  goal: {
    "수능·내신": "수능·내신을 준비한다면, 한 해 전체보다 월운의 오르내림에 맞춰 공부 강도를 조절하는 게 핵심이에요.",
    "공무원·임용": "공무원·임용처럼 긴 호흡의 시험이라면, 세운이 받쳐 주는 해에 승부를 거는 전략이 맞아요.",
    "자격증·어학": "자격증·어학처럼 기간이 짧은 목표라면, 힘이 실리는 달에 시험 일정을 잡는 것만으로도 차이가 나요.",
    "대학원·유학": "대학원·유학처럼 환경이 크게 바뀌는 목표라면, 이동과 변화의 흐름이 열리는 시기를 함께 보세요.",
  },
  struggle: {
    "집중이 안 돼요": "집중이 안 된다면 의지 문제가 아니라, 타고난 공부 체질과 방식이 어긋나 있을 가능성이 커요.",
    "꾸준히 못 해요": "꾸준함이 어렵다면, 오래 앉아 있기보다 짧게 끊어 반복하는 구조가 이 명식에 더 맞아요.",
    "시험만 보면 긴장해요": "시험에서 긴장한다면, 실력보다 과열되는 기운을 식히는 루틴이 먼저예요.",
    "방향을 모르겠어요": "방향이 흐리다면, 격국과 십성이 가리키는 결부터 확인하고 목표를 좁혀 보세요.",
  },
  childConcern: {
    "집중력·습관": "집중력과 습관이 걱정이라면, 아이의 기질에 맞는 공부 리듬을 먼저 찾아 주는 게 잔소리보다 효과적이에요.",
    성적: "성적이 걱정이라면, 지금 성적보다 공부에 힘이 붙는 시기와 방식을 먼저 보는 게 도움이 돼요.",
    "진로 선택": "진로가 고민이라면, 아이가 이미 가진 강점이 어느 쪽을 가리키는지부터 함께 보세요.",
    "친구·마음": "친구 관계와 마음이 걱정이라면, 아이가 기운을 채우는 방식을 이해하는 것이 첫걸음이에요.",
  },
  childStyle: {
    "스스로 하는 편": "스스로 하는 아이라면, 부모의 역할은 방향을 정해 주기보다 흐름을 믿어 주는 쪽이에요.",
    "시켜야 하는 편": "시켜야 움직이는 아이라면, 지시보다 작은 목표와 약속을 함께 정하는 방식이 더 오래 가요.",
    "잘하다가 금방 지쳐요": "잘하다가 금방 지친다면, 기운을 몰아 쓰고 방전되는 결이라 쉬는 시간을 계획에 넣어야 해요.",
    "아직 잘 모르겠어요": "아직 아이를 잘 모르겠다면, 이 보고서의 기질 풀이를 관찰의 기준으로 삼아 보세요.",
  },
  conflict: {
    "공부·성적": "공부 이야기로 부딪힌다면, 결과를 묻기보다 과정을 묻는 말로 바꾸는 것만으로 분위기가 달라져요.",
    생활습관: "생활습관으로 부딪힌다면, 규칙을 통보하기보다 아이와 함께 정하는 과정이 필요해요.",
    "휴대폰·게임": "휴대폰·게임으로 부딪힌다면, 금지보다 대신 채울 즐거움을 함께 찾는 쪽이 이 두 사람에게 맞아요.",
    "감정 표현": "감정 표현으로 부딪힌다면, 두 사람이 기운을 드러내는 속도가 다르다는 걸 먼저 알아 두세요.",
  },
};

function answerLine(reading: Reading, questionId: string) {
  // 이 상품에서 실제로 물은 질문의 답만 쓴다
  const product = getReport(reading.reportSlug);
  if (product && !product.questions.some((question) => question.id === questionId)) return null;
  const answer = reading.answers[questionId];
  const template = answer ? ANSWER_LINES[questionId]?.[answer] : undefined;
  return template ? template.replaceAll("{name}", reading.subject.name) : null;
}

function storyEcho(reading: Reading) {
  const story = reading.answers.detail?.trim();
  if (!story) return null;
  const snippet = story.length > 38 ? `${story.slice(0, 38)}…` : story;
  return `적어 주신 "${snippet}" 이야기와 명식을 겹쳐 보면, 아래 흐름이 그 장면과 맞닿아 있어요.`;
}

// ─── 장 빌더 ────────────────────────────────────────────────────────────────

interface Context {
  report: ReportProduct;
  reading: Reading;
  me: Chart;
  partner: Chart | null;
  cross: { prose: string | null; matches: Array<{ label: string; note: string }>; hap: number; clash: number; lackingSelf: string[]; lackingPartner: string[]; covered: number | null } | null;
  wealth: Record<string, Json> | null;
  health: Record<string, Json> | null;
}

type Builder = (ctx: Context, title: string) => ReportSection;

const section = (title: string, lead: string, body: Array<string | null>, evidence: Array<ReportSection["evidence"][number] | null>, panel: StoryPanel | null = null): ReportSection => ({
  title,
  lead: endWithPeriod(lead),
  body: body.filter((paragraph): paragraph is string => Boolean(paragraph)).map(endWithPeriod),
  evidence: evidence.filter(
    (item, index, all): item is ReportSection["evidence"][number] =>
      Boolean(item) && all.findIndex((other) => other?.label === item!.label) === index,
  ),
  panel,
});

function pillarEvidence(chart: Chart, position: "year" | "month" | "day" | "hour", who = "") {
  const pillar = chart.pillar(position);
  if (!pillar || !str(pillar.full)) return null;
  const meaning = str(at(pillar, "twelveFortuneInterpretation.positionMeaning"));
  const energy = sentences(str(at(pillar, "twelveFortuneInterpretation.energy")), 1);
  return {
    label: `${who}${POSITION_KO[position]}주 ${str(pillar.full)} · ${str(pillar.earthSippiSeong) ?? str(pillar.sippiSeong) ?? ""} · ${str(pillar.twelveStage) ?? ""}`.replace(/ · $/, ""),
    detail: soften([energy, meaning ? `자리의 뜻: ${meaning}` : null].filter(Boolean).join(" ") || "원국의 뼈대를 이루는 기둥이에요."),
  };
}

const natal: Builder = ({ me, reading }, title) => {
  const { dominant, missing } = dominantAndMissing(me);
  const day = me.pillar("day");
  return section(
    title,
    `${me.name}님은 ${me.dayMaster ? `${me.dayMaster.char}${me.dayMaster.element} 일간` : "고유한 일간"}${me.gyeokguk ? `, ${me.gyeokguk.name}` : ""}${me.strength ? ` · ${me.strength}` : ""}의 그릇이에요`,
    [
      me.strengthAnalysis,
      day
        ? join(`나를 뜻하는 일주는 ${str(day.full)}이고, 일지(배우자·내 속마음의 자리)에는 ${str(day.earthSippiSeong) ?? "고유한"} 기운이 앉아 있어요.`, sentences(str(at(day, "twelveFortuneInterpretation.energy")), 1))
        : null,
      dominant.length
        ? join(
            `오행으로는 ${dominant.join("·")} 기운이 두드러지고${missing.length ? ` ${missing.join("·")} 기운은 원국에 드러나지 않아요` : " 전체가 고르게 흐르는 편이에요"}.`,
            me.keywords.length ? `그래서 "${me.keywords.slice(0, 3).join(", ")}" 같은 결이 먼저 보여요.` : null,
          )
        : null,
      storyEcho(reading),
    ],
    [
      pillarEvidence(me, "day"),
      pillarEvidence(me, "month"),
      me.gyeokguk ? { label: `격국 ${me.gyeokguk.name}`, detail: me.gyeokguk.reasoning ?? "월령을 기준으로 정한 사주의 틀이에요." } : null,
      me.strength ? { label: `신강약 · ${me.strength}`, detail: me.strengthAnalysis ?? "일간이 받는 도움의 정도예요." } : null,
    ],
    "pillars",
  );
};

const elementsAndYongsin: Builder = ({ me }, title) => {
  const { dominant, missing } = dominantAndMissing(me);
  const yong = me.yongsin.yong;
  return section(
    title,
    yong ? `${me.name}님의 균형을 잡아 주는 기운은 ${elementKo(yong)}, 곧 ${ELEMENT_VIRTUE[yong].good}이에요` : "오행의 치우침을 알면 힘을 쓸 방향이 보여요",
    [
      dominant.length ? `원국은 ${dominant.join("·")} 기운이 가장 크고${missing.length ? `, ${missing.join("·")} 기운이 비어 있어요` : ""}. 넘치는 쪽은 강점이 되지만, 한쪽으로 쏠리면 ${dominant[0] ? ELEMENT_VIRTUE[toFiveElement(dominant[0])!].excess : "과열"}로 번지기 쉬워요.` : null,
      me.yongsin.reasoning ? `용신은 ${josa(elementKo(yong) ?? "", "으로/로")} 읽혀요. ${me.yongsin.reasoning}` : null,
      me.yongsin.usage ? `생활에서는 ${me.yongsin.usage} 같은 영역이 용신의 결과 맞닿아요.${me.yongsin.huiUsage ? ` 보조하는 희신의 결은 ${me.yongsin.huiUsage}예요.` : ""}` : null,
      me.yongsin.gi ? `반대로 기신 ${elementKo(me.yongsin.gi)}의 결, 즉 ${ELEMENT_VIRTUE[me.yongsin.gi].excess}은 경계하는 편이 좋아요.` : null,
    ],
    [
      yong ? { label: `용신 ${elementKo(yong)}${me.yongsin.hui ? ` · 희신 ${elementKo(me.yongsin.hui)}` : ""}`, detail: me.yongsin.reasoning ?? "사주의 균형을 맞추는 오행이에요." } : null,
      me.yongsin.gi ? { label: `기신 ${elementKo(me.yongsin.gi)}`, detail: `${ELEMENT_VIRTUE[me.yongsin.gi].excess}이 커질 때 흐름이 꼬이기 쉬워요.` } : null,
      dominant.length ? { label: `오행 편중 · ${dominant.join("·")} 강 / ${missing.join("·") || "빈 기운 없음"}`, detail: "원국 여덟 글자와 지장간을 합친 분포예요." } : null,
    ],
    "elements",
  );
};

const natalRelations: Builder = ({ me, reading }, title) => {
  const top = me.relations.slice(0, 3);
  // 엔진의 summary 는 "…있다"로 끝나는 메모체다. 보고서 본문은 말하듯 쓰므로 수를 세어 다시 쓴다.
  const bound = me.relations.filter((relation) => relation.type.includes("합")).length;
  const friction = me.relations.length - bound;
  return section(
    title,
    top[0]
      ? `원국 안에서 가장 세게 맞물리는 자리는 ${top[0].sourcePosition}과 ${top[0].targetPosition}이에요`
      : "원국 안의 밀고 당기는 힘이 반복되는 패턴을 만들어요",
    [
      me.relations.length
        ? `여덟 글자 사이에서 서로 묶이는 자리가 ${bound}곳, 부딪히거나 어긋나는 자리가 ${friction}곳 보여요. ${friction > bound ? "묶이기보다 부딪히는 쪽이 많아, 한자리에 오래 머물기보다 옮기고 바꾸며 나아가는 결이에요." : "부딪힘보다 묶이는 쪽이 많아, 한번 정한 자리와 사람을 오래 끌고 가는 결이에요."}`
        : null,
      top[0]
        ? join(
            `${top[0].sourcePosition} ${josa(top[0].source, "과/와")} ${top[0].targetPosition} ${top[0].target}이 ${top[0].type}으로 얽혀요.`,
            top[0].meaning,
          )
        : null,
      me.strengths.length ? `강점으로는 ${me.strengths.slice(0, 2).map((item) => item.trait).join(", ")}이 돋보여요.` : null,
      me.cautions.length ? `다만 ${me.cautions.map((item) => item.trait).join(", ")} 같은 결이 관계와 일에서 같은 장면을 반복하게 만들 수 있어요.` : null,
      answerLine(reading, "pattern") ?? answerLine(reading, "concern"),
    ],
    [
      ...top.slice(0, 2).map((relation) => ({ label: `${relation.sourcePosition} ${relation.source} ↔ ${relation.targetPosition} ${relation.target} · ${relation.type}`, detail: relation.meaning ?? "원국 안의 긴장 관계예요." })),
      me.cautionSinsal[0] ? { label: `신살 ${me.cautionSinsal[0].name}`, detail: sentences(me.cautionSinsal[0].description, 1) ?? "조심하면 좋은 결이에요." } : null,
      me.goodSinsal[0] ? { label: `신살 ${me.goodSinsal[0].name}`, detail: sentences(me.goodSinsal[0].description, 1) ?? "도움이 되는 결이에요." } : null,
    ],
  );
};

const crossRelations: Builder = ({ me, partner, cross, reading }, title) => {
  const partnerName = partner?.name ?? "그 사람";
  if (!cross || !partner) return natalRelations({ me, partner, cross, reading, report: undefined as never, wealth: null, health: null }, title);
  return section(
    title,
    cross.hap > cross.clash
      ? `${me.name}님과 ${partnerName}님 사이에는 끌림(합)이 긴장보다 크게 남아 있어요`
      : `${me.name}님과 ${partnerName}님 사이는 끌림보다 부딪힘(형·충·해)이 먼저 드러나는 사이예요`,
    [
      `두 사람의 명식을 겹쳐 보면 끌림을 뜻하는 합이 ${cross.hap}건, 부딪힘을 뜻하는 형·충·파·해가 ${cross.clash}건 보여요`,
      cross.matches[0] ? `가장 뚜렷한 연결은 「${cross.matches[0].label}」이에요. ${soften(cross.matches[0].note)}` : null,
      cross.lackingSelf.length || cross.lackingPartner.length
        ? `오행으로 보면 ${me.name}님에게 비어 있는 ${cross.lackingSelf.join("·") || "기운"}을 ${partnerName}님이, ${partnerName}님에게 비어 있는 ${cross.lackingPartner.join("·") || "기운"}을 ${me.name}님이 채우는 구조예요. 서로가 서로에게 없는 것을 가진 사이라 끌림이 컸던 거예요.`
        : null,
      answerLine(reading, "whoEnded") ?? answerLine(reading, "concern"),
      storyEcho(reading),
    ],
    [
      ...cross.matches.slice(0, 2).map((match) => ({ label: match.label, detail: soften(match.note) })),
      pillarEvidence(me, "day", `${me.name} · `),
      pillarEvidence(partner, "day", `${partnerName} · `),
    ],
    "pillars",
  );
};

const partnerHeart: Builder = ({ partner, reading, me }, title) => {
  if (!partner) return natal({ me, partner, reading } as Context, title);
  const day = partner.pillar("day");
  return section(
    title,
    `${partner.name}님은 ${partner.dayMaster ? `${partner.dayMaster.char}${partner.dayMaster.element} 일간` : "고유한 일간"}${partner.strength ? ` · ${partner.strength}` : ""}, 마음을 쉽게 드러내기보다 안에서 정리하는 결이에요`,
    [
      day
        ? join(
            `${partner.name}님의 속마음 자리인 일지에는 ${str(day.earthSippiSeong) ?? "고유한"} 기운이 앉아 있어요.`,
            quoted(str(at(day, "twelveFortuneInterpretation.phase")) ?? str(day.twelveStage), (phase) => `12운성으로는 "${phase}"의 상태예요.`) || null,
            sentences(str(at(day, "twelveFortuneInterpretation.energy")), 2),
          )
        : null,
      day && str(at(day, "twelveFortuneInterpretation.positionMeaning")) ? `전통적으로 이 자리는 "${soften(str(at(day, "twelveFortuneInterpretation.positionMeaning"))!)}"로 읽어요. 관계를 오래 안정적으로 끌고 가는 데 스스로도 부담을 느끼기 쉬운 결이에요.` : null,
      partner.yongsin.reasoning ? `${partner.name}님에게 필요한 기운은 ${josa(elementKo(partner.yongsin.yong) ?? "", "이에요/예요")}. ${partner.yongsin.reasoning} 그래서 몰아붙이는 말보다 기댈 수 있는 안정감에 반응해요.` : null,
      answerLine(reading, "contactStatus"),
    ],
    [
      pillarEvidence(partner, "day", `${partner.name} · `),
      partner.gyeokguk ? { label: `${partner.name} · 격국 ${partner.gyeokguk.name}`, detail: partner.gyeokguk.reasoning ?? "상대 사주의 틀이에요." } : null,
      partner.yongsin.yong ? { label: `${partner.name} · 용신 ${elementKo(partner.yongsin.yong)}`, detail: partner.yongsin.reasoning ?? "상대에게 필요한 기운이에요." } : null,
      partner.cautionSinsal[0] ? { label: `${partner.name} · 신살 ${partner.cautionSinsal[0].name}`, detail: sentences(partner.cautionSinsal[0].description, 1) ?? "" } : null,
    ],
  );
};

const partnerNow: Builder = ({ partner, me, reading }, title) => {
  if (!partner) return timing({ me, partner, reading } as Context, title);
  const decade = partner.decade.current;
  const seun = partner.seun.current;
  return section(
    title,
    decade ? `${partner.name}님은 지금 ${decadeLabel(decade)} 안에서 "${str(at(decade, "twelveFortune.keyword")) ?? str(at(decade, "twelveFortune.name")) ?? "변화"}"의 시기를 지나고 있어요` : `${partner.name}님의 지금 운은 스스로를 추스르는 쪽에 가까워요`,
    [
      decade
        ? join(
            `${partner.name}님의 현재 대운은 ${str(decade.full)}${paren(str(at(decade, "sipseong.gan")))}이고,`,
            quoted(str(at(decade, "twelveFortune.phase")), (phase) => `"${phase}"의 흐름이에요.`) || "지금의 결을 지나는 중이에요.",
            "마음이 없어서가 아니라, 관계에 쓸 힘이 다른 곳으로 흘러가 있는 시기일 수 있어요.",
          )
        : null,
      seun && str(seun.interpretation) ? `올해 ${str(seun.ganji)} 세운에서 ${partner.name}님은 "${soften(str(seun.interpretation)!)}"의 결을 살아요.` : null,
      partner.cautions.length ? `${partner.name}님이 스스로 조심하는 부분은 ${partner.cautions.map((item) => item.trait).join(", ")}이에요. 그래서 먼저 손을 내밀기보다 상대의 반응을 오래 지켜보는 편이에요.` : null,
      answerLine(reading, "wish"),
    ],
    [
      decade
        ? {
            label: [`${partner.name} · 현재 ${decadeLabel(decade)}`, str(at(decade, "twelveFortune.name"))].filter(Boolean).join(" · "),
            detail: str(at(decade, "twelveFortune.phase")) ?? "상대의 10년 흐름이에요.",
          }
        : null,
      seun ? { label: `${partner.name} · ${num(seun.year) ?? ""} ${str(seun.ganji) ?? ""} 세운`, detail: soften(str(seun.interpretation) ?? "상대의 올해 흐름이에요.") } : null,
      partner.goodSinsal[0] ? { label: `${partner.name} · 신살 ${partner.goodSinsal[0].name}`, detail: sentences(partner.goodSinsal[0].description, 1) ?? "" } : null,
    ],
  );
};

function timelineFor(chart: Chart): TimelineItem[] {
  const items: TimelineItem[] = [];
  const yongKo = elementKo(chart.yongsin.yong);
  const giKo = elementKo(chart.yongsin.gi);
  const englishToKo = (value: Json) => {
    const element = elementOf(value);
    return element ? ELEMENT_LABEL[element].ko : null;
  };

  chart.weoluns
    .filter((item) => item.isCurrentMonth !== true)
    .slice(0, 3)
    .forEach((month) => {
      const jiKo = englishToKo(month.jiElement);
      const tone: TimelineItem["tone"] = jiKo && jiKo === yongKo ? "good" : jiKo && jiKo === giKo ? "caution" : "neutral";
      items.push({
        period: `${str(month.monthLabel) ?? ""} · ${str(month.ganji) ?? ""} 월운`,
        tone,
        title: tone === "good" ? "용신의 결이 들어오는 달" : tone === "caution" ? "속도를 늦출 달" : "고르게 흐르는 달",
        note: soften(str(month.interpretation) ?? `${str(at(month, "sipseongRelation.gan")) ?? ""} 기운이 드는 달이에요.`),
      });
    });

  for (const [label, seun] of [["올해", chart.seun.current], ["내년", chart.seun.next]] as const) {
    if (!seun) continue;
    const tone = fortuneTone(num(at(seun, "twelveFortune.level")));
    const relation = list(seun.hapChungRelations)[0];
    items.push({
      period: `${num(seun.year) ?? label} ${str(seun.ganji) ?? ""} 세운`,
      tone,
      title: soften(str(seun.interpretation)?.split("—")[0]?.trim() ?? `${label}의 흐름`).slice(0, 18),
      note: [str(at(seun, "twelveFortune.phase")), relation ? sentences(str(at(relation, "meaning")), 1) : null].filter(Boolean).map((text) => soften(text!)).join(" "),
    });
  }

  for (const decade of [chart.decade.current, chart.decade.next]) {
    if (!decade) continue;
    items.push({
      period: decadeLabel(decade)!,
      tone: fortuneTone(num(at(decade, "twelveFortune.level"))),
      title: ([str(at(decade, "sipseong.gan")), str(at(decade, "twelveFortune.keyword")) ?? str(at(decade, "twelveFortune.name"))].filter(Boolean).join(" · ") || "10년의 배경").slice(0, 18),
      note: str(at(decade, "twelveFortune.phase")) ?? "10년 단위의 큰 흐름이에요.",
    });
  }
  return items.slice(0, 6);
}

const timing: Builder = ({ me, reading }, title) => {
  const decade = me.decade.current;
  const next = me.decade.next;
  const seun = me.seun.current;
  const nextSeun = me.seun.next;
  const good = timelineFor(me).find((item) => item.tone === "good");
  return section(
    title,
    good ? `가장 먼저 힘이 실리는 때는 ${good.period}이에요` : `${decade ? decadeLabel(decade) : "지금의 대운"} 안에서 흐름이 천천히 바뀌고 있어요`,
    [
      decade
        ? `${me.name}님은 지금 ${decadeLabel(decade)}${paren(str(at(decade, "sipseong.gan")))} 안에 있어요. ${quoted(str(at(decade, "twelveFortune.phase")), (phase) => `12운성으로는 "${phase}"의 때라, `)}${fortuneTone(num(at(decade, "twelveFortune.level"))) === "caution" ? "새로 벌이기보다 거두고 정리할수록 다음 흐름이 가벼워져요" : "움직인 만큼 결과가 따라오는 흐름이에요"}.`
        : null,
      seun ? `올해 ${str(seun.ganji)} 세운은 "${soften(str(seun.interpretation) ?? "")}"의 해예요.${nextSeun ? ` 이어지는 ${num(nextSeun.year)} ${str(nextSeun.ganji)} 세운은 "${soften(str(nextSeun.interpretation) ?? "")}"로 결이 바뀌어요.` : ""}` : null,
      next ? `${num(next.startAge)}세부터는 ${str(next.full)} 대운으로 넘어가며 ${quoted(str(at(next, "twelveFortune.phase")), (phase) => `"${phase}"의 `)}흐름이 열려요.` : null,
      answerLine(reading, "breakupPeriod") ? null : null,
    ],
    [
      decade
        ? {
            label: [`현재 ${decadeLabel(decade)}`, str(at(decade, "twelveFortune.name"))].filter(Boolean).join(" · "),
            detail: str(at(decade, "twelveFortune.phase")) ?? "열 해 단위로 깔리는 배경이에요.",
          }
        : null,
      seun ? { label: `${num(seun.year)} ${str(seun.ganji)} 세운`, detail: soften(str(seun.interpretation) ?? "") } : null,
      list(seun?.hapChungRelations)[0]
        ? { label: `세운 ${str(at(list(seun?.hapChungRelations)[0], "type"))} · ${str(at(list(seun?.hapChungRelations)[0], "targetPosition"))}`, detail: sentences(str(at(list(seun?.hapChungRelations)[0], "meaning")), 1) ?? "" }
        : null,
      good ? { label: good.period, detail: good.note } : null,
    ],
    "decade",
  );
};

const cautionSection: Builder = ({ me, reading, report }, title) => {
  const gi = me.yongsin.gi;
  const relation = list(me.seun.current?.hapChungRelations)[0];
  const isReunion = report.category === "reunion";
  return section(
    title,
    isReunion
      ? `지금 먼저 연락하면 ${gi ? `기신 ${elementKo(gi)}의 결(${ELEMENT_VIRTUE[gi].excess})` : "조급함"}이 앞서며 마음이 더 멀어지기 쉬워요`
      : `조심할 지점은 ${me.cautions[0]?.trait ?? (gi ? ELEMENT_VIRTUE[gi].excess : "조급함")}이에요`,
    [
      gi ? `${me.name}님의 명식에서 흐름을 꼬이게 하는 기운은 ${elementKo(gi)}이에요. 감정이 올라올 때 ${ELEMENT_VIRTUE[gi].excess}이 앞서면, 좋은 의도도 부담으로 전해지기 쉬워요.` : null,
      relation ? `올해 세운은 원국 ${josa(str(at(relation, "targetPosition")) ?? "", "과/와")} ${josa(str(at(relation, "type")) ?? "", "으로/로")} 얽혀요. ${sentences(str(at(relation, "meaning")), 2) ?? ""}` : null,
      me.cautions.length ? `스스로도 ${me.cautions.map((item) => item.trait).join(", ")}의 결을 알고 있다면, 결정적인 말은 하루 묵힌 뒤 꺼내는 습관이 가장 강력한 처방이에요.` : null,
      isReunion ? answerLine(reading, "contactStatus") : answerLine(reading, "concern"),
    ],
    [
      gi ? { label: `기신 ${elementKo(gi)}`, detail: `${ELEMENT_VIRTUE[gi].excess}이 커질수록 흐름이 어긋나요.` } : null,
      relation ? { label: `${num(me.seun.current?.year)} ${str(me.seun.current?.ganji)} 세운 · ${str(at(relation, "type"))}`, detail: sentences(str(at(relation, "meaning")), 1) ?? "" } : null,
      me.cautionSinsal[0] ? { label: `신살 ${me.cautionSinsal[0].name}`, detail: sentences(me.cautionSinsal[0].description, 1) ?? "" } : null,
      me.cautions[0] ? { label: `성향 주의 · ${me.cautions[0].trait}`, detail: me.cautions[0].basis ?? "명식의 성향 평가에서 나온 주의점이에요." } : null,
    ],
  );
};

const actionSection: Builder = ({ me, reading, partner }, title) => {
  const yong = me.yongsin.yong;
  return section(
    title,
    yong ? `용신 ${elementKo(yong)}의 결, 곧 ${ELEMENT_VIRTUE[yong].good}으로 하루를 채우는 것이 가장 현실적인 한 걸음이에요` : "내 흐름을 단단히 세우는 것이 첫걸음이에요",
    [
      yong ? `${me.name}님에게 힘이 되는 기운은 ${josa(elementKo(yong) ?? "", "이에요/예요")}. ${me.yongsin.usage ? `${me.yongsin.usage} 같은 영역에서 작은 성취를 쌓으면` : "이 기운을 일상에서 자주 쓰면"} 흔들리던 마음이 제자리를 찾아요.` : null,
      me.strengths.length ? `이미 가진 강점도 있어요. ${me.strengths.slice(0, 2).map((item) => item.trait).join(", ")} — 이 결을 드러내는 자리를 스스로 고르세요.` : null,
      partner ? `${partner.name}님에게는 ${elementKo(partner.yongsin.yong)}의 결(${partner.yongsin.yong ? ELEMENT_VIRTUE[partner.yongsin.yong].good : "안정감"})이 필요해요. 다가간다면 그 결로 전하는 말이 가장 오래 남아요.` : null,
      me.yearForecast.advice ? `올해의 조언은 이렇게 요약돼요. "${me.yearForecast.advice}"` : null,
      answerLine(reading, "wish"),
    ],
    [
      yong ? { label: `용신 ${elementKo(yong)} · 활용`, detail: me.yongsin.usage ?? ELEMENT_VIRTUE[yong].good } : null,
      me.strengths[0] ? { label: `강점 · ${me.strengths[0].trait}`, detail: me.strengths[0].basis ?? "성향 평가에서 나온 강점이에요." } : null,
      me.yearForecast.headline ? { label: me.yearForecast.headline, detail: me.yearForecast.advice ?? "올해 기운의 요약이에요." } : null,
    ],
  );
};

// ─── 오행 생극 ──────────────────────────────────────────────────────────────
// 엔진이 재물·건강 모듈을 따로 내지 않으므로, 십성과 오행 분포에서 직접 끌어낸다.

const GENERATES: Record<FiveElement, FiveElement> = { wood: "fire", fire: "earth", earth: "metal", metal: "water", water: "wood" };
const CONTROLS: Record<FiveElement, FiveElement> = { wood: "earth", earth: "water", water: "fire", fire: "metal", metal: "wood" };

/** 장부와 생활의 결 — 오행이 몸에서 어디로 기우는지 */
const ELEMENT_BODY: Record<FiveElement, { organ: string; excess: string; lack: string; care: string }> = {
  wood: { organ: "간·담", excess: "어깨와 턱에 힘이 들어가고 눈이 쉽게 뻑뻑해져요", lack: "결정을 미루다 피로가 쌓이기 쉬워요", care: "스트레칭과 산책처럼 몸을 길게 펴는 움직임" },
  fire: { organ: "심장·소장", excess: "잠이 얕아지고 가슴이 두근거리기 쉬워요", lack: "의욕이 쉽게 식고 손발이 차요", care: "잠드는 시각을 고정하고 늦은 밤의 화면을 줄이는 일" },
  earth: { organ: "비장·위", excess: "생각이 많아 소화가 더뎌지기 쉬워요", lack: "끼니가 불규칙해지면 금세 지쳐요", care: "따뜻하고 규칙적인 식사와 식후의 짧은 걷기" },
  metal: { organ: "폐·대장", excess: "긴장이 호흡을 얕게 만들어요", lack: "환절기에 목과 코가 먼저 반응해요", care: "깊게 내쉬는 호흡과 건조하지 않은 공기" },
  water: { organ: "신장·방광", excess: "밤에 생각이 길어지며 체력이 새요", lack: "물을 적게 마시고 허리가 쉽게 뻐근해져요", care: "충분한 수분과 허리·하체를 데우는 습관" },
};

/** 일간이 극하는 오행 = 재성. 재물을 뜻하는 자리다. */
const wealthElementOf = (chart: Chart) => {
  const me = toFiveElement(chart.dayMaster?.element ?? "");
  return me ? CONTROLS[me] : null;
};

/** 원국에서 어떤 십성 무리가 몇 자리인지 */
const groupCount = (chart: Chart, group: string) => sipseongGroups(chart).find(([name]) => name === group)?.[1] ?? 0;

const wealthStructure: Builder = ({ me, wealth }, title) => {
  const element = wealthElementOf(me);
  const jae = groupCount(me, "재성");
  const bigyeop = groupCount(me, "비겁");
  const siksang = groupCount(me, "식상");
  // 비겁이 재성보다 많으면 사람과 돈이 얽히며 새기 쉽다(탈재). 모듈이 있으면 그 판정을 우선한다.
  const talJae = at(wealth, "natalWealth.talJaeRisk") === true || (bigyeop > 0 && bigyeop > jae);
  const canCarry = at(wealth, "carryCapacity.canCarry") === true || (me.strength?.includes("신강") ?? false);
  return section(
    title,
    element
      ? `${me.name}님의 재물은 ${elementKo(element)} 기운의 자리에 있고, ${canCarry ? "들어온 것을 감당할 힘이 있는 구조예요" : "담을 그릇을 먼저 키워야 하는 구조예요"}`
      : "재물의 길목은 내가 무엇을 다룰 수 있는 사람인지에서 갈려요",
    [
      element
        ? `일간 ${josa(`${me.dayMaster?.char ?? ""}${me.dayMaster?.element ?? ""}`, "이/가")} 다스리는 기운이 ${elementKo(element)}이라, 명리에서는 이 자리를 재성이라 불러요. 원국에 ${jae}자리 있어요.${jae === 0 ? " 타고난 재성이 드러나지 않는다는 건 돈이 없다는 뜻이 아니라, 돈이 들어오는 길을 스스로 만들어야 한다는 뜻이에요." : ""}`
        : null,
      siksang > 0 && jae > 0
        ? "식상(만들고 표현하는 힘)과 재성이 함께 있어, 내가 만든 결과물이 그대로 값이 되는 식상생재의 흐름이에요. 남의 자리에서 받는 돈보다 내 이름으로 만든 것에서 오는 돈이 커요."
        : siksang > 0
          ? "식상(만들고 표현하는 힘)이 뚜렷해요. 당장의 재성이 약해도, 만들어 내는 일을 오래 쌓으면 그것이 재물의 길이 돼요."
          : null,
      talJae
        ? `비겁(나와 같은 편의 기운)이 ${bigyeop}자리로 재성보다 많아요. 사람과 돈이 섞이면 새기 쉬운 결이라, 보증·동업·빌려주는 돈에서 가장 많이 잃어요.`
        : canCarry
          ? "일간의 힘이 넉넉해, 큰 돈이 들어와도 휘둘리기보다 다루는 쪽에 가까워요."
          : "일간의 힘이 넉넉한 편은 아니라, 한 번에 크게 벌이기보다 감당할 크기로 나눠 가는 편이 유리해요.",
      sentences(str(at(wealth, "prose")), 2),
    ],
    [
      element ? { label: `재성 ${elementKo(element)} · ${jae}자리`, detail: `일간 ${josa(me.dayMaster?.element ?? "", "이/가")} 극하는 오행이라 재물을 뜻해요.` } : null,
      talJae ? { label: `비겁 ${bigyeop}자리 · 탈재 신호`, detail: "재성보다 비겁이 많아 사람을 통해 재물이 나가기 쉬운 구조예요." } : null,
      me.strength ? { label: `신강약 · ${me.strength}`, detail: me.strengthAnalysis ?? "재물을 감당하는 힘의 기준이에요." } : null,
    ],
    "pillars",
  );
};

const wealthTiming: Builder = ({ me, wealth }, title) => {
  const element = wealthElementOf(me);
  const layers = (list(at(wealth, "fortuneLayers")) as Record<string, Json>[]).sort((a, b) => (num(a.priority) ?? 9) - (num(b.priority) ?? 9));
  const favorable = layers.filter((layer) => layer.favorable === true);
  // 모듈이 없으면 대운·세운 간지에 재성 오행이 드는 때를 직접 고른다
  const carries = (ganji: string | null) => Boolean(element && ganji && ganji.length > 0 && toFiveElement(ganji) === element);
  const decadeHit = me.decade.list.find((item) => carries(str(at(item, "ganElement"))) || carries(str(at(item, "jiElement"))));
  const seunHit = [me.seun.current, me.seun.next].find((item) => item && carries(str(at(item, "ganElement"))));
  const good = timelineFor(me).find((item) => item.tone === "good");
  return section(
    title,
    favorable[0]
      ? `${str(favorable[0].label)} ${str(favorable[0].ganji)}에 재물의 기운이 들어와요`
      : good
        ? `가까이에서 가장 힘이 실리는 때는 ${good.period}이에요`
        : "재물의 문은 서두를 때가 아니라 흐름이 바뀔 때 열려요",
    [
      ...layers.slice(0, 3).map((layer) => `${str(layer.label)} ${str(layer.ganji)}: ${soften(str(layer.note) ?? "")}`),
      layers.length === 0 && element
        ? join(
            `재성 ${elementKo(element)}의 기운이 운에서 들어오는 때가 재물의 길목이에요.`,
            decadeHit ? `대운에서는 ${num(decadeHit.startAge)}세부터의 ${str(decadeHit.full)}이 그 자리예요.` : null,
            seunHit ? `가까이는 ${num(seunHit.year)} ${str(seunHit.ganji)} 세운이 그 결을 데려와요.` : null,
          )
        : null,
      me.seun.current ? `올해 ${str(me.seun.current.ganji)} 세운은 "${soften(str(me.seun.current.interpretation) ?? "")}"의 해예요.` : null,
      good ? `${good.period}은 ${soften(good.note)}` : null,
    ],
    [
      ...layers.slice(0, 3).map((layer) => ({ label: `${str(layer.label)} ${str(layer.ganji)}${layer.wealthStarArrives === true ? " · 재성 유입" : ""}`, detail: soften(str(layer.note) ?? "") })),
      decadeHit ? { label: `${num(decadeHit.startAge)}세~ ${str(decadeHit.full)} 대운`, detail: element ? `재성 ${elementKo(element)}의 기운이 배경으로 깔리는 칸이에요.` : "" } : null,
      good ? { label: good.period, detail: good.note } : null,
    ],
    "decade",
  );
};

const wealthHabit: Builder = ({ me, wealth, reading }, title) => {
  const bigyeop = groupCount(me, "비겁");
  const talJae = at(wealth, "natalWealth.talJaeRisk") === true || (bigyeop > 0 && bigyeop > groupCount(me, "재성"));
  return section(
    title,
    talJae ? "사람과 돈을 섞지 않는 것이 새는 구멍을 막는 첫 습관이에요" : "들어온 재물을 담아 두는 구조를 먼저 만드세요",
    [
      me.yongsin.yong
        ? `용신 ${elementKo(me.yongsin.yong)}의 결(${me.yongsin.usage ?? ELEMENT_VIRTUE[me.yongsin.yong].good})에 쓰는 돈은 불어나는 돈, 기신 ${elementKo(me.yongsin.gi)}의 결(${me.yongsin.gi ? ELEMENT_VIRTUE[me.yongsin.gi].excess : "충동"})에 쓰는 돈은 새는 돈으로 나눠 보세요.`
        : null,
      talJae
        ? "보증과 동업, 가까운 사람에게 빌려주는 돈 — 이 셋만 문서로 남겨도 구멍의 대부분이 막혀요."
        : "들어오는 통장과 쓰는 통장을 나누는 것만으로도, 담아 두는 구조의 절반은 만들어져요.",
      me.cautions.length ? `${me.cautions.map((item) => item.trait).join(", ")}의 결은 소비 결정에도 그대로 나타나요. 큰 지출은 하루 묵힌 뒤 다시 보세요.` : null,
      answerLine(reading, "money") ?? (reading.answers.income ? `지금 수입이 "${reading.answers.income}"에서 온다면, 그 흐름을 끊지 않으면서 재성이 들어오는 시기에 무게를 싣는 전략이 맞아요.` : null),
    ],
    [
      me.yongsin.yong ? { label: `용신 ${elementKo(me.yongsin.yong)} · 쓰는 방향`, detail: me.yongsin.usage ?? ELEMENT_VIRTUE[me.yongsin.yong].good } : null,
      talJae ? { label: `비겁 ${bigyeop}자리 · 탈재 신호`, detail: "재물이 사람을 통해 나가기 쉬운 구조예요." } : null,
      me.cautions[0] ? { label: `성향 주의 · ${me.cautions[0].trait}`, detail: me.cautions[0].basis ?? "성향 평가에서 나온 주의점이에요." } : null,
    ],
  );
};

const HEALTH_NOTE = "명리의 오행 균형을 몸의 리듬에 빗대어 읽은 참고용 이야기예요. 진단이나 의료 조언이 아니며, 불편이 이어지면 꼭 진료를 받아 보세요.";

const healthBalance: Builder = ({ me, health }, title) => {
  const organs = (list(at(health, "organs")) as Record<string, Json>[]).filter((organ) => str(organ.signalNote));
  const counts = me.counts;
  const sorted = counts ? [...FIVE_ELEMENTS].sort((a, b) => counts[b] - counts[a]) : [];
  const over = sorted[0] ?? null;
  const under = counts ? [...sorted].reverse().find((element) => counts[element] === 0) ?? sorted[sorted.length - 1] ?? null : null;
  return section(
    title,
    sentences(str(at(health, "balance.note")), 1) ??
      (over && under && over !== under
        ? `${elementKo(over)} 기운이 몰리고 ${elementKo(under)} 기운이 얇아, 몸의 긴장도 그쪽으로 기울어요`
        : "오행이 고른 편이라, 몸의 리듬도 크게 치우치지 않아요"),
    [
      sentences(str(at(health, "dayMasterFoundation.note")), 2),
      over ? `${elementKo(over)} 기운은 몸에서 ${ELEMENT_BODY[over].organ}의 결로 읽어요. 이 기운이 넘칠 때는 ${ELEMENT_BODY[over].excess}` : null,
      under && under !== over ? `반대로 ${elementKo(under)} 기운이 얇아요. 이쪽이 모자라면 ${ELEMENT_BODY[under].lack}` : null,
      ...organs.slice(0, 2).map((organ) => soften(str(organ.signalNote)!)),
      HEALTH_NOTE,
    ],
    [
      over ? { label: `${elementKo(over)} 과다 · ${ELEMENT_BODY[over].organ}`, detail: ELEMENT_BODY[over].excess } : null,
      under && under !== over ? { label: `${elementKo(under)} 부족 · ${ELEMENT_BODY[under].organ}`, detail: ELEMENT_BODY[under].lack } : null,
      ...organs.slice(0, 2).map((organ) => ({ label: `${str(organ.element)} · ${str(organ.yinOrgan)}·${str(organ.yangOrgan)}`, detail: soften(str(organ.signalNote)!) })),
    ],
    "elements",
  );
};

const healthWatch: Builder = ({ me, health }, title) => {
  const vulnerabilities = list(at(health, "vulnerabilities")) as Record<string, Json>[];
  const tensions = list(at(health, "branchTensions")) as Record<string, Json>[];
  // 모듈이 없으면 원국의 충·형이 몸의 긴장 자리를 대신 가리킨다
  const clash = me.relations.filter((relation) => /충|형|해|파/.test(relation.type)).slice(0, 2);
  const gi = me.yongsin.gi;
  return section(
    title,
    vulnerabilities[0]
      ? soften(str(vulnerabilities[0].note) ?? str(vulnerabilities[0].mechanism) ?? "유의할 계통이 있어요")
      : clash[0]
        ? `${clash[0].sourcePosition}와 ${clash[0].targetPosition}의 ${clash[0].type}이 몸에서는 긴장이 오래 머무는 자리로 나타나요`
        : "크게 기운 계통은 없지만, 피로가 쌓이는 자리는 미리 알아 두면 좋아요",
    [
      ...vulnerabilities.slice(0, 2).map((item) => soften([str(item.mechanism), str(at(item, "natalPresence.note"))].filter(Boolean).join(" — "))),
      tensions[0] ? soften(str(tensions[0].note) ?? "") : null,
      clash.length && !vulnerabilities.length
        ? `원국 안에서 부딪히는 자리는 ${clash.map((relation) => `${relation.sourcePosition} ${relation.source} ↔ ${relation.targetPosition} ${relation.target}(${relation.type})`).join(", ")}예요. 명리에서는 이런 자리를 무리가 쌓이면 가장 먼저 신호가 오는 곳으로 읽어요.`
        : null,
      gi ? `기신 ${elementKo(gi)}의 결, 곧 ${ELEMENT_VIRTUE[gi].excess}이 길어질 때 몸이 먼저 지쳐요. ${ELEMENT_BODY[gi].care}이 그 반대쪽의 처방이에요.` : null,
      HEALTH_NOTE,
    ],
    [
      ...vulnerabilities.slice(0, 2).map((item) => ({ label: soften(str(item.mechanism) ?? "유의 구조"), detail: soften(str(item.note) ?? "") })),
      ...clash.slice(0, 2).map((relation) => ({ label: `${relation.sourcePosition} ↔ ${relation.targetPosition} · ${relation.type}`, detail: relation.meaning ?? "긴장이 머무는 자리예요." })),
      { label: "고지", detail: HEALTH_NOTE },
    ],
  );
};

const healthLife: Builder = ({ me, reading }, title) => {
  const yong = me.yongsin.yong;
  return section(
    title,
    yong ? `${elementKo(yong)}의 결(${ELEMENT_VIRTUE[yong].good})로 생활의 균형을 잡아 주세요` : "넘치는 기운을 덜어내는 생활 리듬이 필요해요",
    [
      yong ? `명리에서 용신은 생활의 방향으로도 읽어요. ${me.yongsin.usage ? `${me.yongsin.usage} 같은 결이` : `${ELEMENT_VIRTUE[yong].good}을 쓰는 일이`} 기운을 고르게 해요.` : null,
      yong ? `몸으로 옮기면 ${ELEMENT_BODY[yong].care} — 이 한 가지만 석 달 이어 봐도 리듬이 달라져요.` : null,
      reading.answers.condition ? `요즘 "${reading.answers.condition}"라고 답하셨죠. 그렇다면 무엇을 더하기보다 과열된 리듬을 먼저 덜어내는 편이 맞아요.` : null,
      HEALTH_NOTE,
    ],
    [
      yong ? { label: `용신 ${elementKo(yong)} · 생활`, detail: me.yongsin.usage ?? ELEMENT_BODY[yong].care } : null,
      { label: "고지", detail: HEALTH_NOTE },
    ],
  );
};

const yearCore: Builder = ({ me, reading }, title) => {
  const seun = me.seun.current;
  return section(
    title,
    me.yearForecast.headline ?? (seun ? `${num(seun.year)} ${str(seun.ganji)}년은 "${soften(str(seun.interpretation) ?? "")}"의 해예요` : "한 해의 결을 먼저 읽어요"),
    [
      seun ? `${num(seun.year)} ${str(seun.ganji)} 세운은 ${me.name}님에게 ${str(at(seun, "sipseongRelation.gan")) ?? ""}·${str(at(seun, "sipseongRelation.ji")) ?? ""}의 기운으로 들어와요. 12운성으로는 "${str(at(seun, "twelveFortune.phase")) ?? ""}"의 해예요.` : null,
      me.yearForecast.advice ? `한 줄로 줄이면 "${me.yearForecast.advice}".` : null,
      reading.answers.word ? `다가올 해를 "${reading.answers.word}"로 고르셨죠. 명식의 흐름과 겹쳐 보면 그 단어를 실천하기 좋은 달이 따로 있어요.` : null,
    ],
    [
      seun ? { label: `${num(seun.year)} ${str(seun.ganji)} 세운 · ${str(at(seun, "twelveFortune.name")) ?? ""}`, detail: soften(str(seun.interpretation) ?? "") } : null,
      list(seun?.hapChungRelations)[0] ? { label: `세운 ${str(at(list(seun?.hapChungRelations)[0], "type"))}`, detail: sentences(str(at(list(seun?.hapChungRelations)[0], "meaning")), 1) ?? "" } : null,
      me.yongsin.yong ? { label: `용신 ${elementKo(me.yongsin.yong)}`, detail: "이 기운이 드는 달에 힘을 실으세요." } : null,
    ],
    "pillars",
  );
};

const yearMonths: Builder = ({ me }, title) => {
  const months = me.weoluns.slice(0, 12);
  return section(
    title,
    "달마다 들어오는 기운이 바뀌니, 힘을 쓸 달과 쉬어 갈 달을 나눠 보세요",
    months.slice(0, 4).map((month) => `${str(month.monthLabel)} ${str(month.ganji)} 월운 — ${soften(str(month.interpretation) ?? "")}`),
    months.slice(0, 4).map((month) => ({ label: `${str(month.monthLabel)} · ${str(month.ganji)}`, detail:
        [[str(at(month, "sipseongRelation.gan")), str(at(month, "sipseongRelation.ji"))].filter(Boolean).join("/"), str(at(month, "termInfo.name"))]
          .filter(Boolean)
          .join(" · ") || "이 달에 들어오는 기운이에요.",
    })),
  );
};

// ─── 학업·자녀 ──────────────────────────────────────────────────────────────

const SIPSEONG_GROUP: Record<string, string> = {
  정인: "인성", 편인: "인성", 식신: "식상", 상관: "식상", 정관: "관성", 편관: "관성", 비견: "비겁", 겁재: "비겁", 정재: "재성", 편재: "재성",
};

const STUDY_STYLE: Record<string, { type: string; how: string; career: string }> = {
  인성: { type: "이해·흡수형", how: "개념을 충분히 이해한 뒤 넘어가고, 조용한 곳에서 오래 앉아 정리할 때 가장 많이 남아요", career: "연구·교육·상담·기획처럼 깊이 파고드는 일" },
  식상: { type: "출력·표현형", how: "누군가에게 설명하듯 말하고, 직접 써 보고, 문제를 많이 풀어 볼 때 실력이 붙어요", career: "콘텐츠·디자인·강의·기술처럼 만들어 내고 표현하는 일" },
  관성: { type: "계획·규칙형", how: "시간표와 마감이 분명하고 모의고사처럼 평가가 있을 때 힘이 나요", career: "공공·법·행정·조직 관리처럼 기준과 책임이 분명한 일" },
  비겁: { type: "경쟁·동료형", how: "스터디나 친구와 함께 속도를 맞추고 경쟁할 때 동기가 붙어요", career: "영업·스포츠·창업처럼 스스로 부딪혀 성과를 내는 일" },
  재성: { type: "목표·보상형", how: "점수·합격 같은 구체적인 목표와 작은 보상이 있을 때 꾸준해져요", career: "경영·금융·유통처럼 결과가 숫자로 보이는 일" },
};

function sipseongGroups(chart: Chart): Array<[string, number]> {
  const counts: Record<string, number> = {};
  for (const position of ["year", "month", "day", "hour"] as const) {
    const pillar = chart.pillar(position);
    for (const key of position === "day" ? ["earthSippiSeong"] : ["sippiSeong", "earthSippiSeong"]) {
      const group = SIPSEONG_GROUP[str(pillar?.[key]) ?? ""];
      if (group) counts[group] = (counts[group] ?? 0) + 1;
    }
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

const studyStyle: Builder = ({ me, reading }, title) => {
  const groups = sipseongGroups(me);
  const [top, second] = groups;
  const style = top ? STUDY_STYLE[top[0]] : undefined;
  const inseong = groups.find(([group]) => group === "인성")?.[1] ?? 0;
  return section(
    title,
    style ? `${me.name}의 명식은 ${top![0]} 기운이 가장 두드러진 ${style.type}이에요` : "기운의 분포로 맞는 공부 방식을 고를 수 있어요",
    [
      groups.length ? `원국의 십성을 모아 보면 ${groups.map(([group, count]) => `${group} ${count}자리`).join(", ")}예요.` : null,
      style ? `그래서 ${style.how}.` : null,
      second && STUDY_STYLE[second[0]] ? `보조로 쓰이는 ${second[0]} 기운(${STUDY_STYLE[second[0]]!.type})을 섞어 쓰면 지루함이 줄고 오래 가요.` : null,
      inseong === 0 ? "배움을 받아들이는 인성이 원국에 드러나지 않아, 오래 붙잡고 있기보다 짧게 끊어 반복하는 편이 효율적이에요." : null,
      answerLine(reading, "struggle") ?? answerLine(reading, "childStyle"),
      storyEcho(reading),
    ],
    [
      top ? { label: `십성 분포 · ${groups.map(([group, count]) => `${group}${count}`).join(" ")}`, detail: "년·월·일·시 기둥의 천간·지지 십성을 모은 분포예요." } : null,
      pillarEvidence(me, "month"),
      me.strength
        ? { label: `신강약 · ${me.strength}`, detail: me.strength.includes("강") ? "스스로 밀어붙이는 힘이 있어 자율 학습에 강해요." : "환경과 도움의 영향을 크게 받아, 함께하는 구조가 중요해요." }
        : null,
    ],
    "elements",
  );
};

const careerDirection: Builder = ({ me, reading }, title) => {
  const [top] = sipseongGroups(me);
  const style = top ? STUDY_STYLE[top[0]] : undefined;
  const decade = me.decade.current;
  return section(
    title,
    style ? `${me.gyeokguk ? `${me.gyeokguk.name}의 틀과 ` : ""}${top![0]} 기운은 ${style.career} 쪽을 가리켜요` : "타고난 틀이 가리키는 일의 방향을 살펴봐요",
    [
      me.gyeokguk ? `격국은 ${me.gyeokguk.name}이에요. ${me.gyeokguk.reasoning ?? ""}` : null,
      me.strengths.length ? `강점으로는 ${me.strengths.map((item) => item.trait).join(", ")}이 보여요.` : null,
      decade ? `지금 흐르는 ${decadeLabel(decade)}은 ${str(at(decade, "sipseong.gan")) ?? "고유한"} 기운이라 "${str(at(decade, "twelveFortune.phase")) ?? "흐름에 맞춰 움직이는"}" 시기예요. 진로는 이 흐름 안에서 넓게 경험해 보며 좁혀 가는 게 좋아요.` : null,
      answerLine(reading, "childConcern") ?? answerLine(reading, "goal"),
    ],
    [
      me.gyeokguk ? { label: `격국 ${me.gyeokguk.name}`, detail: me.gyeokguk.reasoning ?? "사주의 틀이에요." } : null,
      me.strengths[0] ? { label: `강점 · ${me.strengths[0].trait}`, detail: me.strengths[0].basis ?? "성향 평가에서 나온 강점이에요." } : null,
      decade ? { label: `현재 ${decadeLabel(decade)}`, detail: str(at(decade, "twelveFortune.phase")) ?? "열 해 단위로 깔리는 배경이에요." } : null,
    ],
  );
};

const PARENT_WORDS: Record<FiveElement, { say: string; avoid: string }> = {
  wood: { say: "“새로 해 본 게 뭐야?”처럼 시도 자체를 알아주는 말", avoid: "“빨리빨리 좀 해”처럼 속도를 재촉하는 말" },
  fire: { say: "“그거 정말 멋지게 표현했다”처럼 드러낸 것을 반겨 주는 말", avoid: "감정이 섞인 큰소리와 다른 사람 앞에서의 꾸중" },
  earth: { say: "“네 편이야, 천천히 해도 돼”처럼 믿음을 주는 말", avoid: "“원래 넌 그래”처럼 아이를 고정해 버리는 말" },
  metal: { say: "“여기까지 정리한 거 대단하다”처럼 끝맺음을 인정하는 말", avoid: "“그걸 왜 못 해”처럼 날 선 비교" },
  water: { say: "“오늘은 좀 쉬어도 괜찮아”처럼 생각할 시간을 주는 말", avoid: "“네가 알아서 해”처럼 거리를 두는 말" },
};

const parentTalk: Builder = (ctx, title) => {
  const child = ctx.report.roles?.partner === "child" && ctx.partner ? ctx.partner : ctx.me;
  const yong = child.yongsin.yong;
  const gi = child.yongsin.gi;
  return section(
    title,
    yong ? `${child.name}에게는 ${elementKo(yong)}의 결, 곧 ${ELEMENT_VIRTUE[yong].good}을 채워 주는 말이 가장 오래 남아요` : "아이의 기운에 맞는 말의 온도가 있어요",
    [
      yong ? `${child.name}의 명식에서 균형을 잡아 주는 용신은 ${elementKo(yong)}이에요. 그래서 ${PARENT_WORDS[yong].say}이 힘이 돼요.` : null,
      gi ? `반대로 기신 ${elementKo(gi)}의 결을 자극하는 ${PARENT_WORDS[gi].avoid}은 마음의 문을 닫게 만들기 쉬워요.` : null,
      child.cautions.length ? `${child.name}이 스스로 버거워하는 결은 ${child.cautions.map((item) => item.trait).join(", ")}이에요. 그 순간에는 해결책보다 공감을 먼저 건네 주세요.` : null,
      answerLine(ctx.reading, "conflict") ?? answerLine(ctx.reading, "childStyle"),
    ],
    [
      yong ? { label: `${child.name} · 용신 ${elementKo(yong)}`, detail: child.yongsin.reasoning ?? ELEMENT_VIRTUE[yong].good } : null,
      gi ? { label: `${child.name} · 기신 ${elementKo(gi)}`, detail: `${ELEMENT_VIRTUE[gi].excess}이 커질 때 흔들리기 쉬워요.` } : null,
      child.cautions[0] ? { label: `성향 주의 · ${child.cautions[0].trait}`, detail: child.cautions[0].basis ?? "성향 평가에서 나온 주의점이에요." } : null,
    ],
  );
};

// ─── 종합 명식 전용 장 ──────────────────────────────────────────────────────

/** 여덟 칸의 대운을 한 줄로 펼쳐, 삶의 배경이 언제 바뀌는지 보여 준다 */
const decadeMap: Builder = ({ me }, title) => {
  const { list: all, index } = me.decade;
  const direction = str(at(me.modules, "decadeFortune.direction"));
  const past = all.slice(0, index);
  const ahead = all.slice(index + 1);
  const turning = ahead.find((item) => fortuneTone(num(at(item, "twelveFortune.level"))) === "good");
  return section(
    title,
    all.length
      ? `${me.name}님의 대운은 ${direction ? `${direction}으로 ` : ""}${num(all[0]!.startAge) ?? 0}세부터 열 해씩 ${all.length}칸을 지나요`
      : "대운은 열 해마다 삶의 배경이 통째로 바뀌는 자리예요",
    [
      "대운은 하루하루의 운이 아니라 무대 배경이에요. 같은 성격이라도 어떤 배경 위에 서 있느냐에 따라 같은 선택의 결과가 달라져요.",
      past.length
        ? `지나온 ${past.length}칸은 ${past.map((item) => `${str(item.full)}`).join(" · ")}${hasBatchim(past[past.length - 1] ? str(past[past.length - 1]!.full) ?? "" : "") ? "이었어요" : "였어요"}. 지금의 습관과 기준은 대개 이 시기에 만들어져요.`
        : null,
      ahead.length
        ? join(
            `앞으로는 ${ahead.slice(0, 3).map((item) => `${num(item.startAge)}세 ${str(item.full)}`).join(", ")}${ahead.length > 3 ? " 순으로" : "으로"} 이어져요.`,
            turning ? `그 가운데 ${num(turning.startAge)}세 ${str(turning.full)} 대운에 특히 힘이 실려요.` : null,
          )
        : null,
      me.decade.current
        ? `지금 서 있는 칸은 ${decadeLabel(me.decade.current)}이에요. 다음 장에서 이 칸 안을 좀 더 자세히 들여다볼게요.`
        : null,
    ],
    [
      me.decade.current
        ? { label: `현재 ${decadeLabel(me.decade.current)}`, detail: str(at(me.decade.current, "twelveFortune.phase")) ?? "지금 지나는 대운이에요." }
        : null,
      turning ? { label: `${num(turning.startAge)}세~ ${str(turning.full)} 대운`, detail: str(at(turning, "twelveFortune.phase")) ?? "힘이 실리는 칸이에요." } : null,
      direction ? { label: `대운 방향 · ${direction}`, detail: "태어난 해의 음양과 성별로 정해지는, 대운이 흘러가는 방향이에요." } : null,
    ],
    "decade",
  );
};

/** 인연의 자리 — 일지와 관성·재성이 가리키는 가까워지는 방식 */
const loveSeat: Builder = ({ me, reading }, title) => {
  const day = me.pillar("day");
  const seat = str(day?.earthSippiSeong);
  const groups = sipseongGroups(me);
  const relational = groups.find(([group]) => group === "관성" || group === "재성");
  const flower = me.goodSinsal.concat(me.cautionSinsal).find((item) => /도화|홍염|천희|합/.test(item.name));
  return section(
    title,
    seat ? `일지에 앉은 ${seat}이 ${me.name}님이 가까운 사이에서 먼저 꺼내는 모습이에요` : "일지는 가장 가까운 사이에서 드러나는 내 민낯의 자리예요",
    [
      day
        ? join(
            `일지(${str(day.earth) ?? str(day.full)})는 배우자·연인의 자리이자 내가 혼자 있을 때의 자리예요.`,
            sentences(str(at(day, "twelveFortuneInterpretation.positionMeaning")), 1),
          )
        : null,
      relational
        ? `원국에서는 ${relational[0]} 기운이 ${relational[1]}자리로 두드러져요. ${relational[0] === "관성" ? "관계에 기준과 책임을 먼저 세우는 편이라, 상대에게도 분명한 약속을 바라게 돼요." : "상대를 살피고 챙기는 데서 애정을 확인하는 편이라, 주는 만큼 돌아오지 않을 때 먼저 지쳐요."}`
        : "관성·재성이 뚜렷하지 않은 편이라, 관계의 모양을 상대에 따라 유연하게 맞추는 쪽이에요.",
      flower ? `신살로는 ${flower.name}의 결이 보여요. ${sentences(flower.description, 1) ?? "사람이 모이고 눈에 띄는 자리예요."}` : null,
      me.yongsin.yong
        ? `오래 가는 인연은 대개 용신 ${elementKo(me.yongsin.yong)}의 결, 곧 ${ELEMENT_VIRTUE[me.yongsin.yong].good}을 나눌 수 있는 사이예요.`
        : null,
      answerLine(reading, "concern"),
    ],
    [
      pillarEvidence(me, "day"),
      relational ? { label: `${relational[0]} ${relational[1]}자리`, detail: "원국 네 기둥에서 센 십성 분포예요." } : null,
      flower ? { label: `신살 ${flower.name}`, detail: sentences(flower.description, 1) ?? "" } : null,
    ],
  );
};

/** 말년의 결 — 시주와 마지막 대운 */
const lateYears: Builder = ({ me }, title) => {
  const hour = me.pillar("hour");
  const last = me.decade.list[me.decade.list.length - 1] ?? null;
  const seat = str(hour?.earthSippiSeong) ?? str(hour?.sippiSeong);
  return section(
    title,
    hour && str(hour.full)
      ? `시주 ${str(hour.full)}은 ${me.name}님의 말년과 손끝에 남는 결과의 자리예요`
      : "말년의 결은 지금 무엇을 꾸준히 심어 두느냐로 정해져요",
    [
      hour
        ? join(
            `시주는 자식·제자·내가 남기는 것의 자리예요.${seat ? ` 그 자리에 ${seat}이 앉아 있어요.` : ""}`,
            sentences(str(at(hour, "twelveFortuneInterpretation.energy")), 1),
          )
        : "시간을 모르고 보신 명식이라 시주는 비워 두었어요. 나머지 세 기둥만으로도 큰 결은 충분히 읽혀요.",
      last ? `대운의 마지막 칸은 ${num(last.startAge)}세부터의 ${str(last.full)}이에요. 여기서 거두는 것은 대개 지금 심어 둔 것의 모양을 그대로 따라가요.` : null,
      me.yongsin.yong
        ? `그래서 말년을 위해 지금 할 수 있는 가장 확실한 일은, 용신 ${elementKo(me.yongsin.yong)}의 결(${ELEMENT_VIRTUE[me.yongsin.yong].good})을 쌓는 습관 하나를 오래 끌고 가는 거예요.`
        : null,
      me.strengths[0] ? `${me.strengths[0].trait} — 이 강점은 나이가 들수록 더 또렷해지는 결이에요.` : null,
    ],
    [
      pillarEvidence(me, "hour"),
      last ? { label: `${num(last.startAge)}세~ ${str(last.full)} 대운`, detail: str(at(last, "twelveFortune.phase")) ?? "대운의 마지막 칸이에요." } : null,
      pillarEvidence(me, "year"),
    ],
  );
};

// ─── 사업 ───────────────────────────────────────────────────────────────────

/** 밑천 — 혼자 밀고 나가는 힘이 얼마나 되는가 */
const bizCapital: Builder = ({ me, reading }, title) => {
  const bigyeop = groupCount(me, "비겁");
  const strong = me.strength?.includes("신강") ?? false;
  return section(
    title,
    strong
      ? `${me.name}님은 ${me.strength}의 그릇이라, 남의 간판보다 내 간판을 걸 때 힘이 제대로 쓰여요`
      : `${me.name}님은 ${me.strength ?? "치우치지 않은"}의 그릇이라, 혼자 다 지기보다 기댈 구조를 먼저 만드는 편이 맞아요`,
    [
      me.strengthAnalysis,
      `사업에서 밑천은 돈이 아니라 버티는 힘이에요. 명리에서는 그걸 일간의 힘으로 봐요. ${strong ? "밀고 나가는 힘이 넉넉하니, 초반에 혼자 감당해야 하는 시기를 견디는 데는 유리해요. 다만 덜어 낼 곳을 못 찾으면 혼자 다 쥐려다 지쳐요." : "힘이 넉넉한 편은 아니라, 처음부터 크게 벌이기보다 작게 열어 두고 반응을 보며 키우는 쪽이 오래가요."}`,
      bigyeop > 0
        ? `비겁(나와 같은 편의 기운)이 ${bigyeop}자리예요. ${bigyeop >= 3 ? "경쟁과 동업이 늘 따라붙는 구조라, 지분과 역할을 먼저 문서로 나눠 두세요." : "함께하는 사람에게서 힘을 얻는 편이라, 혼자보다 둘이 더 멀리 가요."}`
        : "비겁이 드러나지 않아, 남과 겨루기보다 내 속도로 쌓아 올리는 쪽이 편해요.",
      answerLine(reading, "worry") ?? storyEcho(reading),
    ],
    [
      me.strength ? { label: `신강약 · ${me.strength}`, detail: me.strengthAnalysis ?? "버티는 힘의 기준이에요." } : null,
      pillarEvidence(me, "day"),
      me.gyeokguk ? { label: `격국 ${me.gyeokguk.name}`, detail: me.gyeokguk.reasoning ?? "사주의 틀이에요." } : null,
    ],
    "pillars",
  );
};

/** 혼자 쥐는 결인가, 사람을 쓰는 결인가 */
const bizShape: Builder = ({ me, reading }, title) => {
  const siksang = groupCount(me, "식상");
  const gwan = groupCount(me, "관성");
  const jae = groupCount(me, "재성");
  const maker = siksang >= gwan;
  return section(
    title,
    maker
      ? "만들어 내는 힘이 앞서는 결이라, 조직을 키우기보다 내 손에서 나오는 것으로 승부하는 쪽이 맞아요"
      : "틀을 세우고 굴리는 힘이 앞서는 결이라, 혼자 다 만들기보다 사람과 시스템을 쓰는 쪽이 맞아요",
    [
      `원국의 십성을 모아 보면 식상 ${siksang}자리, 관성 ${gwan}자리, 재성 ${jae}자리예요.`,
      maker
        ? "식상은 내가 밖으로 내보내는 힘이에요. 제품·콘텐츠·기술처럼 결과물이 손에 잡히는 일에서 돈이 붙어요. 사람을 많이 쓰면 오히려 내 손이 묶여 매출이 줄 수 있어요."
        : "관성은 기준과 책임을 세우는 힘이에요. 매뉴얼이 돌아가고 역할이 나뉘는 구조에서 제 몫을 해요. 내가 다 만들려 들면 금세 한계가 와요.",
      jae === 0
        ? "다만 재성이 원국에 드러나지 않아요. 잘 만들어도 값을 매기고 받아 내는 일은 따로 배워야 하는 결이라, 가격과 수금 구조를 먼저 정해 두세요."
        : `재성이 ${jae}자리 있어 값을 매기고 거둬들이는 감각은 타고난 편이에요.`,
      answerLine(reading, "shape"),
    ],
    [
      { label: `십성 분포 · 식상${siksang} 관성${gwan} 재성${jae}`, detail: "네 기둥의 천간·지지 십성을 모은 분포예요." },
      pillarEvidence(me, "month"),
      me.strengths[0] ? { label: `강점 · ${me.strengths[0].trait}`, detail: me.strengths[0].basis ?? "" } : null,
    ],
    "elements",
  );
};

// ─── 입시·자녀 ──────────────────────────────────────────────────────────────

/** 연도별 학업 흐름 — 이 장의 주인공은 표다 */
const admissionYears: Builder = ({ me, reading }, title) => {
  const years = me.seunYears;
  const best = years.filter((item) => fortuneTone(num(at(item, "twelveFortune.level"))) === "good");
  const soft = years.filter((item) => fortuneTone(num(at(item, "twelveFortune.level"))) === "caution");
  const name = reading.subject.name;
  return section(
    title,
    best[0]
      ? `${name}에게 학업의 기운이 가장 차오르는 해는 ${num(best[0].year)}년이에요`
      : "해마다 들어오는 기운이 달라, 밀어붙일 해와 다지는 해를 나눠 봐야 해요",
    [
      "아래 표는 해마다 들어오는 기운의 세기를 나란히 놓은 거예요. 막대가 긴 해는 노력이 결과로 잘 바뀌는 해, 짧은 해는 결과보다 바탕을 쌓는 해예요.",
      best.length
        ? `힘이 실리는 해는 ${best.map((item) => `${num(item.year)}년(${str(item.ganji)})`).join(", ")}이에요. 이 해에 원서·본시험처럼 결과가 갈리는 일을 모으면 유리해요.`
        : null,
      soft.length
        ? `반대로 ${soft.map((item) => `${num(item.year)}년`).join(", ")}은 한 템포 쉬어 가는 결이에요. 성적이 안 오른다고 아이를 몰아붙이면 오히려 다음 해의 힘까지 깎여요.`
        : null,
      answerLine(reading, "grade") ?? answerLine(reading, "struggle"),
    ],
    [
      ...years.slice(0, 3).map((item) => ({
        label: `${num(item.year)} ${str(item.ganji)} 세운`,
        detail: soften(str(item.interpretation) ?? "그해에 들어오는 기운이에요."),
      })),
    ],
    "years",
  );
};

/** 원서와 선택 — 기운이 열리는 방향 */
const admissionChoice: Builder = ({ me, reading }, title) => {
  const [top] = sipseongGroups(me);
  const style = top ? STUDY_STYLE[top[0]] : undefined;
  const yong = me.yongsin.yong;
  return section(
    title,
    style ? `${top![0]} 기운이 앞서는 아이라, ${style.career} 쪽에서 힘이 가장 덜 들어요` : "타고난 결이 덜 깎이는 방향으로 고르는 게 가장 안전해요",
    [
      style ? `공부 체질이 ${style.type}이라, 같은 성적대라면 ${style.career}에 가까운 전공에서 버티는 힘이 더 나와요.` : null,
      yong ? `용신이 ${elementKo(yong)}이라, ${ELEMENT_VIRTUE[yong].good}을 쓰는 환경 — 그런 결의 학교와 전공에서 기운이 덜 깎여요.` : null,
      "원서는 점수로 고르지만, 버티는 건 결로 버텨요. 같은 점수대에서 고민될 때 이 결을 기준의 하나로 얹어 보세요.",
      "이 풀이는 합격 여부를 점치지 않아요. 기운이 어느 쪽으로 덜 깎이는지를 볼 뿐이고, 원서의 판단은 성적과 전형이 먼저예요.",
    ],
    [
      top ? { label: `십성 · ${top[0]} ${top[1]}자리`, detail: style?.how ?? "원국에서 가장 센 결이에요." } : null,
      yong ? { label: `용신 ${elementKo(yong)}`, detail: me.yongsin.usage ?? ELEMENT_VIRTUE[yong].good } : null,
      me.gyeokguk ? { label: `격국 ${me.gyeokguk.name}`, detail: me.gyeokguk.reasoning ?? "" } : null,
    ],
  );
};

/** 재능이 뻗는 방향 — 다섯 결로 나눈다 */
const TALENT: Record<string, { kind: string; shows: string; grow: string }> = {
  인성: { kind: "받아들이는 재능", shows: "설명을 한 번 듣고 구조째 외우고, 혼자 파고드는 시간을 즐거워해요", grow: "답을 주기보다 질문을 던져 주면 혼자 더 멀리 갑니다" },
  식상: { kind: "만들어 내는 재능", shows: "배운 것을 바로 자기 말·그림·만들기로 바꿔 내놓아요", grow: "내놓을 자리를 자주 만들어 주세요. 발표든 전시든 보는 눈이 있을 때 자랍니다" },
  관성: { kind: "지키고 이끄는 재능", shows: "규칙과 역할을 먼저 정하고, 맡은 건 끝까지 해냅니다", grow: "책임을 조금씩 늘려 주세요. 맡기면 맡길수록 커지는 결입니다" },
  비겁: { kind: "겨루며 크는 재능", shows: "또래와 나란히 놓일 때 눈빛이 달라지고, 지는 걸 못 견뎌 해요", grow: "경쟁 자체보다 '어제의 나'와 겨루게 틀을 바꿔 주면 오래갑니다" },
  재성: { kind: "다루고 거두는 재능", shows: "목표와 보상이 선명할 때 몰입하고, 결과를 숫자로 확인하길 좋아해요", grow: "작은 목표를 잘게 쪼개 주세요. 눈에 보이는 성취가 연료입니다" },
};

const talentDirection: Builder = (ctx, title) => {
  const child = ctx.report.roles?.partner === "child" && ctx.partner ? ctx.partner : ctx.me;
  const groups = sipseongGroups(child);
  const [top, second] = groups;
  const talent = top ? TALENT[top[0]] : undefined;
  return section(
    title,
    talent ? `${child.name}은 ${talent.kind}이 가장 두껍게 깔린 아이예요` : "타고난 재능이 어느 쪽으로 뻗는지부터 봐요",
    [
      groups.length ? `원국의 십성을 모아 보면 ${groups.map(([group, count]) => `${group} ${count}자리`).join(", ")}예요.` : null,
      talent ? `${talent.kind}은 이렇게 드러나요 — ${talent.shows}` : null,
      talent ? `키우는 법은 하나예요. ${talent.grow}` : null,
      second && TALENT[second[0]] ? `보조로는 ${TALENT[second[0]]!.kind}이 깔려 있어, ${second[0]} 쪽의 자극을 섞어 주면 한쪽으로만 몰리지 않아요.` : null,
      answerLine(ctx.reading, "signal") ?? answerLine(ctx.reading, "likes"),
    ],
    [
      top ? { label: `십성 · ${top[0]} ${top[1]}자리`, detail: talent?.shows ?? "원국에서 가장 센 결이에요." } : null,
      pillarEvidence(child, "hour"),
      child.goodSinsal[0] ? { label: `신살 ${child.goodSinsal[0].name}`, detail: sentences(child.goodSinsal[0].description, 1) ?? "" } : null,
    ],
    "elements",
  );
};

/** 어울리는 일의 결과 어울리지 않는 일의 결 */
const talentFit: Builder = (ctx, title) => {
  const child = ctx.report.roles?.partner === "child" && ctx.partner ? ctx.partner : ctx.me;
  const [top] = sipseongGroups(child);
  const style = top ? STUDY_STYLE[top[0]] : undefined;
  const yong = child.yongsin.yong;
  const gi = child.yongsin.gi;
  return section(
    title,
    style ? `${style.career} 쪽에서 이 아이는 가장 덜 힘들게 제 몫을 해요` : "같은 일이라도 결이 맞으면 덜 지쳐요",
    [
      style ? `${top![0]} 기운이 앞서는 아이라 ${style.career}과 결이 맞아요. 적성이 '좋아하는 일'만 뜻하는 건 아니에요 — 오래 해도 덜 닳는 쪽을 뜻해요.` : null,
      yong ? `용신 ${elementKo(yong)}의 결, 곧 ${ELEMENT_VIRTUE[yong].good}을 쓰는 일에서 기운이 채워져요.` : null,
      gi ? `반대로 ${ELEMENT_VIRTUE[gi].excess}을 계속 요구하는 자리는, 잘해 내더라도 아이를 빠르게 소모시켜요.` : null,
      "다만 열 살의 명식으로 서른의 직업을 못 박지는 않아요. 넓게 보여 주고, 아이가 오래 붙잡는 것을 함께 지켜봐 주세요.",
      answerLine(ctx.reading, "parentWish"),
    ],
    [
      top ? { label: `십성 · ${top[0]} ${top[1]}자리`, detail: style?.career ?? "" } : null,
      yong ? { label: `용신 ${elementKo(yong)}`, detail: child.yongsin.usage ?? ELEMENT_VIRTUE[yong].good } : null,
      gi ? { label: `기신 ${elementKo(gi)}`, detail: `${ELEMENT_VIRTUE[gi].excess}이 길어지면 지치기 쉬워요.` } : null,
    ],
  );
};

const BUILDERS: Record<string, Builder[]> = {
  study: [natal, studyStyle, timing, cautionSection],
  "child-study": [natal, studyStyle, timing, careerDirection, parentTalk],
  "parent-child": [crossRelations, cautionSection, parentTalk],
  "reunion-deep": [crossRelations, partnerHeart, partnerNow, timing, cautionSection, actionSection],
  reunion: [crossRelations, partnerHeart, timing, cautionSection],
  love: [natal, natalRelations, timing, actionSection],
  compatibility: [crossRelations, cautionSection, elementsAndYongsin, actionSection],
  life: [natal, natalRelations, elementsAndYongsin, timing, actionSection],
  yearly: [yearCore, yearMonths, timing],
  money: [wealthStructure, wealthTiming, wealthHabit],
  career: [natal, timing, wealthTiming],
  health: [healthBalance, healthWatch, healthLife],
  business: [bizCapital, bizShape, wealthStructure, decadeMap, yearCore, cautionSection],
  "child-admission": [natal, studyStyle, admissionYears, decadeMap, yearMonths, admissionChoice, parentTalk],
  "child-dream": [natal, talentDirection, careerDirection, decadeMap, talentFit, parentTalk],
  "child-talent": [natal, talentDirection, decadeMap, parentTalk],
  "destiny-full": [
    natal, natalRelations, elementsAndYongsin, decadeMap, timing,
    yearCore, wealthStructure, loveSeat, healthBalance, lateYears, actionSection,
  ],
};

// ─── 조립 ───────────────────────────────────────────────────────────────────

function mergedTopicModules(sazu: StoredSazu) {
  const merged: Record<string, Json> = {};
  for (const topic of Object.values(sazu)) Object.assign(merged, topic?.modules);
  return { ...merged, ...sazu.manse?.modules, ...Object.fromEntries(Object.entries(merged).filter(([key]) => !(key in (sazu.manse?.modules ?? {})))) };
}

function firstPartner(sazu: StoredSazu) {
  for (const topic of Object.values(sazu)) {
    const partner = topic?.partners?.[0];
    if (partner) return partner as Record<string, Json>;
  }
  return null;
}

function actionsFor(ctx: Context) {
  const { me, report, partner } = ctx;
  const doList: string[] = [];
  const avoid: string[] = [];
  if (me.yongsin.yong) doList.push(`하루 한 번은 ${ELEMENT_VIRTUE[me.yongsin.yong].good}을 쓰는 일에 시간을 내 보세요${me.yongsin.usage ? ` (예: ${me.yongsin.usage.split(",").slice(0, 2).join(",")})` : ""}.`);
  me.strengths.slice(0, 1).forEach((item) => doList.push(`${item.trait} — 이 강점이 드러나는 자리를 일부러 만들어 보세요.`));
  if (report.category === "reunion") {
    doList.push("연락보다 내 일상을 먼저 단단히 세우고, 달라진 모습이 자연스럽게 전해지게 하세요.");
    if (partner?.yongsin.yong) doList.push(`다시 닿는다면 ${partner.name}님에게 필요한 ${ELEMENT_VIRTUE[partner.yongsin.yong].good}의 말로 짧게 건네세요.`);
    avoid.push("감정이 올라온 밤에 장문의 메시지 보내기.", "공통 지인을 통해 그 사람의 근황을 캐묻기.");
  } else if (report.category === "chemistry") {
    doList.push("서운함은 사건이 끝난 뒤 하루 안에, '나는 ~해서 서운했어'의 문장으로 전하세요.");
    avoid.push("다툼 중에 과거의 일을 끌어와 한꺼번에 따지기.");
  } else if (report.roles?.subject === "child" || report.roles?.partner === "child") {
    doList.push("하루 10분, 공부 이야기 말고 아이가 좋아하는 이야기를 먼저 들어 주세요.");
    doList.push("힘이 실리는 달에 새 학원·새 목표를 시작하고, 가라앉는 달에는 복습과 휴식을 늘려 주세요.");
    avoid.push("형제·친구와 성적을 비교하는 말.", "아이의 기질과 반대되는 공부 방식을 억지로 밀어붙이기.");
  } else if (report.category === "study") {
    doList.push("힘이 실리는 달을 달력에 표시하고, 모의시험·중요 제출을 그 달에 모으세요.");
    avoid.push("컨디션이 가라앉는 달에 밤샘으로 만회하려 하기.");
  } else if (report.slug === "health") {
    doList.push("수면·식사 시간을 일정하게 고정해 과열된 리듬을 먼저 낮추세요.");
    avoid.push("몸의 신호를 사주로만 판단하고 진료를 미루기.");
  } else if (report.category === "wealth") {
    doList.push("재성이 들어오는 시기 전에 고정 지출을 한 번 정리해 두세요.");
    avoid.push("가까운 사람과 돈을 섞는 약속을 즉흥적으로 하기.");
  } else {
    doList.push("힘이 실리는 달을 달력에 표시하고, 중요한 시작은 그때로 모으세요.");
  }
  if (me.yongsin.gi) avoid.push(`${ELEMENT_VIRTUE[me.yongsin.gi].excess}이 앞설 때 큰 결정을 내리기.`);
  me.cautions.slice(0, 2).forEach((item) => avoid.push(`"${item.trait}" — 이 결이 올라오는 순간을 알아차리지 못하고 흘려보내기.`));
  return { do: doList.slice(0, 5), avoid: avoid.slice(0, 5) };
}

function ensureMin<T>(items: T[], min: number, filler: () => T) {
  const result = [...items];
  // 같은 채움 문장을 두 번 넣지 않는다. 한 번은 여백을 메우지만 두 번은 성의 없음이 된다.
  const seen = new Set(result.map((item) => JSON.stringify(item)));
  while (result.length < min) {
    const next = filler();
    const key = JSON.stringify(next);
    if (seen.has(key)) break;
    seen.add(key);
    result.push(next);
  }
  return result;
}

export function buildTemplateReport(report: ReportProduct, reading: Reading, sazu: StoredSazu, today = new Date()): StoryReport {
  const guide = getGuide(report.guide);
  const modules = mergedTopicModules(sazu);
  const partnerData = firstPartner(sazu);
  const me = buildChart(reading.subject.name, modules, reading.subject, today);
  const partner = partnerData && reading.partner
    ? buildChart(reading.partner.name, (partnerData.modules as Record<string, Json>) ?? {}, reading.partner, today)
    : null;
  const crossMatches = list(at(partnerData, "crossRelations.matches"));
  const ctx: Context = {
    report,
    reading,
    me,
    partner,
    cross: partnerData
      ? {
          prose: str(at(partnerData, "crossRelations.prose")),
          matches: crossMatches
            .map((match) => ({
              label: `나 ${str(at(match, "selfChar")) ?? ""} ↔ 상대 ${str(at(match, "partnerChar")) ?? ""} · ${str(at(match, "subType")) ?? str(at(match, "type")) ?? "관계"}`,
              note: str(at(match, "note")) ?? "",
            }))
            .filter((match) => match.note),
          hap: num(at(partnerData, "crossRelations.summary.hap")) ?? 0,
          clash: ["hyeong", "chung", "pa", "hae"].reduce((sum, key) => sum + (num(at(partnerData, `crossRelations.summary.${key}`)) ?? 0), 0),
          lackingSelf: list(at(partnerData, "elementComplement.lackingSelf")).map(str).filter((item): item is string => Boolean(item)),
          lackingPartner: list(at(partnerData, "elementComplement.lackingPartner")).map(str).filter((item): item is string => Boolean(item)),
          covered: num(at(partnerData, "elementComplement.coveredCount")),
        }
      : null,
    wealth: (modules.wealth as Record<string, Json>) ?? null,
    health: (modules.healthBalance as Record<string, Json>) ?? null,
  };

  const builders = BUILDERS[report.slug] ?? [natal, timing, actionSection];
  const usedPanels = new Set<StoryPanel>();
  const sections = report.chapters.map((title, index) => {
    const built = (builders[index] ?? actionSection)(ctx, title);
    const panel = built.panel && !usedPanels.has(built.panel) ? built.panel : null;
    if (panel) usedPanels.add(panel);
    return {
      ...built,
      title,
      panel,
      body: ensureMin(built.body, 2, () => "이 대목은 앞에서 본 명식의 흐름을 기준 삼아, 서두르지 않고 천천히 살펴보면 좋아요."),
      evidence: ensureMin(built.evidence, 1, () => ({ label: `일주 ${str(me.pillar("day")?.full) ?? ""}`, detail: "풀이의 기준이 되는 나의 기둥이에요." })),
    };
  });

  const timeline = ensureMin(timelineFor(me), 3, () => ({ period: "앞으로 석 달", tone: "neutral" as const, title: "흐름을 지켜볼 때", note: "큰 결정보다 일상의 리듬을 지키는 편이 좋아요." }));
  const actions = actionsFor(ctx);
  actions.do = ensureMin(actions.do, 3, () => "중요한 결정은 하루 묵힌 뒤 다시 읽어 보세요.");
  actions.avoid = ensureMin(actions.avoid, 3, () => "남과 비교하며 조급해지기.");

  const name = reading.subject.name;
  const partnerName = reading.partner?.name;
  const { dominant, missing } = dominantAndMissing(me);
  const favorableLayer = (list(at(ctx.wealth, "fortuneLayers")) as Record<string, Json>[]).find((layer) => layer.favorable === true);
  const decadeKeyword = str(at(me.decade.current, "twelveFortune.keyword"));
  const studyGroup = sipseongGroups(me)[0];
  const goodPeriod = timelineFor(me).find((item) => item.tone === "good")?.period;
  const headline =
    report.roles?.partner === "child" && ctx.cross
      ? `${partnerName}와 나, ${ctx.cross.hap > ctx.cross.clash ? "닮은 기운이 많아 통하는 사이" : "다른 기운이라 부딪히지만 서로를 채우는 사이"}`
      : report.category === "study" && studyGroup && STUDY_STYLE[studyGroup[0]]
        ? `${STUDY_STYLE[studyGroup[0]]!.type} 공부 체질, ${goodPeriod ? `${goodPeriod}에 힘이 실려요` : "리듬을 지키면 오르는 흐름"}`
        : report.partner !== "none" && ctx.cross
      ? `${partnerName}님과의 인연, ${ctx.cross.hap > ctx.cross.clash ? "끌림은 남아 있지만" : "긴장이 먼저 보이지만"} ${fortuneTone(num(at(me.decade.current, "twelveFortune.level"))) === "caution" ? "지금은 기다림의 때" : "흐름은 다시 열리는 중"}`
      : report.slug === "money" && ctx.wealth
        ? `재물의 문은 ${favorableLayer ? `${str(favorableLayer.label)} ${str(favorableLayer.ganji)}에` : "흐름이 바뀔 때"} 열리고, ${at(ctx.wealth, "natalWealth.talJaeRisk") === true ? "사람과 섞이면 새기 쉬운" : "담아 둘수록 커지는"} 구조`
        : report.slug === "health"
          ? `${dominant.join("·") || "한쪽"} 기운이 넘치는 몸, ${missing.length ? `${missing.join("·")} 기운을 채우며` : "균형을 지키며"} 과열을 덜어낼 때`
          : `${me.dayMaster ? `${me.dayMaster.char}${me.dayMaster.element} 일간` : name}${me.gyeokguk ? ` · ${me.gyeokguk.name}` : ""}, ${decadeKeyword ? `지금은 "${decadeKeyword}"의 대운을 지나는 중` : "지금의 흐름을 읽을 때"}`;

  const summary = [
    sections[0]?.lead,
    sections[1]?.lead,
    timeline.find((item) => item.tone === "good") ? `가장 가까이 힘이 실리는 때는 ${timeline.find((item) => item.tone === "good")!.period}이에요.` : null,
    report.questions[0] && reading.answers[report.questions[0].id] ? `"${reading.answers[report.questions[0].id]}"라고 답해 주신 지금의 상황에 맞춰 풀었어요.` : null,
  ]
    .filter(Boolean)
    .join(" ");

  const keywords = Array.from(
    new Set([
      ...me.keywords.slice(0, 2),
      str(at(me.decade.current, "twelveFortune.keyword"))?.split(/[와과 ]/)[0],
      me.yongsin.yong ? `용신 ${elementKo(me.yongsin.yong)}` : null,
      me.gyeokguk?.name,
    ].filter((item): item is string => Boolean(item) && item!.length <= 8)),
  ).slice(0, 5);

  const briefing: BriefingBeat[] = [
    { speaker: "narration", text: `${josa(guide.name, "이/가")} 명식지를 가만히 덮고 ${name}님을 바라보았다.` },
    { speaker: "guide", text: `${name}님, 기다리게 했죠. ${partnerName ? `두 사람의` : "당신의"} 명식을 끝까지 읽었어요.` },
    { speaker: "guide", text: `한마디로 하면, ${endWithPeriod(headline)}` },
    sections[0] ? { speaker: "guide", text: `먼저 결론부터 말할게요. ${sections[0].lead}` } : null,
    sections[0]?.evidence[0]
      ? { speaker: "guide", text: `근거로 삼은 건 「${sections[0].evidence[0].label}」예요. ${sections[0].evidence[0].detail}` }
      : null,
    sections[1] ? { speaker: "guide", text: `그리고 하나 더. ${sections[1].lead}` } : null,
    timeline[0] ? { speaker: "guide", text: `시기로는 ${timeline[0].period}부터 보면, 「${timeline[0].title}」의 흐름이에요.` } : null,
    answerLine(reading, "wish") || answerLine(reading, "concern") || answerLine(reading, "contactStatus")
      ? { speaker: "guide", text: (answerLine(reading, "wish") ?? answerLine(reading, "concern") ?? answerLine(reading, "contactStatus"))! }
      : null,
    { speaker: "guide", text: `오늘 딱 하나만 해 본다면, ${actions.do[0]!.replace(/\.$/, "")}.` },
    { speaker: "guide", text: "자세한 풀이와 근거, 시기표는 보고서에 정리해 두었어요. 천천히 펼쳐 보세요." },
  ].filter((beat): beat is BriefingBeat => Boolean(beat));

  return {
    briefing,
    headline,
    summary,
    keywords: ensureMin(keywords, 3, () => report.categoryLabel).slice(0, 5),
    sections,
    timeline,
    actions,
    closing: `${report.disclaimer ? `${report.disclaimer} ` : ""}이 보고서는 명리 계산을 바탕으로 한 참고용 풀이예요. 흐름을 아는 건 지도를 갖는 일일 뿐, 어느 길로 갈지는 언제나 ${name}님의 몫이에요.`,
  };
}
