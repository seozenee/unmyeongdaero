import { describe, expect, it } from "vitest";
import { buildLens } from "../lens";
import type { SazuModules } from "../../saju/modules";
import manseStrongMale from "../../sazu/__fixtures__/manse.strong-male.json";

const modules = (manseStrongMale as { data: { modules: SazuModules } }).data.modules;

/**
 * 틀이 붙는 분야가 어디까지인지 지킨다.
 *
 * 한동안 종합(destiny)과 신년(year)에는 틀이 없었다. 둘 다 가장 많이 팔리는
 * 자리인데, 틀 없이 계산값만 넘기면 모델은 "성실하시네요" 쪽으로 돌아간다.
 * 분야가 늘 때 여기부터 깨지게 둔다.
 */
describe("틀 — 분야마다 다른 눈금", () => {
  const covered = ["child", "study", "romance", "reunion", "chemistry", "wealth", "work", "destiny", "year"];

  it.each(covered)("%s 에는 틀이 붙는다", (category) => {
    const lens = buildLens(modules, category);
    expect(lens).not.toBeNull();
    expect(lens!.차원.length).toBeGreaterThanOrEqual(2);
  });

  it("모르는 분야에는 틀을 붙이지 않는다", () => {
    expect(buildLens(modules, "없는분야")).toBeNull();
  });

  it("차원마다 수준·근거·본보기가 함께 나온다", () => {
    const lens = buildLens(modules, "destiny")!;
    for (const dimension of lens.차원) {
      expect(["높은 쪽", "보통", "낮은 쪽"]).toContain(dimension.수준);
      // 근거에는 따져 볼 수 있는 숫자가 들어 있어야 한다
      expect(dimension.왜).toMatch(/\d+%/);
      expect(dimension.이런모습으로.length).toBeGreaterThan(0);
    }
  });

  it("신년은 벌리는 힘과 거두는 힘을 함께 본다", () => {
    const names = buildLens(modules, "year")!.차원.map((item) => item.이름);
    expect(names).toContain("벌리는힘");
    expect(names).toContain("거두는힘");
  });
});
