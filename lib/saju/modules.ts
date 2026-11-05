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
 * 대운 비교용 현재 나이. 자체 엔진은 lifeTimeline과 대운 모두 세는 나이를 쓴다.
 * 이전 sazu 저장본은 만 나이를 쓰므로 자체 엔진의 나이가 없을 때 기존 기준으로 읽는다.
 */
export function resolveCurrentAge(modules: SazuModules, birth: SimpleDate, reference: SimpleDate) {
  const life = z.object({ 나이: z.number().finite() }).passthrough().safeParse(modules.lifeTimeline);
  if (life.success) return life.data.나이;
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

// ─── 연도별 세운 ────────────────────────────────────────────────────────────

export interface YearItem {
  year: number;
  age: number;
  ganji: string;
  /** 12운성 이름 (장생·제왕·묘…) */
  stage?: string;
  /** 1~12. 높을수록 힘이 실리는 해 */
  level?: number;
  note?: string;
}

const yearRunSchema = z
  .object({
    years: z
      .array(
        z
          .object({
            year: z.number(),
            age: z.number().optional(),
            internationalAge: z.number().optional(),
            ganji: z.string(),
            interpretation: z.string().optional(),
            twelveFortune: z.object({ name: z.string().optional(), level: z.number().optional() }).passthrough().optional(),
          })
          .passthrough(),
      )
      .min(2),
  })
  .passthrough();

/** 연도별 흐름표용 세운 목록. 한두 해만 있으면 표가 되지 않으므로 둘 미만이면 비운다. */
export function parseYearRun(modules: SazuModules): YearItem[] | null {
  const parsed = yearRunSchema.safeParse(modules.seun);
  if (!parsed.success) return null;
  return parsed.data.years.map((item) => ({
    year: item.year,
    age: item.internationalAge ?? item.age ?? 0,
    ganji: item.ganji,
    stage: item.twelveFortune?.name,
    level: item.twelveFortune?.level,
    note: item.interpretation,
  }));
}

// ─── 타고난 성격 ─────────────────────────────────────────────────────────────

/**
 * 성격을 풀이의 맨 앞에 두기 위한 파서.
 *
 * "읽기 전에 내 성격부터 말해 줘야 하지 않나" 는 말을 들었다. 본문의 성격 장은 AI 가
 * 쓰지만, 그건 첫 장이 아닐 수도 있고 상품마다 자리가 다르다. 계산에서 바로 나오는
 * 성격 값(lib/manse/character.ts)을 따로 꺼내, 어떤 상품이든 표지 다음에 같은 자리로 둔다.
 */
export interface CharacterPanel {
  base: string;
  force: string;
  strong: { name: string; note: string } | null;
  weak: { name: string; note: string } | null;
  inside: string;
  outside: string;
  shadow: string | null;
  missing: string | null;
  core: Array<{ topic: string; conclusion: string; scene: string; flip: string; basis: string[] }>;
}

const groupSchema = z.object({ 이름: z.string(), 모습: z.string() });
const characterSchema = z.object({
  바탕: z.string(),
  힘: z.string(),
  드러나는쪽: groupSchema.nullish(),
  모자란쪽: groupSchema.nullish(),
  안에서: z.string(),
  밖에서: z.string(),
  그늘: z.string().nullish(),
  비는기운: z.string().nullish(),
  핵심풀이: z.array(z.object({
    주제: z.string(), 결론: z.string(), 모습: z.string(), 이면: z.string(), 근거: z.array(z.string()).optional(),
  })).optional(),
}).passthrough();

export function parseCharacter(modules: SazuModules): CharacterPanel | null {
  const parsed = characterSchema.safeParse(modules.character);
  if (!parsed.success) return null;
  const value = parsed.data;
  return {
    base: value.바탕,
    force: value.힘,
    strong: value.드러나는쪽 ? { name: value.드러나는쪽.이름, note: value.드러나는쪽.모습 } : null,
    weak: value.모자란쪽 ? { name: value.모자란쪽.이름, note: value.모자란쪽.모습 } : null,
    inside: value.안에서,
    outside: value.밖에서,
    shadow: value.그늘 ?? null,
    missing: value.비는기운 ?? null,
    core: (value.핵심풀이 ?? []).map(item => ({
      topic: item.주제, conclusion: item.결론, scene: item.모습, flip: item.이면, basis: item.근거 ?? [],
    })),
  };
}
