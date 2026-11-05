import type { FourPillars } from "./pillars";
import { computeSeun } from "./luck";

/** 최근 열 해의 운을 따로 계산한다. 어린아이에게 태어나기 전의 경험을 붙이지 않는다. */
export function computePastYears(pillars: FourPillars, birthYear: number, referenceYear: number) {
  return Array.from({ length: 10 }, (_, index) => referenceYear - 10 + index)
    .filter(year => year >= birthYear + 5)
    .map(year => computeSeun(pillars, birthYear, year));
}
