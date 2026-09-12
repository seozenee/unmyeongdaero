import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { jsonError, toErrorResponse } from "@/lib/errors";
import { getOwnedPurchasedReading } from "@/lib/readings/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/readings/:id — 생성 상태 폴링용
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "LOGIN_REQUIRED", "로그인이 필요해요.");

  try {
    const { reading } = await getOwnedPurchasedReading(user, params.id);
    return NextResponse.json({ status: reading.status, error: reading.error, script: reading.script });
  } catch (error) {
    return toErrorResponse(error);
  }
}
