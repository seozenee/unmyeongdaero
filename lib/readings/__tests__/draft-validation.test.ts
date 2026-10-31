import { describe, expect, it } from "vitest";
import { getReport, REPORTS, type ReportProduct } from "@/lib/reports/catalog";
import { readingDraftSchema, validateDraftForReport } from "@/lib/readings/schema";

const product = getReport("child-talent")!;

const SUBJECT = {
  name: "김하늘", birthYear: 2012, birthMonth: 5, birthDay: 3,
  birthHour: 9, birthMinute: 0, isFemale: true, isLunar: false, birthCity: "서울",
};

const draft = (answers: Record<string, string> = {}) =>
  readingDraftSchema.parse({ slug: product.slug, subject: SUBJECT, answers });

describe("풀이 입력 검증", () => {
  it("생년월일만 있으면 통과한다", () => {
    // 고르는 질문을 없앴으므로 더 받아야 할 답이 없다
    expect(validateDraftForReport(product, draft())).toBeNull();
  });

  it("궁금한 것을 적어도 통과한다", () => {
    expect(validateDraftForReport(product, draft({ detail: "보기에 없는 사정이라 직접 적습니다" }))).toBeNull();
  });

  it("상대가 꼭 필요한 상품은 상대를 묻는다", () => {
    const pair = (REPORTS as readonly ReportProduct[]).find((item) => item.partner === "required")!;
    const built = readingDraftSchema.parse({ slug: pair.slug, subject: SUBJECT, answers: {} });
    expect(validateDraftForReport(pair, built)).toContain("상대방");
  });
});

describe("상품 목록", () => {
  it("고르는 질문이 남아 있지 않다", () => {
    // 보기에서 고른 말은 그 사람의 말이 아니다. 그 말이 풀이에 돌아가면
    // "버티는 중이라고 하셨는데 사주와 딱 맞아요"가 된다 — 자기가 고른 말을 돌려받는 셈이다.
    for (const item of REPORTS as readonly ReportProduct[]) {
      expect(item.questions ?? [], item.slug).toEqual([]);
    }
  });

  it("상품 이름이 손님의 말이다", () => {
    // 「명식 전서」처럼 우리끼리 쓰는 이름은 무엇을 파는지 알려 주지 않는다.
    //
    // 「사주」는 뺐다. 한동안 이것도 막아 두었는데, 막아 놓고 보니 열일곱 개가 전부
    // "~할까?" 한 틀로 찍혀 나왔다. 틀이 하나뿐이면 손으로 지은 이름처럼 보이지 않는다.
    // 재회사주·궁합사주·평생사주는 우리끼리 쓰는 말이 아니라 시장에서 쓰는 말이고,
    // 이름만 보고 무엇을 사는지 바로 안다 — 막을 이유가 없다.
    const jargon = /명식|전서|원국|일간|용신/;
    const reports = (REPORTS as readonly ReportProduct[]).filter((item) => item.kind === "report");
    const offenders = reports.filter((item) => jargon.test(item.title)).map((item) => item.title);
    expect(offenders).toEqual([]);
  });
});
