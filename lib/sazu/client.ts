import "server-only";

import { SazuApiError } from "./errors";
import {
  sazuErrorBodySchema,
  sazuRequestSchemas,
  sazuSuccessSchema,
  type SazuRequest,
  type SazuResponse,
  type SazuTopic,
} from "./schemas";

const DEFAULT_BASE_URL = "https://api.sazu.app";
const DEFAULT_TIMEOUT_MS = 10_000;

export interface SazuClientOptions {
  apiKey?: string;
  baseUrl?: string;
  timeoutMs?: number;
  fetch?: typeof fetch;
}

export function createSazuClient(options: SazuClientOptions = {}) {
  const baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const fetchImpl = options.fetch ?? fetch;

  async function request<T extends SazuTopic>(topic: T, input: SazuRequest<T>): Promise<SazuResponse> {
    const apiKey = options.apiKey ?? process.env.SAZU_API_KEY;
    if (!apiKey) {
      throw new SazuApiError({ code: "MISSING_API_KEY", upstreamMessage: "SAZU_API_KEY 환경변수가 없습니다." });
    }

    // upstream 호출 전에 로컬에서 먼저 검증 → 잘못된 입력으로 쿼터를 소모하지 않는다.
    const parsedInput = sazuRequestSchemas[topic].safeParse(input);
    if (!parsedInput.success) {
      throw new SazuApiError({
        code: "VALIDATION_ERROR",
        issues: parsedInput.error.issues.map((issue) => ({ field: issue.path.join("."), code: issue.code })),
      });
    }

    let response: Response;
    try {
      response = await fetchImpl(`${baseUrl}/v2/sazu/${topic}`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": apiKey },
        body: JSON.stringify(parsedInput.data),
        signal: AbortSignal.timeout(timeoutMs),
        cache: "no-store",
      });
    } catch (cause) {
      const isTimeout = cause instanceof DOMException && cause.name === "TimeoutError";
      throw new SazuApiError({ code: isTimeout ? "TIMEOUT" : "NETWORK_ERROR", cause });
    }

    const body: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      const errorBody = sazuErrorBodySchema.safeParse(body);
      throw new SazuApiError({
        code: errorBody.success ? errorBody.data.error.code : "INVALID_RESPONSE",
        upstreamStatus: response.status,
        upstreamMessage: errorBody.success ? errorBody.data.error.message : undefined,
        issues: errorBody.success ? errorBody.data.error.issues : undefined,
      });
    }

    const success = sazuSuccessSchema.safeParse(body);
    if (!success.success) {
      throw new SazuApiError({
        code: "INVALID_RESPONSE",
        upstreamStatus: response.status,
        upstreamMessage: success.error.issues
          .slice(0, 3)
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join(", "),
        cause: success.error,
      });
    }

    return success.data;
  }

  return {
    request,
    manse: (input: SazuRequest<"manse">) => request("manse", input),
    today: (input: SazuRequest<"today">) => request("today", input),
    yearly: (input: SazuRequest<"yearly">) => request("yearly", input),
    decade: (input: SazuRequest<"decade">) => request("decade", input),
    life: (input: SazuRequest<"life">) => request("life", input),
    compatibility: (input: SazuRequest<"compatibility">) => request("compatibility", input),
    love: (input: SazuRequest<"love">) => request("love", input),
    money: (input: SazuRequest<"money">) => request("money", input),
    health: (input: SazuRequest<"health">) => request("health", input),
    consult: (input: SazuRequest<"consult">) => request("consult", input),
  };
}

export type SazuClient = ReturnType<typeof createSazuClient>;

let defaultClient: SazuClient | undefined;

/** 환경변수 기반 기본 클라이언트 (서버 전용) */
export function getSazuClient(): SazuClient {
  defaultClient ??= createSazuClient();
  return defaultClient;
}
