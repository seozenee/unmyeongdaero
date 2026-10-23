import "server-only";

import type { StoredSazu } from "@/lib/db/types";

/**
 * 저장된 명식 데이터를 읽는 도우미.
 *
 * 이름에 sazu 가 남아 있는 건 저장 형식(StoredSazu)의 이름을 그대로 따랐기 때문이다.
 * 계산은 더 이상 sazu 를 부르지 않고 lib/manse 가 한다. 여기 있는 건 "여러 토픽에 흩어진
 * modules 와 glossary 를 하나로 합쳐 읽는" 일뿐이다.
 */

/** 차트용 modules: manse 를 바탕으로 토픽 응답의 모듈을 덧씌운다 */
export function mergedModules(sazu: StoredSazu): Record<string, unknown> {
  const merged: Record<string, unknown> = {};
  for (const topic of Object.values(sazu)) Object.assign(merged, topic?.modules);
  return { ...merged, ...sazu.manse?.modules };
}

export function mergedGlossary(sazu: StoredSazu): Record<string, string> {
  return Object.assign({}, ...Object.values(sazu).map((topic) => topic?.glossary ?? {}));
}

/** 샌드박스 표본으로 만든 풀이인지. 직접 계산으로 바뀐 뒤로는 항상 false 지만, 예전 기록이 남아 있다 */
export const isSampleReading = (sazu: StoredSazu) => Object.values(sazu).some((topic) => topic?.sample);
