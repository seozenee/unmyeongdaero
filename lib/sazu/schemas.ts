import { z } from "zod";

// ─── 토픽 ────────────────────────────────────────────────────────────────────

export const SAZU_TOPICS = [
  "manse",
  "today",
  "yearly",
  "decade",
  "life",
  "compatibility",
  "love",
  "money",
  "health",
  "consult",
] as const;

export type SazuTopic = (typeof SAZU_TOPICS)[number];

export function isSazuTopic(value: string): value is SazuTopic {
  return (SAZU_TOPICS as readonly string[]).includes(value);
}

// ─── 요청 ────────────────────────────────────────────────────────────────────
// https://www.sazu.app/manse-api/docs 기준. 모르는 필드는 zod 기본 동작으로 제거되어 upstream 에 전달되지 않는다.

export const birthInfoSchema = z.object({
  birthYear: z.number().int().min(1900).max(2100),
  birthMonth: z.number().int().min(1).max(12),
  birthDay: z.number().int().min(1).max(31),
  /** 태어난 시각을 모르면 null */
  birthHour: z.number().int().min(0).max(23).nullable().optional(),
  birthMinute: z.number().int().min(0).max(59).optional(),
  isFemale: z.boolean(),
  isLunar: z.boolean(),
  /** isLunar 이고 윤달일 때만 true */
  isLeapMonth: z.boolean().optional(),
  birthCity: z.string().trim().min(1).max(40),
});

export const partnerSchema = birthInfoSchema.extend({
  label: z.string().trim().max(20).optional(),
});

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식이어야 합니다.");
const partners = z.array(partnerSchema).min(1).max(3);

const baseRequestSchema = birthInfoSchema.extend({
  detail: z.enum(["minimal", "standard", "full"]).optional(),
});

export const sazuRequestSchemas = {
  manse: baseRequestSchema,
  today: baseRequestSchema.extend({ date: isoDate.optional() }),
  yearly: baseRequestSchema.extend({ year: z.number().int().min(1900).max(2100).optional() }),
  decade: baseRequestSchema,
  life: baseRequestSchema,
  compatibility: baseRequestSchema.extend({ partners, metrics: z.boolean().optional() }),
  love: baseRequestSchema.extend({ partners: partners.optional(), metrics: z.boolean().optional() }),
  money: baseRequestSchema.extend({ date: isoDate.optional() }),
  health: baseRequestSchema,
  consult: baseRequestSchema,
} satisfies Record<SazuTopic, z.ZodTypeAny>;

export type BirthInfo = z.infer<typeof birthInfoSchema>;
export type PartnerInfo = z.infer<typeof partnerSchema>;
export type SazuRequest<T extends SazuTopic> = z.input<(typeof sazuRequestSchemas)[T]>;

// ─── 응답 ────────────────────────────────────────────────────────────────────
// 봉투(envelope)는 엄격히 검증하고, 모듈 내부 구조는 화면별 파서(Phase 3)에서 필요한 필드만 검증한다.
// OpenAPI(SazuReadingResponse) 상 required 는 success·data 뿐이다. 문서가 모든 v2 응답에 보장하는
// modules·guide 는 필수로 두고, glossary·meta 는 누락돼도 정상 응답을 막지 않도록 기본값을 준다.

const moduleMapSchema = z.record(z.string(), z.unknown());

export const sazuGuideSchema = z
  .object({
    purpose: z.string(),
    howToUse: z.array(z.string()),
  })
  .passthrough();

export const sazuDataSchema = z
  .object({
    topic: z.string(),
    modules: moduleMapSchema,
    guide: sazuGuideSchema,
    glossary: z.record(z.string(), z.string()).default({}),
    reference: z.record(z.string(), z.unknown()).optional(),
    partners: z
      .array(
        z
          .object({
            label: z.string().optional(),
            modules: moduleMapSchema,
          })
          .passthrough(),
      )
      .optional(),
  })
  .passthrough();

export const sazuMetaSchema = z
  .object({
    responseMs: z.number().optional(),
    topic: z.string().optional(),
    modules: z.array(z.string()).optional(),
    cached: z.boolean().optional(),
    tier: z.string().optional(),
    sample: z.boolean().optional(),
    warnings: z.array(z.unknown()).optional(),
  })
  .passthrough();

export const sazuSuccessSchema = z.object({
  success: z.literal(true),
  data: sazuDataSchema,
  meta: sazuMetaSchema.default({}),
});

export const sazuIssueSchema = z
  .object({
    field: z.string().optional(),
    code: z.string().optional(),
    expected: z.string().optional(),
    received: z.string().optional(),
    hint: z.string().optional(),
  })
  .passthrough();

export const sazuErrorBodySchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string().optional(),
    issues: z.array(sazuIssueSchema).optional(),
  }),
});

export type SazuData = z.infer<typeof sazuDataSchema>;
export type SazuMeta = z.infer<typeof sazuMetaSchema>;
export type SazuResponse = z.infer<typeof sazuSuccessSchema>;
export type SazuIssue = z.infer<typeof sazuIssueSchema>;
