import { NextResponse } from "next/server";
import { SazuApiError } from "@/lib/sazu/errors";

/** 사용자에게 보여줄 메시지를 가진 앱 에러. 라우트에서 그대로 JSON 응답으로 바뀐다 */
export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly extra: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function jsonError(status: number, code: string, message: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error: { code, message, ...extra } }, { status });
}

/** 라우트 핸들러 공통 에러 변환 */
export function toErrorResponse(error: unknown) {
  if (error instanceof AppError) return jsonError(error.status, error.code, error.message, error.extra);
  if (error instanceof SazuApiError) {
    if (error.clientStatus >= 500) console.error(error);
    const body = error.toClientJSON();
    return jsonError(error.clientStatus, body.code, body.message, { fieldErrors: body.fieldErrors, retryable: body.retryable });
  }
  console.error(error);
  return jsonError(500, "INTERNAL_ERROR", "잠시 문제가 생겼어요. 잠시 후 다시 시도해 주세요.");
}
