import { NextResponse } from "next/server";
import { getCurrentUser, loginUrl } from "@/lib/auth/session";
import { jsonError, toErrorResponse } from "@/lib/errors";
import { createDraftReading } from "@/lib/readings/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/readings — 스토리 퍼널 입력 저장(결제 전 명식 검증 포함)
export async function POST(request: Request) {
  const user = await getCurrentUser();
  let body: { slug?: string } & Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "INVALID_JSON", "요청 형식이 올바르지 않아요.");
  }

  if (!user) {
    return jsonError(401, "LOGIN_REQUIRED", "로그인이 필요해요.", {
      loginUrl: loginUrl(`/reports/${body.slug ?? ""}`),
    });
  }

  try {
    return NextResponse.json(await createDraftReading(user, body));
  } catch (error) {
    return toErrorResponse(error);
  }
}
