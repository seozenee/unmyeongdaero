import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { env, ServiceNotConfiguredError } from "@/lib/env";

/** 기본 모델. ANTHROPIC_MODEL 로 바꿀 수 있다 */
export const CLAUDE_MODEL = env.anthropicModel ?? "claude-sonnet-5";

// 서버측 거절 폴백: 안전 분류기가 요청을 거절하면 API 가 권장 모델로 같은 요청을 다시 실행한다.
// Opus 5 · Fable 5 계열에서만 지원하므로 Sonnet 으로 돌릴 때는 자동으로 꺼진다.
// 폴백이 없으면 거절이 그대로 돌아오므로 호출부의 stop_reason "refusal" 처리가 유일한 방어선이 된다.
const FALLBACK_BETA = "server-side-fallback-2026-07-01";
const supportsDefaultFallback = CLAUDE_MODEL === "claude-opus-5" || CLAUDE_MODEL.startsWith("claude-fable-5");

let client: Anthropic | undefined;

export function getAnthropic(): Anthropic {
  if (!env.anthropicApiKey) throw new ServiceNotConfiguredError("Anthropic", ["ANTHROPIC_API_KEY"]);
  client ??= new Anthropic({ apiKey: env.anthropicApiKey });
  return client;
}

/** 모든 요청에 공통으로 붙는 파라미터 */
export function claudeBaseParams() {
  return {
    model: CLAUDE_MODEL,
    thinking: { type: "adaptive" as const },
    ...(supportsDefaultFallback && { betas: [FALLBACK_BETA], fallbacks: "default" as const }),
  };
}

/**
 * 최종 메시지에서 사용자에게 보일 텍스트만 모은다.
 * 폴백이 일어났다면 fallback 블록 이후(대체 모델이 이어 쓴 부분)만 유효하다.
 */
export function finalText(content: Array<{ type: string; text?: string }>) {
  let text = "";
  for (const block of content) {
    if (block.type === "fallback") text = "";
    else if (block.type === "text" && typeof block.text === "string") text += block.text;
  }
  return text;
}
