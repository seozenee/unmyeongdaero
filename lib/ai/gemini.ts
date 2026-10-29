import "server-only";

import { env, ServiceNotConfiguredError } from "@/lib/env";

/**
 * 제미나이 Interactions API.
 *
 * 공식 SDK 의 generateContent 는 이 계정에서 막혀 있다 — 부르면 404 와 함께
 * "Interactions API 를 쓰라"는 안내가 돌아온다. 그래서 SDK 를 끼우지 않고
 * 이 엔드포인트를 직접 친다. 요청·응답 모양은 OpenAI Responses 쪽에 가깝다.
 *
 *   POST /v1beta/interactions
 *   { model, input, response_format? }
 *   → { status, steps: [{ type: "model_output", content: [{ type:"text", text }] }], usage }
 *
 * 구조화 출력은 response_format 에 JSON 스키마를 그대로 넣는다. OpenAI 처럼
 * { type:"json_schema", json_schema:{...} } 로 감싸면 거절당한다 — type 에는
 * object·array·string 같은 스키마 타입이 들어간다.
 */

const BASE = "https://generativelanguage.googleapis.com/v1beta/interactions";

/** 기본 모델. GEMINI_MODEL 로 바꿀 수 있다 */
export const GEMINI_MODEL = env.geminiModel ?? "gemini-3.5-flash";

export interface GeminiStep {
  type?: string;
  content?: Array<{ type?: string; text?: string }>;
}

export interface GeminiResult {
  status?: string;
  steps?: GeminiStep[];
  usage?: { total_tokens?: number; total_output_tokens?: number };
}

export class GeminiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "GeminiError";
  }
}

export async function callGemini(options: {
  input: string;
  /** 체계를 주면 그 모양으로만 답한다 */
  schema?: Record<string, unknown>;
  model?: string;
  signal?: AbortSignal;
}): Promise<GeminiResult> {
  if (!env.geminiApiKey) throw new ServiceNotConfiguredError("Gemini", ["GEMINI_API_KEY"]);

  const response = await fetch(BASE, {
    method: "POST",
    headers: { "x-goog-api-key": env.geminiApiKey, "content-type": "application/json" },
    body: JSON.stringify({
      model: options.model ?? GEMINI_MODEL,
      input: options.input,
      ...(options.schema && { response_format: options.schema }),
    }),
    signal: options.signal,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    let message = body.slice(0, 400);
    try {
      message = (JSON.parse(body) as { error?: { message?: string } }).error?.message ?? message;
    } catch {
      // 본문이 JSON 이 아니면 그대로 쓴다
    }
    throw new GeminiError(message, response.status);
  }

  return (await response.json()) as GeminiResult;
}

/**
 * 답에서 사람이 볼 글만 모은다.
 *
 * steps 에는 생각(thought)과 결과(model_output)가 함께 들어온다. 생각은 모델이
 * 혼잣말한 것이라 손님에게 보여서는 안 된다 — 결과만 고른다.
 */
export function geminiText(result: GeminiResult): string {
  const outputs = (result.steps ?? []).filter((step) => step.type !== "thought");
  const picked = outputs.length > 0 ? outputs : (result.steps ?? []);
  return picked
    .flatMap((step) => step.content ?? [])
    .filter((part) => part.type === "text" || typeof part.text === "string")
    .map((part) => part.text ?? "")
    .join("")
    .trim();
}
