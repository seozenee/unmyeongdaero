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

/**
 * 알림톡 받을 번호. 적지 않아도 된다.
 *
 * 하이픈·공백·국가번호를 걷어 내고 휴대전화 형태인지만 본다. 010-1234-5678 도,
 * +82 10 1234 5678 도 같은 값으로 저장된다.
 */
export const notifyPhoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[^0-9]/g, ""))
  .transform((digits) => (digits.startsWith("82") ? `0${digits.slice(2)}` : digits))
  .refine((digits) => digits === "" || /^01[0-9]{8,9}$/.test(digits), "휴대전화 번호를 다시 확인해 주세요.")
  .transform((digits) => digits || null)
  .nullable()
  .default(null);

export const readingDraftSchema = z.object({
  slug: z.string().min(1),
  subject: birthProfileSchema,
  partner: birthProfileSchema.nullable().default(null),
  answers: z.record(z.string(), z.string().trim().max(1000)).default({}),
  notifyPhone: notifyPhoneSchema,
});

export type ReadingDraftInput = z.input<typeof readingDraftSchema>;
export type ReadingDraft = z.output<typeof readingDraftSchema>;

/** 보기에 없이 직접 적은 답으로 받아들일 최대 길이. 입력칸의 maxLength 와 같다 */
const OTHER_ANSWER_MAX = 200;

/**
 * 상품별 추가 규칙. 문제가 없으면 null.
 *
 * 답이 보기 중 하나인지까지 보고 있었다. 「기타 — 직접 쓸게요」를 열어 둔 뒤로는
 * 그 검사가 직접 적은 답을 전부 되돌려 보냈다. 손님 화면에는 "「아이는 몇 살인가요?」에
 * 답해 주세요"가 떴다 — 방금 적어 놓고 안 적었다는 말을 듣는 셈이다.
 *
 * 보기에 없는 답도 받는다. 대신 비어 있지 않은지와, 입력칸이 받는 길이를 넘지 않았는지만
 * 본다(화면에서 막아 두었지만 서버가 믿을 것은 아니다).
 */
export function validateDraftForReport(report: ReportProduct, draft: ReadingDraft): string | null {
  if (report.partner === "required" && !draft.partner) return "상대방 정보를 입력해 주세요.";
  for (const question of report.questions) {
    const answer = draft.answers[question.id]?.trim();
    if (!answer) return `「${question.question}」에 답해 주세요.`;
    if (!question.options.includes(answer) && answer.length > OTHER_ANSWER_MAX) {
      return `「${question.question}」 답이 너무 길어요. ${OTHER_ANSWER_MAX}자 안으로 적어 주세요.`;
    }
  }
  return null;
}
