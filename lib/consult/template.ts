import "server-only";

// ANTHROPIC_API_KEY 가 없는 개발 환경용 상담 대체 답변. sazu 응답에 이미 있는 판정 문장만 엮는다.
import type { StoredSazu } from "@/lib/db/types";
import { mergedModules } from "@/lib/sazu/readings";

function at(value: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (current === null || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[key];
  }, value);
}

const text = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : null);

export function buildTemplateConsultReply(sazu: StoredSazu, name: string, turn: number) {
  const modules = mergedModules(sazu);
  const pool = [
    text(at(modules, "evaluation.lifePhase.current.summary")),
    text(at(modules, "sinStrength.analysis")),
    text(at(modules, "seun.currentSeun.interpretation")),
    text(sazu.consult?.guide.purpose),
  ].filter((sentence): sentence is string => Boolean(sentence));

  const pick = pool.length > 0 ? pool[turn % pool.length]! : "지금 명식에서 가장 크게 움직이는 흐름부터 차분히 살펴볼게요.";

  return [
    `${name}님, 그 마음 충분히 이해해요.`,
    `명식에서 이 질문과 가장 가까운 대목은 이거예요. ${pick}`,
    "오늘은 결론을 서두르기보다, 지금 할 수 있는 작은 선택 하나를 정해 보는 걸 권해요.",
    "(AI 연결 전 개발 모드의 예시 답변이에요.)",
  ].join("\n\n");
}
