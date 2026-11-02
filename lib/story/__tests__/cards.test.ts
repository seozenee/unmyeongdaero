import { describe, expect, it } from "vitest";
import { readingCardWindows } from "../cards";

const window = (year: number, month?: number) => ({ year, month, cautions: [], reasons: ["계산된 귀인 자리"] });

describe("계산된 시기를 그대로 보여 주는 카드", () => {
  it("지난 달을 빼고 중복 연도 대신 계산된 가까운 월을 먼저 보여 준다", () => {
    const source = { readingFocus: { benefactor: [window(2025), window(2026), window(2026, 9), window(2026, 11), window(2026, 11), window(2027, 9), window(2029)] } };
    expect(readingCardWindows(source, "2026-11-02").benefactor.map(item => item.period)).toEqual(["2026년 11월", "2027년 9월", "2029년"]);
  });
  it("월이 없는 연도 후보에 월을 만들어 붙이지 않고 주의 단서도 보존한다", () => {
    const source = { readingFocus: { partnership: [{ ...window(2031), cautions: ["가까운 자리의 부딪힘"] }] } };
    expect(readingCardWindows(source, "2026-11-02").partnership).toEqual([{ period: "2031년", monthly: false, hasCaution: true }]);
  });
  it("계산이 없는 옛 풀이와 잘못된 날짜에 임의의 시기를 만들지 않는다", () => {
    expect(readingCardWindows({}, "2026-11-02")).toEqual({ benefactor: [], partnership: [] });
    expect(readingCardWindows({ readingFocus: { benefactor: [window(2027, 13), window(2027, 0)] } }, "2026-11-02").benefactor).toEqual([]);
  });
  it("인생 풀이에는 귀인 시기를 포함하고 특정 주제 상품의 범위를 지킨다", () => {
    const modules = { readingFocus: { benefactor: [window(2027)], partnership: [window(2031)] } };
    expect(readingCardWindows(modules, "2026-11-02", { slug: "life", chapters: ["타고난 그릇의 모양"] }).benefactor).toHaveLength(1);
    expect(readingCardWindows(modules, "2026-11-02", { slug: "career", chapters: ["나에게 맞는 일의 종류"] })).toEqual({ benefactor: [], partnership: [] });
    expect(readingCardWindows(modules, "2026-11-02", { slug: "love", chapters: ["올해 인연이 들어오는 흐름"] }).partnership).toHaveLength(1);
  });
});
