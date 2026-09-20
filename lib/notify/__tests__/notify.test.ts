import { describe, expect, it } from "vitest";
import { missingVariables, renderTemplate, TEMPLATES } from "../templates";
import { normalizePhone } from "../types";
import { notifyPhoneSchema } from "@/lib/readings/schema";

describe("전화번호 정리", () => {
  it("하이픈·공백·국가번호를 걷어 낸다", () => {
    expect(normalizePhone("010-1234-5678")).toBe("01012345678");
    expect(normalizePhone("010 1234 5678")).toBe("01012345678");
    expect(normalizePhone("+82 10-1234-5678")).toBe("01012345678");
  });

  it("휴대전화가 아니면 받지 않는다", () => {
    expect(normalizePhone("02-123-4567")).toBeNull();
    expect(normalizePhone("0101234")).toBeNull();
    expect(normalizePhone("그냥 글자")).toBeNull();
  });

  it("입력 스키마도 같은 형태로 저장한다", () => {
    expect(notifyPhoneSchema.parse("010-1234-5678")).toBe("01012345678");
    expect(notifyPhoneSchema.parse("+82 10 1234 5678")).toBe("01012345678");
    // 비워 두는 것이 기본 — 번호는 선택이다
    expect(notifyPhoneSchema.parse("")).toBeNull();
    expect(notifyPhoneSchema.parse(null)).toBeNull();
    expect(() => notifyPhoneSchema.parse("02-123-4567")).toThrow();
  });
});

describe("템플릿", () => {
  const values = {
    "#{이름}": "김서진",
    "#{상품}": "타고난 그릇",
    "#{주문번호}": "A1B2C3D4",
    "#{발행일}": "2026년 9월 20일",
  };

  it("심사에 낸 원문에 값을 끼워 문구를 만든다", () => {
    const text = renderTemplate("reading-ready", values);
    expect(text).toContain("김서진");
    expect(text).toContain("타고난 그릇");
    expect(text).not.toMatch(/#\{/);
  });

  it("빠진 치환값을 집어낸다", () => {
    expect(missingVariables("reading-ready", { "#{이름}": "김서진" })).toEqual([
      "#{상품}", "#{발행일}", "#{주문번호}",
    ]);
    expect(missingVariables("reading-ready", values)).toEqual([]);
  });

  it("원문에 쓴 치환 자리와 선언한 변수 목록이 일치한다", () => {
    for (const template of Object.values(TEMPLATES)) {
      const inBody = Array.from(new Set(template.body.match(/#\{[^}]+\}/g) ?? [])).sort();
      expect([...template.variables].sort(), template.name).toEqual(inBody);
    }
  });

  it("광고 문구를 담지 않는다 — 담는 순간 수신동의가 필요해진다", () => {
    const adWords = /할인|이벤트|쿠폰|무료|특가|혜택|추천드|광고/;
    for (const template of Object.values(TEMPLATES)) {
      expect(adWords.test(template.body), template.name).toBe(false);
    }
  });

  it("버튼은 두 개를 넘지 않는다", () => {
    for (const template of Object.values(TEMPLATES)) {
      expect(template.buttons.length, template.name).toBeLessThanOrEqual(2);
    }
  });

  it("알림톡이 막혔을 때 보낼 문자 본문도 준비되어 있다", () => {
    for (const template of Object.values(TEMPLATES)) {
      const text = template.fallback(values, { report: "https://unmyeongdaero.com/reports/life/read" });
      expect(text.length, template.name).toBeGreaterThan(0);
      expect(text, template.name).toContain("운명대로");
    }
  });
});
