import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { jsonError, toErrorResponse } from "@/lib/errors";
import { getOwnedPurchasedReading } from "@/lib/readings/service";
import { z } from "zod";
import { getRepository } from "@/lib/db";
import { notifyPhoneSchema } from "@/lib/readings/schema";
import { notifyReading } from "@/lib/readings/notify";
import { needsCalendarRepair } from "@/lib/readings/calculation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// GET /api/readings/:id — 생성 상태 폴링용
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "LOGIN_REQUIRED", "로그인이 필요해요.");

  try {
    const { reading } = await getOwnedPurchasedReading(user, params.id);
    if (needsCalendarRepair(reading)) return NextResponse.json({ status: reading.status === "generating" ? "generating" : "draft", error: null, errorRetryable: true, script: null });
    return NextResponse.json({
      status: reading.status,
      error: reading.error,
      // 되지 않을 재시도를 화면이 권하지 않도록 함께 내려 준다
      errorRetryable: reading.errorRetryable ?? true,
      script: reading.script,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

const contactSchema = z.object({ notifyPhone: notifyPhoneSchema.refine(Boolean, "휴대전화 번호를 입력해 주세요."), consent: z.literal(true) });

// 본인이 구매한 풀이의 알림 번호만 바꿀 수 있다. 결제·권한·사주 입력은 변경하지 않는다.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "LOGIN_REQUIRED", "로그인이 필요해요.");
  try {
    const { reading, report } = await getOwnedPurchasedReading(user, params.id);
    const parsed = contactSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return jsonError(400, "INVALID_PHONE", "휴대전화 번호와 알림 수신 동의를 확인해 주세요.");
    const notifyConsentAt = new Date().toISOString();
    await getRepository().updateReading(reading.id, { notifyPhone: parsed.data.notifyPhone, notifyConsentAt, notifiedKind: null });
    const result = reading.status === "ready" ? await notifyReading({ ...reading, notifyPhone: parsed.data.notifyPhone, notifyConsentAt, notifiedKind: null }, report, "reading-ready") : null;
    return NextResponse.json({ registered: true, ready: reading.status === "ready", sent: result?.sent ?? false });
  } catch (error) {
    return toErrorResponse(error);
  }
}
