// sazu 응답 data.modules 에서 화면에 필요한 값만 꺼내는 파서.
// OpenAPI 는 모듈 내부를 additionalProperties 로만 정의하므로, docs.md 사용 예시와 실제 응답
// (lib/sazu/__fixtures__)에서 확인한 필드만 검증한다. 형태가 어긋나면 null 을 돌려 해당 섹션만 숨긴다.
import { z } from "zod";
import { toFiveElement, type FiveElement } from "./ganji";

export type SazuModules = Record<string, unknown>;

export interface SimpleDate {
  year: number;
  month: number;
  day: number;
}

// ─── 원국 ────────────────────────────────────────────────────────────────────

export interface FourPillarsInput {
  year: string;
  month: string;
  day: string;
  /** 태어난 시각을 모르면 null */
  hour: string | null;
}

// 실제 응답: { full: "무인", sky: "무", earth: "인", skyElement: "토", ... } (locale ko)
const pillarSchema = z.object({ full: z.string() }).passthrough();
const fourPillarsSchema = z
  .object({ year: pillarSchema, month: pillarSchema, day: pillarSchema, hour: pillarSchema.nullish() })
  .passthrough();

export function parseFourPillars(modules: SazuModules): FourPillarsInput | null {
  const parsed = fourPillarsSchema.safeParse(modules.fourPillars);
  if (!parsed.success) return null;
  const { year, month, day, hour } = parsed.data;
  return { year: year.full, month: month.full, day: day.full, hour: hour?.full || null };
}

// ─── 오행 ────────────────────────────────────────────────────────────────────

export type ElementCounts = Record<FiveElement, number>;

// 실제 응답: { wood: { name: "목", total: { count: 2, percentage: 25 }, ... }, fire: ... }
const elementsSchema = z.record(
  z.string(),
  z.object({ name: z.string().optional(), total: z.object({ count: z.number() }).passthrough() }).passthrough(),
);

export function parseElementCounts(modules: SazuModules): ElementCounts | null {
  const parsed = elementsSchema.safeParse(modules.elements);
  if (!parsed.success) return null;

  const counts: ElementCounts = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  let matched = 0;
  for (const [key, entry] of Object.entries(parsed.data)) {
    const element = toFiveElement(key) ?? (entry.name ? toFiveElement(entry.name) : null);
    if (!element) continue;
    counts[element] = entry.total.count;
    matched += 1;
  }
  return matched > 0 ? counts : null;
}

// ─── 대운 ────────────────────────────────────────────────────────────────────

export interface DecadeItem {
  startAge: number;
  full: string;
  startYear?: number;
}

// 실제 응답: { direction: "순행", startAge: 6, list: [{ index, startAge: 6, full: "무오", ... }] } — 시작 나이 오름차순
const decadeFortuneSchema = z
  .object({
    direction: z.string().optional(),
    list: z
      .array(z.object({ startAge: z.number(), full: z.string(), startYear: z.number().optional() }).passthrough())
      .min(1),
  })
  .passthrough();

export function parseDecadeFortune(modules: SazuModules): { direction?: string; items: DecadeItem[] } | null {
  const parsed = decadeFortuneSchema.safeParse(modules.decadeFortune);
  if (!parsed.success) return null;
  return {
    direction: parsed.data.direction,
    items: parsed.data.list.map(({ startAge, full, startYear }) => ({ startAge, full, startYear })),
  };
}

/** 만 나이 */
export function internationalAge(birth: SimpleDate, reference: SimpleDate) {
  const hadBirthday =
    reference.month > birth.month || (reference.month === birth.month && reference.day >= birth.day);
  return reference.year - birth.year - (hadBirthday ? 0 : 1);
}

/**
 * 대운 비교용 현재 나이. sazu 는 input.isInternationalAge 기본값 true 로 대운 startAge 를 만 나이로 준다.
 * 응답에 seun.currentSeun.internationalAge 가 있으면 그 값을, 없으면 기준일로 계산한다.
 */
export function resolveCurrentAge(modules: SazuModules, birth: SimpleDate, reference: SimpleDate) {
  const parsed = z
    .object({ currentSeun: z.object({ internationalAge: z.number() }).passthrough() })
    .passthrough()
    .safeParse(modules.seun);
  return parsed.success ? parsed.data.currentSeun.internationalAge : internationalAge(birth, reference);
}

/** startAge 가 age 이하인 마지막 대운. 첫 대운 전이면 -1 */
export function findCurrentDecadeIndex(items: DecadeItem[], age: number) {
  let current = -1;
  items.forEach((item, index) => {
    if (item.startAge <= age) current = index;
  });
  return current;
}
