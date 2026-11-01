import { describe, expect, it } from "vitest";
import { removePastActions } from "../quality";
import type { StoryReport } from "../report";

it("이미 지난 해나 월은 실행 계획에서 제외하고 현재·미래 계획은 남긴다", () => {
  const report = { actions: {
    do: ["2025년까지 준비해 보세요.", "2026년 4~6월에 지원해 보세요.", "2026년 11월에 공고를 비교해 보세요.", "2027년 4~6월에 점검해 보세요.", "오늘 20분 동안 맡은 일을 적어 보세요."],
    avoid: ["2024년에는 큰 결정을 피하세요.", "생활비를 확인하기 전에 퇴사부터 정하지 마세요."],
  } } as StoryReport;
  const result = removePastActions(report, "2026-11-01");
  expect(result.actions.do).toEqual(report.actions.do.slice(2));
  expect(result.actions.avoid).toEqual(report.actions.avoid.slice(1));
  expect(report.actions.do).toHaveLength(5);
});

describe("연도 구간", () => {
  it("앞으로 이어지는 구간은 남기되 이미 끝난 구간은 제외한다", () => {
    const report = { actions: { do: ["2026~2027년에는 작은 시도를 해 보세요.", "2024~2025년에는 공고를 모아 보세요."], avoid: [] } } as unknown as StoryReport;
    expect(removePastActions(report, "2026-11-01").actions.do).toEqual([report.actions.do[0]]);
  });
});
