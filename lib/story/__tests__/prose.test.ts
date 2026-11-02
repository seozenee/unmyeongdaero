import { describe, expect, it } from "vitest";
import { readingParagraphs } from "../prose";

describe("문장 순서를 보존하는 읽기 호흡", () => {
  it("긴 문단을 문장 사이에서 나누며 내용과 소수점 날짜를 바꾸지 않는다", () => {
    const text = Array.from({length: 6}, (_, i) => `${i + 1}번째 설명은 2.5시간의 준비와 2027.02의 계획을 함께 놓고 읽는 문장이에요.`).join(" ");
    const result = readingParagraphs(text);
    expect(result.length).toBeGreaterThan(1);
    expect(result.join(" ")).toBe(text);
    expect(result.every(p => p.endsWith("문장이에요."))).toBe(true);
  });
  it("짧은 문단과 원래 단락을 유지한다", () => {
    expect(readingParagraphs("짧게 짚어요. 이유를 이어가요.\n\n다음 이야기예요.")).toEqual(["짧게 짚어요. 이유를 이어가요.", "다음 이야기예요."]);
  });
});
