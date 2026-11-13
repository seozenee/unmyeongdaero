import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin/access";
import {
  adminPushPublicKey, findAdminPushDevice, pushRequestSchema,
  removeAdminPushDevice, saveAdminPushDevice, testAdminPushDevice,
} from "@/lib/admin/push";
import { getCurrentUser } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.email || !isAdmin(user)) return new Response(null, { status: 404 });
  const parsed = pushRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "이 브라우저의 알림 정보를 확인할 수 없어요." }, { status: 400 });
  const data = parsed.data;

  try {
    if (data.action === "unsubscribe") {
      await removeAdminPushDevice(user.id, data.endpoint);
      return NextResponse.json({ subscribed: false });
    }
    if (!adminPushPublicKey()) {
      return NextResponse.json({ error: "서버의 결제 알림 설정을 먼저 완료해 주세요." }, { status: 503 });
    }
    if (data.action === "subscribe") {
      await saveAdminPushDevice(user.id, user.email, data.subscription);
      return NextResponse.json({ subscribed: true });
    }
    const device = await findAdminPushDevice(user.id, data.endpoint);
    if (data.action === "status") return NextResponse.json({ subscribed: Boolean(device) });
    if (!device) return NextResponse.json({ error: "이 기기에서 결제 알림을 먼저 켜 주세요." }, { status: 409 });
    if (await testAdminPushDevice(device) === "expired") {
      return NextResponse.json({ error: "알림 연결이 만료됐어요. 이 기기에서 알림을 다시 켜 주세요.", subscribed: false }, { status: 410 });
    }
    return NextResponse.json({ subscribed: true });
  } catch {
    return NextResponse.json({ error: "알림 설정을 처리하지 못했어요. 잠시 후 다시 시도해 주세요." }, { status: 503 });
  }
}
