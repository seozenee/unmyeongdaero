import { describe, expect, it } from "vitest";
import { getReport } from "@/lib/reports/catalog";
import { readingDraftSchema, validateDraftForReport } from "@/lib/readings/schema";

const product = getReport("child-talent")!;
const question = product.questions[0]!;

const SUBJECT = {
  name: "김하늘", birthYear: 2012, birthMonth: 5, birthDay: 3,
  birthHour: 9, birthMinute: 0, isFemale: true, isLunar: false, birthCity: "서울",
};

/** 나머지 질문은 보기 중 하나로 채우고, 보는 질문 하나만 바꾼다 */
const draft = (answer: string) =>
  readingDraftSchema.parse({
    slug: product.slug,
    subject: SUBJECT,
    answers: {
      ...Object.fromEntries(product.questions.map((item) => [item.id, item.options[0]!])),
      [question.id]: answer,
    },
  });

describe("풀이 입력 검증", () => {
  it("보기 중 하나를 고르면 통과한다", () => {
    expect(validateDraftForReport(product, draft(question.options[0]!))).toBeNull();
  });

  it("보기에 없이 직접 적은 답도 통과한다", () => {
    // 「기타 — 직접 쓸게요」로 적은 답이 되돌려 보내지고 있었다. 손님 화면에는
    // "「…」에 답해 주세요"가 떴다 — 방금 적어 놓고 안 적었다는 말을 듣는 셈이다.
    expect(validateDraftForReport(product, draft("보기에 없는 사정이라 직접 적습니다"))).toBeNull();
  });

  it("비워 두면 되돌려 보낸다", () => {
    expect(validateDraftForReport(product, draft("   "))).toContain(question.question);
  });

  it("입력칸이 받는 길이를 넘기면 되돌려 보낸다", () => {
    // 화면에서 maxLength 로 막아 두었지만 서버가 그걸 믿을 것은 아니다
    expect(validateDraftForReport(product, draft("가".repeat(201)))).toContain("너무 길어요");
  });
});
