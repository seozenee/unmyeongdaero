import "server-only";

import { env, ServiceNotConfiguredError } from "@/lib/env";

/**
 * OpenAI Responses API.
 *
 * 제미나이 쪽과 같은 방식으로 SDK 없이 엔드포인트를 직접 친다. 의존성을 하나 더
 * 들이지 않아도 되고, 세 제공자의 코드 모양이 같아져 비교하기 쉽다.
 *
 *   POST /v1/responses
 *   { model, input, text: { format: { type:"json_schema", name, schema } } }
 *   → { output: [{ content: [{ type:"output_text", text }] }] }
 *
 * strict 는 켜지 않는다. 켜면 스키마의 모든 속성이 required 여야 하고
 * additionalProperties:false 가 강제되는데, 우리 스키마는 그 모양이 아니다.
 * 형식만 맞춰 받고 검증은 우리 zod 로 한 번 더 한다.
 */

const BASE = "https://api.openai.com/v1/responses";

/** 기본 모델. OPENAI_MODEL 로 바꿀 수 있다 */
export const OPENAI_MODEL = env.openaiModel ?? "gpt-5.1";

export class OpenAiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: string,
  ) {
    super(message);
    this.name = "OpenAiError";
  }
}

export interface OpenAiResult {
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  usage?: { total_tokens?: number; output_tokens?: number };
}

export async function callOpenAi(input: {
  input: string;
  schema: Record<string, unknown>;
  signal?: AbortSignal;
}): Promise<OpenAiResult> {
  if (!env.openaiApiKey) throw new ServiceNotConfiguredError("OpenAI", ["OPENAI_API_KEY"]);

  const response = await fetch(BASE, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.openaiApiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: input.input,
      text: { format: { type: "json_schema", name: "story_report", schema: input.schema } },
    }),
    signal: input.signal,
  });

  const body = await response.text();
  if (!response.ok) {
    throw new OpenAiError(`[openai] ${response.status} ${response.statusText}`, response.status, body.slice(0, 600));
  }
  return JSON.parse(body) as OpenAiResult;
}

/** 응답에서 글만 뽑는다 */
export function openAiText(result: OpenAiResult) {
  return (result.output ?? [])
    .flatMap((item) => item.content ?? [])
    .filter((part) => part.type === "output_text" || typeof part.text === "string")
    .map((part) => part.text ?? "")
    .join("")
    .trim();
}
