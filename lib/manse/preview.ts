import { z } from "zod";
import type { BirthProfile } from "../db/types";
import type { ReportProduct } from "../reports/catalog";
import type { SazuModules } from "../saju/modules";
import { plain } from "../story/sanitize";
import { computeFourPillars } from "./pillars";
import { buildManseExplanation } from "./explanation";
import { buildRecognitionHook } from "./conversion";
import { computePastYears } from "./past";
import { buildReadingTeaser } from "./teaser";

const blockSchema = z.object({
  title: z.string().min(1), lead: z.string().min(1),
  body: z.array(z.string().min(1)).min(2).max(4),
  evidenceIds: z.array(z.string()).min(1).max(3),
});
export const previewReadingSchema = z.object({
  headline: z.string().min(1), intro: z.string().min(1),
  personality: blockSchema,
  past: z.array(z.object({ year: z.number().int(), title: z.string().min(1),
    body: z.array(z.string().min(1)).min(2).max(3), check: z.string().min(1) })).max(2),
  areas: z.array(blockSchema).length(2),
  outlook: z.object({ title: z.string().min(1), body: z.array(z.string().min(1)).min(2).max(3) }),
  closing: z.string().min(1),
});
export type PreviewReading = z.infer<typeof previewReadingSchema>;
export type PreviewEvidence = { id: string; label: string; note: string };

const obj = (value: unknown): Record<string, unknown> => value && typeof value === "object" ? value as Record<string, unknown> : {};
const text = (value: unknown) => typeof value === "string" ? value : "";
const arr = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

export function buildPreviewContext(modules: SazuModules, profile: BirthProfile, product: ReportProduct, now = new Date(), concern = "") {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const year = Number(today.slice(0, 4));
  const age = year - profile.birthYear + 1;
  const character = obj(modules.character);
  const relation = obj(modules.wongukInteraction);
  const yong = obj(modules.yongsin);
  const wealth = obj(modules.wealth);
  const romance = obj(modules.romance);
  const facts: PreviewEvidence[] = [
    { id: "character", label: "타고난 기질과 힘의 쓰임", note: [text(character.바탕), text(character.힘)].filter(Boolean).join(" ") },
    { id: "inside", label: "가까운 사이에서의 반응", note: text(character.안에서) },
    { id: "outside", label: "사람들 앞에서의 반응", note: text(character.밖에서) },
    { id: "strength", label: "자주 쓰는 힘과 지나칠 때의 모습", note: [text(obj(character.드러나는쪽).모습), text(character.그늘)].filter(Boolean).join(" ") },
    { id: "relations", label: "반복되는 관계의 긴장", note: text(relation.summary) },
    { id: "balance", label: "부담을 줄이는 방향", note: [text(yong.reasoning), text(yong.usage)].filter(Boolean).join(" ") },
    { id: "wealth", label: "일과 돈을 다루는 기준", note: text(obj(wealth.natalWealth).note) },
    { id: "romance", label: "가까워지는 방식", note: text(obj(romance.partnerStar).note) || text(character.안에서) },
  ].filter(fact => fact.note).map(fact => ({ ...fact, note: plain(fact.note) }));
  const pillars = computeFourPillars({ year: profile.birthYear, month: profile.birthMonth, day: profile.birthDay,
    hour: profile.birthHour, minute: profile.birthMinute, isLunar: profile.isLunar, isLeapMonth: profile.isLeapMonth, city: profile.birthCity });
  // 실제 지난 해를 계산한다. 앞으로의 세운을 과거라고 바꿔 쓰지 않는다.
  const candidates = computePastYears(pillars, profile.birthYear, year).map(fortune => ({
    year: fortune.year, age: fortune.age, tone: fortune.tone,
    interpretation: plain(fortune.interpretation),
    reasons: Array.from(new Set(fortune.hapChungRelations.map(item => plain(item.meaning)))),
  }));
  const past = candidates.slice().sort((a, b) => b.reasons.length - a.reasons.length || b.year - a.year)
    .slice(0, 2).sort((a, b) => a.year - b.year);
  const teaser = buildReadingTeaser(modules, profile.name);
  return { today, name: profile.name, age, child: product.roles?.subject === "child", minor: age < 20,
    speech: product.guide === "gangho" ? "반말" : "존대", category: product.category, product: product.title,
    unknownHour: profile.birthHour === null, concern, facts, past, basis: buildManseExplanation(modules),
    months: teaser.months.slice(0, 6).map(month => ({ period: month.label, tone: month.tone, note: plain(month.note) })),
    character: { inside: text(character.안에서), outside: text(character.밖에서) },
    topics: product.chapters,
  };
}
export type PreviewContext = ReturnType<typeof buildPreviewContext>;

const GROUP_PROSE: Record<string, { lead: string; scene: string; burden: string; support: string }> = {
  인성: {
    lead: "충분히 이해하고 자기 것으로 만든 뒤 움직이는 힘이 중심에 있어요.",
    scene: "설명을 들으면 바로 답하기보다, 앞뒤가 맞는지 속으로 한 번 정리하는 모습이에요. 같은 내용을 다시 읽더라도 이유를 납득하면 오래 붙잡고, 설명이 생략되면 다음 단계로 넘어가기를 어려워할 수 있습니다.",
    burden: "차근차근 이해하는 힘은 장점이지만, 모든 것을 알 때까지 시작을 미루면 부담이 됩니다. 준비가 모자라서라기보다, 확실한 답을 갖고 싶다는 마음이 발을 붙잡는 쪽에 가까워요.",
    support: "설명을 읽는 데서 끝내지 말고, 이해한 내용을 짧게 설명해 볼 자리를 함께 두는 편이 좋습니다. 완벽하게 정리한 뒤 말하기보다, 설명하다 막히는 부분을 다시 배우면 준비와 실행이 함께 자라요.",
  },
  식상: {
    lead: "배운 것을 자기 방식으로 바꿔 밖으로 꺼낼 때 힘이 나는 사람이에요.",
    scene: "설명을 그대로 받아 적을 때보다, 직접 말하거나 만들면서 이해가 깊어지는 모습입니다. 같은 과제라도 자기 생각을 넣을 여지가 있으면 오래 붙잡고, 정해진 답만 반복하라는 요구에는 답답함을 느낄 수 있어요.",
    burden: "표현하는 힘이 앞서면 설명보다 결론이 먼저 나올 수 있습니다. 머릿속에서는 이미 여러 단계를 거쳤는데 상대에게는 마지막 말만 전달되어, 맞는 말도 급하거나 차갑게 들리는 것이지요.",
    support: "결과물을 보여 주기 전에 왜 이렇게 생각했는지 한 문장만 먼저 붙여 주세요. 표현을 줄이는 것보다, 생각의 순서를 상대가 따라올 수 있게 하는 편이 이 강점을 살리는 방법입니다.",
  },
  관성: {
    lead: "맡은 역할을 분명히 알고 끝까지 해내려는 힘이 중심에 있어요.",
    scene: "언제까지 무엇을 해야 하는지 정해져 있을 때 집중이 붙는 모습입니다. 스스로 맡겠다고 한 일에는 책임을 크게 느끼고, 약속이 흐트러지면 결과뿐 아니라 과정도 마음에 오래 남을 수 있어요.",
    burden: "책임감이 지나치면 쉬는 시간에도 해야 할 일이 먼저 떠오릅니다. 다른 사람의 기대와 자기 기준을 한꺼번에 지키려다, 충분히 해냈는데도 아직 부족하다고 느끼는 것이 어려운 지점이에요.",
    support: "시작할 때 잘해야 한다는 목표와 함께 여기까지 하면 끝이라는 기준도 정해 주세요. 끝나는 선이 있어야 책임감이 자신을 몰아세우는 압박이 아니라, 믿고 맡길 수 있는 꾸준함으로 남습니다.",
  },
  재성: {
    lead: "눈에 보이는 목표와 결과가 있을 때 움직임이 또렷해지는 사람이에요.",
    scene: "무엇을 위해 하는지 알면 시간과 노력을 현실적으로 배분하는 모습입니다. 막연히 오래 하라는 말보다, 마쳤을 때 무엇이 남는지 분명한 일에 힘이 붙고 작은 결과를 모아 다음 단계를 정하는 쪽이 어울려요.",
    burden: "결과를 챙기는 장점은 성과가 늦게 보일 때 조급함으로 바뀔 수 있습니다. 아직 쌓이는 중인 과정을 실패로 판단하거나, 당장 눈에 띄는 쪽으로 방향을 자주 바꾸면 힘이 흩어질 수 있어요.",
    support: "큰 목표와 함께 중간에 확인할 작은 결과를 나누어 두는 편이 좋습니다. 한 번에 완성하려 하지 말고, 끝낸 일과 다음 일을 구분해 주면 현실적인 판단력이 꾸준함으로 이어집니다.",
  },
  비겁: {
    lead: "자기 판단으로 정하고 움직일 때 오래 버티는 힘이 나와요.",
    scene: "남이 정해 준 방식에는 답답함을 느껴도, 스스로 고른 일에는 쉽게 물러서지 않는 모습입니다. 의견을 내거나 기준을 세울 자리가 있을 때 참여가 깊어지고, 이유 없이 따라야 하는 상황에서는 마음부터 멀어질 수 있어요.",
    burden: "자기 기준을 지키는 힘이 지나치면 도움을 받는 일까지 양보처럼 느낄 수 있습니다. 혼자 책임져야 한다는 마음 때문에 나눌 수 있는 일도 붙들고, 조언을 간섭으로 받아들이는 것이 주의할 지점이에요.",
    support: "목표까지 남에게 맡기기보다, 스스로 정한 목표 안에서 방법 하나를 함께 비교해 보는 편이 좋습니다. 선택권을 지키면서 다른 방식을 받아들이면 독립성과 협력이 서로를 해치지 않아요.",
  },
};

/** 연결이 늦어도 같은 계산 근거로 읽을 수 있는 완결된 미리보기를 제공한다. */
export function buildFallbackPreview(context: PreviewContext): PreviewReading {
  const fact = (id: string) => context.facts.find(item => item.id === id)?.note;
  const hook = buildRecognitionHook(context);
  const group = context.basis.prominent?.term ?? "";
  const prose = GROUP_PROSE[group] ?? GROUP_PROSE.식상!;
  const relatedTerms: Record<string, string[]> = { 인성: ["정인", "편인"], 식상: ["식신", "상관"], 관성: ["정관", "편관"], 재성: ["정재", "편재"], 비겁: ["비견", "겁재"] };
  const placement = context.basis.placements.find(item => relatedTerms[group]?.includes(item.term));
  const reason = context.basis.prominent
    ? `사주에서는 이런 힘을 '${group}'이라고 해요. ${context.basis.prominent.meaning ?? "평소 자주 쓰는 힘을 함께 묶어 읽는 이름이에요."}${placement ? ` ${placement.position}에 있는 '${placement.character}'도 ${placement.term}에 해당해, 이 대목을 함께 봅니다.` : ""}`
    : "타고난 기질과 사람들 앞에서 드러나는 모습을 함께 살핀 결과예요.";
  return {
    headline: hook.question,
    intro: hook.scene,
    personality: {
      title: "남들이 보는 모습과 가까운 사람이 아는 모습",
      lead: prose.lead,
      body: [reason, prose.scene, prose.burden, prose.support], evidenceIds: context.facts.filter(item => ["character", "inside", "outside"].includes(item.id)).map(item => item.id).slice(0, 3),
    },
    past: context.past.map(item => ({ year: item.year, title: item.interpretation.split("—")[0]!.trim(),
      body: [
        `${item.year}년, ${item.age}살 무렵을 먼저 볼게요. 이 해의 해석은 ‘${item.interpretation}’에 무게가 있어요. 이전과 같은 방식으로 해도 주변의 반응이 달라지면서, 자기 기준을 다시 생각하게 되는 시기로 볼 수 있습니다.`,
        `${item.reasons[0] ?? "타고난 기질과 그해 들어온 흐름을 함께 비교한 결과예요."} ${context.minor || context.child ? "공부의 방식, 친구와의 거리, 부모와 약속을 정하는 과정" : "맡은 역할, 돈을 쓰는 기준, 가까운 사람과의 거리"} 중 어디에서 가장 먼저 변화를 느꼈는지 떠올려 보세요. 그때 되풀이된 선택을 이해하면, 지금 같은 장면에서 어떤 말을 먼저 건네야 할지도 더 분명해집니다.`,
      ], check: "그해 달력·사진·기록을 보면서, 이전과 달라진 일 하나와 달라지지 않은 일 하나를 비교해 보세요." })),
    areas: [
      { title: context.child ? "아이에게 닿는 말과 부담이 되는 말" : "사람에게 마음을 쓰는 방식", lead: "가까울수록 기대를 말로 확인하는 과정이 필요해요.",
        body: [`가까운 사이에 대한 해석은 ‘${fact("inside") ?? "서로의 기대를 확인하는 모습"}’에서 출발해요. 마음을 많이 썼다는 사실과 상대가 그것을 알아차렸다는 사실은 다를 수 있어요.`,
          `최근 서운했던 대화 하나에서 상대가 실제로 한 말과 내가 기대했던 말을 따로 적어 보세요. 다음에는 ‘왜 몰라줘?’ 대신 ‘이럴 때 이 말을 들으면 좋겠어’처럼 원하는 반응을 하나만 말해 보는 편이 도움이 돼요.`], evidenceIds: [context.facts.some(f => f.id === "inside") ? "inside" : context.facts[0]!.id] },
      { title: context.minor || context.child ? "배우는 힘이 성과로 이어지는 조건" : "일과 돈에서 힘을 덜 낭비하는 조건", lead: "결과를 재촉하기 전에, 힘을 쓰는 방식부터 맞춰 보세요.",
        body: [`핵심은 같은 시간을 쓰더라도 힘이 붙는 방식으로 시작하는 것입니다. ${prose.scene} 그래서 남들이 좋다는 방법을 그대로 따르기보다, 스스로 납득하고 끝까지 해낼 수 있는 순서를 만드는 것이 먼저예요.`,
          `${context.minor || context.child ? "이번 주에는 배운 내용을 다시 읽는 시간과 자기 말로 설명하는 시간을 짧게 나누어 비교해 보세요. 어느 쪽에서 막히는지가 보이면, 양을 늘리기 전에 그 단계부터 바꿔 볼 수 있어요." : "이번 주에 맡은 일 하나의 범위와 끝나는 기준을 먼저 정해 보세요. 추가 요청이 들어왔을 때 무엇을 줄여야 하는지도 함께 확인하면, 더 버티는 것만으로 해결하려는 부담을 줄일 수 있어요."}`], evidenceIds: [context.facts.some(f => f.id === "outside") ? "outside" : context.facts[0]!.id] },
    ],
    outlook: { title: "앞으로는 무엇을 준비하면 좋을까요", body: [
      context.months[0] ? `${context.months[0].period}의 해석은 ‘${context.months[0].note}’예요. 지금 세운 계획을 한 번에 크게 바꾸기보다, 작은 시도로 반응을 확인할 기준으로 삼아 보세요.` : "앞날은 정해진 사건보다 준비할 조건을 중심으로 볼게요.",
      "지나온 해에 반복된 선택 하나를 알아차렸다면, 앞으로의 한 달에는 그 선택을 다르게 해 볼 작은 행동을 정해 보세요. 결과가 달라지는지 확인하고 다음 계획의 크기를 조절하는 것이 이 풀이를 쓰는 방법이에요.",
    ] },
    closing: "여기까지는 타고난 기질과 지나온 시간의 연결을 먼저 펼쳐 본 내용이에요. 전체 보고서에서는 주제별 근거와 긴 시간의 흐름, 각 시기에 준비할 일을 이어서 읽을 수 있어요.",
  };
}

export function validatePreview(value: unknown, context: PreviewContext): PreviewReading {
  // 모델이 근거 ID를 본문 괄호 인용으로 흘려도 손님 글에는 남기지 않는다.
  // 근거는 아래 펼침 영역에서 제공하며 일반적인 괄호 설명은 보존한다.
  const clean = (item: unknown): unknown => {
    if (typeof item === "string") return item.replace(/\([^()\n]*(?:\b(?:character|inside|outside|strength|relations|balance|wealth|romance|reasons)\b|\d{4}\s*해석)[^()\n]*\)/g, "").trim();
    if (Array.isArray(item)) return item.map(clean);
    if (item && typeof item === "object") return Object.fromEntries(Object.entries(item).map(([key, value]) => [key, clean(value)]));
    return item;
  };
  const result = previewReadingSchema.parse(clean(value));
  const ids = new Set(context.facts.map(fact => fact.id));
  for (const block of [result.personality, ...result.areas]) {
    if (block.evidenceIds.some(id => !ids.has(id))) throw new Error("미리보기 근거 불일치");
  }
  const years = result.past.map(item => item.year);
  if (years.length !== context.past.length || new Set(years).size !== years.length || years.some(year => !context.past.some(item => item.year === year))) {
    throw new Error("미리보기 과거 시기 불일치");
  }
  return { ...result, past: result.past.slice().sort((a, b) => a.year - b.year) };
}
