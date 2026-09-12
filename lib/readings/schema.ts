// 스토리 퍼널에서 받은 입력 검증 (클라이언트·서버 공용)
import { z } from "zod";
import type { ReportProduct } from "../reports/catalog";

export const birthProfileSchema = z.object({
  name: z.string().trim().min(1, "이름을 적어 주세요.").max(20),
  birthYear: z.number().int().min(1900).max(2100),
  birthMonth: z.number().int().min(1).max(12),
  birthDay: z.number().int().min(1).max(31),
  birthHour: z.number().int().min(0).max(23).nullable(),
  birthMinute: z.number().int().min(0).max(59).optional(),
  isFemale: z.boolean(),
  isLunar: z.boolean(),
  isLeapMonth: z.boolean().optional(),
  birthCity: z.string().trim().min(1).max(40),
});

export const readingDraftSchema = z.object({
  slug: z.string().min(1),
  subject: birthProfileSchema,
  partner: birthProfileSchema.nullable().default(null),
  answers: z.record(z.string(), z.string().trim().max(1000)).default({}),
});

export type ReadingDraftInput = z.input<typeof readingDraftSchema>;
export type ReadingDraft = z.output<typeof readingDraftSchema>;

/** 상품별 추가 규칙. 문제가 없으면 null */
export function validateDraftForReport(report: ReportProduct, draft: ReadingDraft): string | null {
  if (report.partner === "required" && !draft.partner) return "상대방 정보를 입력해 주세요.";
  for (const question of report.questions) {
    const answer = draft.answers[question.id];
    if (!answer || !question.options.includes(answer)) return `「${question.question}」에 답해 주세요.`;
  }
  return null;
}
