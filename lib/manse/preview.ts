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
import { computeSeun } from "./luck";
import { incomingRelations } from "./relations";
import { branchTenGod, tenGod, type Branch, type Stem } from "./tables";
import type { FourPillars } from "./pillars";
import { buildReadingTeaser } from "./teaser";
import type { ReadingFocus } from "./reading-focus";

const blockSchema = z.object({
  title: z.string().min(1), lead: z.string().min(1),
  body: z.array(z.string().min(1)).min(2).max(4),
  evidenceIds: z.array(z.string()).min(1).max(3),
  reason: z.string().optional(),
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

/*
  판매 화면이 쓰는 「판」 — 명식 표와 미리보기에 박히는 계산값.

  경쟁 서비스의 결제 전 화면은 "타고난 부의 크기 667억", "만남 장소: 집 근처 스타벅스",
  "182cm 강아지상"처럼 아주 구체적인 수치로 사람을 붙든다. 잘 팔리는 이유는 분명하다 —
  구체적인 것은 읽힌다. 하지만 그 값들은 생년월일로는 계산되지 않는다. 돈을 받고 파는
  글에 그런 수치를 적으면 그건 풀이가 아니라 거짓말이고, 환불과 표시광고법 쪽 문제가 된다.

  그래서 자리는 똑같이 만들되, 칸은 계산되는 값으로 채운다.
    · 명식 표의 십성 — 실제로 계산한다
    · 미리보기의 연·월 — 인연·귀인·월운에서 실제로 계산한 시점이다
    · 재물의 크기 — 액수 대신 재성이 드러난 정도를 다섯 칸으로 보여 준다
    · 조심할 해 — 그 해의 글자가 원국과 부딪히는지로 고른다
  구체적인 내용은 모자이크로 가린다. 가린 것은 결제 후 실제로 열린다.
*/
export interface SalesBoard {
  /** 명식 네 기둥 — 자리마다 십성을 붙인다 */
  pillars: Array<{ slot: string; label: string; stemGod: string | null; branchGod: string; hanja: string; full: string }>;
  /** 결제 전에 날짜만 먼저 보여 주는 세 가지 */
  preview: Array<{ period: string; label: string }>;
  /** 재물이 드러난 정도 — 1~5칸. 액수가 아니다 */
  wealth: { level: number; label: string; basis: string[] };
  /** 그 해의 글자가 원국과 부딪히는 해 */
  risks: Array<{ period: string; reason: string }>;
}

const obj = (value: unknown): Record<string, unknown> => value && typeof value === "object" ? value as Record<string, unknown> : {};
const text = (value: unknown) => typeof value === "string" ? value : "";
const arr = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

export function buildPreviewContext(modules: SazuModules, profile: BirthProfile, product: ReportProduct, now = new Date(), concern = "", answers: Record<string, string> = {}, partner: BirthProfile | null = null) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const year = Number(today.slice(0, 4));
  const pillars = computeFourPillars({ year: profile.birthYear, month: profile.birthMonth, day: profile.birthDay,
    hour: profile.birthHour, minute: profile.birthMinute, isLunar: profile.isLunar, isLeapMonth: profile.isLeapMonth, city: profile.birthCity });
  const birthYear = Number(pillars.basis.solarDate.slice(0, 4));
  const age = year - birthYear + 1;
  const character = obj(modules.character);
  const relation = obj(modules.wongukInteraction);
  const yong = obj(modules.yongsin);
  const wealth = obj(modules.wealth);
  const romance = obj(modules.romance);
  const focus = modules.readingFocus as ReadingFocus | undefined;
  const facts: PreviewEvidence[] = [
    { id: "character", label: "타고난 기질과 힘의 쓰임", note: [text(character.바탕), text(character.힘)].filter(Boolean).join(" ") },
    { id: "inside", label: "가까운 사이에서의 반응", note: text(character.안에서) },
    { id: "outside", label: "사람들 앞에서의 반응", note: text(character.밖에서) },
    { id: "strength", label: "자주 쓰는 힘과 지나칠 때의 모습", note: [text(obj(character.드러나는쪽).모습), text(character.그늘)].filter(Boolean).join(" ") },
    { id: "relations", label: "반복되는 관계의 긴장", note: text(relation.summary) },
    { id: "balance", label: "부담을 줄이는 방향", note: [text(yong.reasoning), text(yong.usage)].filter(Boolean).join(" ") },
    { id: "wealth", label: "일과 돈을 다루는 기준", note: text(obj(wealth.natalWealth).note) },
    { id: "romance", label: "가까워지는 방식", note: text(obj(romance.partnerStar).note) || text(character.안에서) },
    { id: "business", label: "만들고 거래하는 자리의 조합", note: focus?.business.basis.join(" · ") ?? "" },
    { id: "expression", label: "이해와 표현을 읽는 자리", note: focus?.expression.basis.join(" · ") ?? "" },
  ].filter(fact => fact.note).map(fact => ({ ...fact, note: plain(fact.note) }));
  // 실제 지난 해를 계산한다. 앞으로의 세운을 과거라고 바꿔 쓰지 않는다.
  const candidates = computePastYears(pillars, birthYear, year).map(fortune => ({
    year: fortune.year, age: fortune.age, tone: fortune.tone,
    theme: fortune.sipseongRelation.gan, phase: fortune.twelveFortune.name,
    interpretation: plain(fortune.interpretation),
    reasons: Array.from(new Set(fortune.hapChungRelations.map(item => plain(item.meaning)))),
  }));
  const past = candidates.slice().sort((a, b) => b.reasons.length - a.reasons.length || b.year - a.year)
    .slice(0, 2).sort((a, b) => a.year - b.year);
  const teaser = buildReadingTeaser(modules, profile.name);
  const explanation = buildManseExplanation(modules);
  const board = buildSalesBoard(pillars, focus, teaser, year, product.roles?.subject === "child" || age < 20);
  const speech = product.guide === "gangho" ? "반말" : "존대";
  return { board, partnerName:partner?.name ?? null, crossSummary:text(modules.crossSummary), today, name: profile.name, age, slug: product.slug, strength: text(obj(modules.sinStrength).strength), child: product.roles?.subject === "child", minor: age < 20,
    speech, category: product.category, product: product.title,
    unknownHour: profile.birthHour === null, concern, lifeContext: intakeContext(answers), facts, past, basis: explanation,
    months: teaser.months.slice(0, 12).map(month => ({ period: month.label, tone: month.tone, note: plain(month.note) })),
    character: { inside: text(character.안에서), outside: text(character.밖에서) },
    topics: product.chapters, focus,
    pillars: { year: pillars.year, month: pillars.month, day: pillars.day, hour: pillars.hour },
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

const SLOT_LABEL = { hour: "時", day: "日", month: "月", year: "年" } as const;

function buildSalesBoard(
  pillars: FourPillars,
  focus: ReadingFocus | undefined,
  teaser: ReturnType<typeof buildReadingTeaser>,
  thisYear: number,
  young: boolean,
): SalesBoard {
  const day = pillars.day.stem as Stem;
  const board: SalesBoard["pillars"] = (["hour", "day", "month", "year"] as const).flatMap(slot => {
    const pillar = pillars[slot];
    if (!pillar) return [];
    return [{
      slot,
      label: SLOT_LABEL[slot],
      stemGod: slot === "day" ? "일원" : tenGod(day, pillar.stem as Stem),
      branchGod: branchTenGod(day, pillar.branch as Branch),
      hanja: pillar.hanja,
      full: pillar.full,
    }];
  });

  // 결제 전에 보여 주는 세 시점. 모두 계산해 둔 자리에서 가져온다 — 지어내지 않는다.
  const ahead = <T extends { year: number; month?: number }>(items: readonly T[] = []) =>
    items.filter(item => item.year >= thisYear).sort((a, b) => a.year - b.year || (a.month ?? 0) - (b.month ?? 0));
  // 세 줄이 같은 달을 가리키면 셋이 아니라 하나다. 이미 쓴 시점은 건너뛰고 다음 후보를 고른다.
  const used = new Set<string>();
  const takeNext = (items: ReadonlyArray<{ period: string }>, label: string) => {
    for (const item of items) {
      const period = item.period.replace(" 절입 이후", "");
      if (used.has(period)) continue;
      used.add(period);
      return { period, label };
    }
    return null;
  };
  const preview = [
    young ? null : takeNext(ahead(focus?.partnership), "인연의 흐름이 겹치는 때"),
    takeNext(ahead(focus?.benefactor), young ? "도와줄 사람이 나타나는 때" : "도움의 실마리가 열리는 때"),
    takeNext(teaser.months.filter(month => month.tone === "good").map(month => ({ period: month.label })), young ? "배운 것이 결과로 나오는 때" : "준비한 것을 꺼내 볼 때"),
  ].filter((item): item is { period: string; label: string } => item !== null);

  // 재물의 "크기"는 액수가 아니라 재성이 드러난 정도다. 다섯 칸으로만 보여 준다.
  const wealthBasis = (["year", "month", "day", "hour"] as const).flatMap(slot => {
    const pillar = pillars[slot];
    if (!pillar) return [];
    const label = { year: "년", month: "월", day: "일", hour: "시" }[slot];
    const gods = [
      ...(slot === "day" ? [] : [{ god: tenGod(day, pillar.stem as Stem), where: `${label}간 ${pillar.stem}` }]),
      { god: branchTenGod(day, pillar.branch as Branch), where: `${label}지 ${pillar.branch}` },
    ];
    return gods.filter(item => item.god === "정재" || item.god === "편재").map(item => `${item.where} ${item.god}`);
  });
  const level = Math.min(5, Math.max(1, wealthBasis.length + 1));
  // 적게 드러났다고 "돈이 없다"는 뜻이 아니다. 드러난 자리가 적을수록 안에서 쌓는 쪽으로 읽는다.
  const WEALTH_LABEL = ["", "겉보다 안에서 쌓는 쪽", "한 자리에 또렷한 쪽", "여러 자리에 드러난 쪽", "두텁게 깔린 쪽", "가장 두텁게 깔린 쪽"];

  // 조심할 해 — 그 해의 글자가 원국의 어느 자리와 부딪히는지로 고른다.
  const risks: SalesBoard["risks"] = [];
  for (let offset = 0; offset < 10 && risks.length < 2; offset += 1) {
    const target = thisYear + offset;
    // computeSeun 의 두 번째 값은 나이를 세는 기준일 뿐이고, 여기서는 간지만 쓴다.
    const ganji = computeSeun(pillars, thisYear, target).ganji;
    const hit = incomingRelations(pillars, { stem: ganji[0] as Stem, branch: ganji[1] as Branch, label: "그해" })
      .find(item => ["충", "형", "자형"].includes(item.type));
    if (hit) risks.push({ period: `${target}년`, reason: `${hit.type} — ${plain(hit.meaning)}` });
  }
  return { pillars: board, preview, wealth: { level, label: WEALTH_LABEL[level]!, basis: wealthBasis }, risks };
}
