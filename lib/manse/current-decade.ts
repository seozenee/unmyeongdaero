import type { SazuModules } from "../saju/modules";

/** 자체 엔진의 대운 시작 나이와 같은 기준(세는 나이)으로 현재 구간을 고른다. */
export function currentDecadeFrom(modules: SazuModules): Record<string, unknown> | null {
  const life = modules.lifeTimeline as { 나이?: unknown } | undefined;
  const seun = modules.seun as { currentSeun?: { age?: unknown } } | undefined;
  const age = life?.나이 ?? seun?.currentSeun?.age;
  if (typeof age !== "number" || !Number.isFinite(age)) return null;

  const fortune = modules.decadeFortune as { list?: unknown } | undefined;
  if (!Array.isArray(fortune?.list)) return null;
  // 저장된 목록의 순서에 기대지 않고 나이를 포함하는 10년 구간을 찾는다.
  return fortune.list.find((item): item is Record<string, unknown> => {
    if (!item || typeof item !== "object") return false;
    const startAge = (item as Record<string, unknown>).startAge;
    return typeof startAge === "number" && age >= startAge && age < startAge + 10;
  }) ?? null;
}
