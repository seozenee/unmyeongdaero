import { z } from "zod";
import type { BirthProfile } from "../db/types";
import type { ReportProduct } from "../reports/catalog";
import type { SazuModules } from "../saju/modules";
import { plain } from "../story/sanitize";
import { computeFourPillars } from "./pillars";
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
    unknownHour: profile.birthHour === null, concern, facts, past,
    months: teaser.months.slice(0, 6).map(month => ({ period: month.label, tone: month.tone, note: plain(month.note) })),
    character: { inside: text(character.안에서), outside: text(character.밖에서) },
    topics: product.chapters,
  };
}
export type PreviewContext = ReturnType<typeof buildPreviewContext>;

/** 연결이 늦어도 같은 계산 근거로 읽을 수 있는 완결된 미리보기를 제공한다. */
export function buildFallbackPreview(context: PreviewContext): PreviewReading {
  const fact = (id: string) => context.facts.find(item => item.id === id)?.note;
  const name = context.name;
  const who = context.child ? name : `${name}님`;
  const activity = context.minor || context.child ? "학교에서 맡은 일이나 공부" : "맡은 일과 일상의 약속";
  return {
    headline: `${who}, 앞으로의 운보다 먼저 지나온 시간을 짚어볼게요`,
    intro: `${who}의 풀이에서 먼저 볼 것은 남들에게 보이는 모습과 가까운 사람 앞에서의 차이예요. 그 차이가 지난 몇 년 동안 어디에서 드러났는지부터 살펴볼게요.`,
    personality: {
      title: "남들이 보는 모습과 가까운 사람이 아는 모습",
      lead: fact("outside") ? `밖에서는 ‘${plain(fact("outside")!)}’는 모습이 먼저 드러나요.` : "자주 쓰는 힘과 마음이 지치는 순간을 함께 볼게요.",
      body: [
        `타고난 기질에서는 ${fact("character") ?? "자기 방식과 주변의 요구를 조율하는 모습"} 이 해석은 잘한다·못한다를 가르는 평가보다, 어떤 순간에 힘을 많이 쓰는지 살피는 기준이에요.`,
        `가까운 관계에서는 ‘${plain(fact("inside") ?? "상대의 말과 내 마음을 함께 살피는 모습")}’는 해석이 나와요. ${activity}에서는 괜찮다가 가까운 사람의 한마디에 오래 마음이 쓰였던 장면을 떠올려 보세요. 밖에서의 기준과 안에서의 기대가 달랐는지를 비교하면 읽히는 대목이 더 분명해져요.`,
        `강점이 부담으로 바뀌는 지점도 있어요. ${fact("strength") ?? "이미 익숙한 방식에만 기대면 바꿔야 할 때를 알아차리기 어려워져요."} 최근 반복된 장면 하나를 골라, 그때 지키려 했던 것이 결과인지 약속인지 관계였는지부터 나눠 보세요.`,
      ], evidenceIds: context.facts.filter(item => ["character", "inside", "outside"].includes(item.id)).map(item => item.id).slice(0, 3),
    },
    past: context.past.map(item => ({ year: item.year, title: item.interpretation.split("—")[0]!.trim(),
      body: [
        `${item.year}년, ${item.age}살 무렵을 먼저 볼게요. 이 해의 해석은 ‘${item.interpretation}’에 무게가 있어요. 새로운 사건을 단정하기보다, 이전과 같은 방식으로 해도 반응이 달랐던 시점이었는지를 짚어보는 대목이에요.`,
        `${item.reasons[0] ?? "타고난 기질과 그해 들어온 흐름을 함께 비교한 결과예요."} ${context.minor || context.child ? "공부의 방식, 친구와의 거리, 부모와 약속을 정하는 과정" : "맡은 역할, 돈을 쓰는 기준, 가까운 사람과의 거리"} 중 어디에서 가장 먼저 변화를 느꼈는지 떠올려 보세요. 일어난 일을 운으로 확정하는 것이 아니라, 당시의 경험과 계산의 해석을 나란히 놓고 보는 거예요.`,
      ], check: "그해 달력·사진·기록을 보면서, 이전과 달라진 일 하나와 달라지지 않은 일 하나를 비교해 보세요." })),
    areas: [
      { title: context.child ? "아이에게 닿는 말과 부담이 되는 말" : "사람에게 마음을 쓰는 방식", lead: "가까울수록 기대를 말로 확인하는 과정이 필요해요.",
        body: [`가까운 사이에 대한 해석은 ‘${fact("inside") ?? "서로의 기대를 확인하는 모습"}’에서 출발해요. 마음을 많이 썼다는 사실과 상대가 그것을 알아차렸다는 사실은 다를 수 있어요.`,
          `최근 서운했던 대화 하나에서 상대가 실제로 한 말과 내가 기대했던 말을 따로 적어 보세요. 다음에는 ‘왜 몰라줘?’ 대신 ‘이럴 때 이 말을 들으면 좋겠어’처럼 원하는 반응을 하나만 말해 보는 편이 도움이 돼요.`], evidenceIds: [context.facts.some(f => f.id === "inside") ? "inside" : context.facts[0]!.id] },
      { title: context.minor || context.child ? "배우는 힘이 성과로 이어지는 조건" : "일과 돈에서 힘을 덜 낭비하는 조건", lead: "결과를 재촉하기 전에, 힘을 쓰는 방식부터 맞춰 보세요.",
        body: [`‘${fact("outside") ?? fact("character")}’는 해석을 구체적인 ${context.minor || context.child ? "성적이나 합격 가능성" : "수입이나 특정 직업의 성공"}으로 바꾸어 말하지는 않아요. 대신 같은 시간을 쓰고도 덜 지치는 방식이 무엇인지를 비교하는 데 쓸 수 있어요.`,
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
