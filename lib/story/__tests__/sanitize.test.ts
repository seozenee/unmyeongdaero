import { describe, expect, it } from "vitest";
import { soften, softenDeep } from "../sanitize";

describe("soften · 고객이 읽을 문장에서 걷어내야 하는 것", () => {
  it("내부 점수를 지운다", () => {
    expect(soften("득령·득지·득세를 모두 갖춘 신강 79점 구조예요.")).not.toMatch(/\d+점/);
    expect(soften("신약(11점) 구조라 기대는 편이에요.")).not.toMatch(/\d+점/);
  });

  it("겁주는 전통 표현을 생활 언어로 바꾼다", () => {
    expect(soften("형사사건 주의")).toContain("시비");
    expect(soften("수술 가능성")).toContain("몸의 무리");
    expect(soften("재앙이 따른다")).toContain("변수");
    expect(soften("관재구설이 있다")).toContain("말과 서류의 구설");
  });

  it("sazu 원본의 [인접] 표시를 걷어낸다", () => {
    expect(soften("[인접] 천간합")).toBe("천간합");
  });

  it("멀쩡한 문장은 건드리지 않는다", () => {
    const text = "병(丙)과 신(辛)의 천간합 화(化)수. 인연의 끌림이 강함.";
    expect(soften(text)).toBe(text);
  });
});

describe("softenDeep · AI 가 만든 보고서 전체를 훑는다", () => {
  it("중첩된 객체·배열 안의 문자열까지 정제한다", () => {
    const report = {
      headline: "신강 79점이라 밀어붙이는 힘이 강해요",
      sections: [
        {
          title: "1장",
          body: ["신약(11점) 구조예요.", "형사사건 주의가 필요해요."],
          evidence: [{ label: "일간 병화 · 신강 79점", detail: "재앙이 따를 수 있어요." }],
        },
      ],
      keywords: ["독립적"],
      count: 6,
      nested: { deep: { value: "수술 이야기" } },
    };

    const cleaned = softenDeep(report);
    const text = JSON.stringify(cleaned);

    expect(text).not.toMatch(/\d+점/);
    expect(text).not.toMatch(/형사사건|재앙|수술/);
    // 숫자·구조는 그대로 유지
    expect(cleaned.count).toBe(6);
    expect(cleaned.sections[0]!.body).toHaveLength(2);
    expect(cleaned.keywords).toEqual(["독립적"]);
  });
});
