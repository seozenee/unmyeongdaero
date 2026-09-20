import { describe, expect, it } from "vitest";
import { computeCrossRelations, computeNatalRelations, incomingRelations, branchRelations, stemRelations } from "../relations";
import { computeFourPillars } from "../pillars";
import type { Branch, Stem } from "../tables";

const token = <T extends string>(position: string, char: T) => ({ position, char });

describe("천간", () => {
  it("갑기는 합하여 토가 된다", () => {
    const [relation] = stemRelations([token("일간", "갑" as Stem), token("월간", "기" as Stem)]);
    expect(relation?.type).toBe("천간합");
    expect(relation?.element).toBe("토");
  });

  it("갑경은 충한다", () => {
    expect(stemRelations([token("일간", "갑" as Stem), token("년간", "경" as Stem)])[0]?.type).toBe("천간충");
  });

  it("합이 성립하면 충으로 다시 세지 않는다", () => {
    expect(stemRelations([token("일간", "을" as Stem), token("월간", "경" as Stem)])).toHaveLength(1);
  });
});

describe("지지", () => {
  const types = (chars: Branch[]) =>
    branchRelations(chars.map((char, index) => token(`자리${index}`, char))).map((relation) => relation.type);

  it("신자진이 모이면 삼합", () => {
    expect(types(["신", "자", "진"])).toContain("삼합");
  });

  it("왕지를 낀 두 글자는 반합", () => {
    expect(types(["신", "자"])).toContain("반합");
  });

  it("왕지가 빠지면 반합이 아니다", () => {
    expect(types(["신", "진"])).not.toContain("반합");
  });

  it("인묘진이 모이면 방합", () => {
    expect(types(["인", "묘", "진"])).toContain("방합");
  });

  it("자오는 충", () => {
    expect(types(["자", "오"])).toContain("충");
  });

  it("인사신이 모이면 삼형", () => {
    expect(types(["인", "사", "신"])).toContain("형");
  });

  it("자묘는 형", () => {
    expect(types(["자", "묘"])).toContain("형");
  });

  it("진이 겹치면 자형", () => {
    expect(types(["진", "진"])).toContain("자형");
  });

  it("축진은 파", () => {
    expect(types(["축", "진"])).toContain("파");
  });

  it("자미는 해", () => {
    expect(types(["자", "미"])).toContain("해");
  });

  it("부딪힐 것이 없으면 아무 관계도 없다", () => {
    expect(types(["자", "신"]).filter((type) => type !== "반합")).toHaveLength(0);
  });
});

describe("원국", () => {
  // 1990-05-15 13:30 서울 남 → 경오 신사 무술 기미
  const pillars = computeFourPillars({ year: 1990, month: 5, day: 15, hour: 13, minute: 30, city: "서울" });

  it("네 기둥에서 관계를 뽑고 요약을 붙인다", () => {
    const { relations, summary } = computeNatalRelations(pillars);
    expect(relations.length).toBeGreaterThan(0);
    expect(summary).not.toHaveLength(0);
    // 자리 이름이 사람이 읽을 수 있게 붙는다
    expect(relations[0]!.sourcePosition).toMatch(/^[년월일시]/);
  });

  it("관계가 없으면 없다고 말한다", () => {
    // 관계가 하나도 없는 가상의 원국
    const bare = { year: p("갑자"), month: p("갑자"), day: p("갑자"), hour: null };
    expect(computeNatalRelations(bare).summary).toContain("담담하게");
  });
});

function p(full: string) {
  return { full, stem: full[0]!, branch: full[1]!, hanja: "" };
}

describe("들어오는 운", () => {
  const pillars = computeFourPillars({ year: 1990, month: 5, day: 15, hour: 13, minute: 30, city: "서울" });

  it("운과 원국 사이만 남기고, 원국끼리의 관계는 빼놓는다", () => {
    const found = incomingRelations(pillars, { stem: "갑" as Stem, branch: "자" as Branch, label: "2026 세운" });
    expect(found.every((relation) => `${relation.sourcePosition}${relation.targetPosition}`.includes("2026 세운"))).toBe(true);
  });
});

describe("두 사람 사이", () => {
  const mine = computeFourPillars({ year: 1990, month: 5, day: 15, hour: 13, minute: 30, city: "서울" });
  const theirs = computeFourPillars({ year: 1992, month: 3, day: 3, hour: 9, city: "서울" });
  const names = { mine: "나", theirs: "상대" };

  it("두 사람 사이의 관계만 남는다", () => {
    const { relations } = computeCrossRelations(mine, theirs, names);
    for (const relation of relations) {
      const left = relation.sourcePosition.includes("나");
      const right = relation.targetPosition.includes("나");
      expect(left).not.toBe(right);
    }
  });

  it("오행을 서로 얼마나 채워 주는지 본다", () => {
    const { elementComplement } = computeCrossRelations(mine, theirs, names);
    expect(elementComplement).toHaveLength(5);
    expect(elementComplement.every((item) => item.note.length > 0)).toBe(true);
  });

  it("요약이 두 사람의 이름을 쓰거나 일지를 짚는다", () => {
    const { summary } = computeCrossRelations(mine, theirs, names);
    expect(summary).toMatch(/일지|나|상대/);
  });
});

describe("sazu 표본과 맞춰 보기 — 무인 정사 병인 계사", () => {
  // 샘플 strong-male: 1998-05-19 10:00 서울 남
  const pillars = computeFourPillars({ year: 1998, month: 5, day: 19, hour: 10, minute: 0, city: "서울" });
  const { relations } = computeNatalRelations(pillars);
  const has = (type: string, a: string, b: string) =>
    relations.some((relation) => relation.type === type && [relation.source, relation.target].sort().join("") === [a, b].sort().join(""));

  it("원국이 무인 정사 병인 계사", () => {
    expect([pillars.year.full, pillars.month.full, pillars.day.full, pillars.hour?.full]).toEqual([
      "무인", "정사", "병인", "계사",
    ]);
  });

  it("인·사 형 — 삼형에서 둘만 만나도 본다", () => {
    expect(has("형", "인", "사")).toBe(true);
  });

  it("인·사 해", () => {
    expect(has("해", "인", "사")).toBe(true);
  });

  it("무·계 천간합", () => {
    expect(has("천간합", "무", "계")).toBe(true);
  });

  it("정·계 천간충", () => {
    expect(has("천간충", "정", "계")).toBe(true);
  });

  it("붙어 있는 자리인지 표시한다", () => {
    const yearMonth = relations.find(
      (relation) => relation.sourcePosition.startsWith("년") && relation.targetPosition.startsWith("월"),
    );
    expect(yearMonth?.isAdjacent).toBe(true);
    const yearHour = relations.find(
      (relation) => relation.sourcePosition.startsWith("년") && relation.targetPosition.startsWith("시"),
    );
    expect(yearHour?.isAdjacent).toBe(false);
  });
});
