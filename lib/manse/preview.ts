import { z } from "zod";
import type { BirthProfile } from "../db/types";
import type { ReportProduct } from "../reports/catalog";
import type { SazuModules } from "../saju/modules";
import { plain } from "../story/sanitize";
import { computeFourPillars } from "./pillars";
import { buildManseExplanation } from "./explanation";
import { writeInstantPreview } from "./preview-copy";
import { intakeContext } from "../story/intake";
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

export function buildPreviewContext(modules: SazuModules, profile: BirthProfile, product: ReportProduct, now = new Date(), concern = "", answers: Record<string, string> = {}) {
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
    theme: fortune.sipseongRelation.gan, phase: fortune.twelveFortune.name,
    interpretation: plain(fortune.interpretation),
    reasons: Array.from(new Set(fortune.hapChungRelations.map(item => plain(item.meaning)))),
  }));
  const past = candidates.slice().sort((a, b) => b.reasons.length - a.reasons.length || b.year - a.year)
    .slice(0, 2).sort((a, b) => a.year - b.year);
  const teaser = buildReadingTeaser(modules, profile.name);
  return { today, name: profile.name, age, slug: product.slug, strength: text(obj(modules.sinStrength).strength), child: product.roles?.subject === "child", minor: age < 20,
    speech: product.guide === "gangho" ? "반말" : "존대", category: product.category, product: product.title,
    unknownHour: profile.birthHour === null, concern, lifeContext: intakeContext(answers), facts, past, basis: buildManseExplanation(modules),
    months: teaser.months.slice(0, 6).map(month => ({ period: month.label, tone: month.tone, note: plain(month.note) })),
    character: { inside: text(character.안에서), outside: text(character.밖에서) },
    topics: product.chapters,
  };
}
export type PreviewContext = ReturnType<typeof buildPreviewContext>;

/** 결제 전에는 계산 근거에 맞춘 완성본을 동기적으로 작성한다. */
export function buildInstantPreview(context: PreviewContext): PreviewReading {
  return writeInstantPreview(context);
}

// 이전 내부 호출과 테스트의 이름을 유지한다. 결제 전에는 이 완성본을 한 번만 보낸다.
export const buildFallbackPreview = buildInstantPreview;

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
