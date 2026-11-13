import "server-only";

import { createHash } from "node:crypto";
import { after } from "next/server";
import webPush, { type PushSubscription, type RequestOptions } from "web-push";
import { z } from "zod";
import { isAdminEmail } from "@/lib/admin/access";
import type { Payment } from "@/lib/db/types";
import { modes } from "@/lib/env";
import { formatKRW } from "@/lib/format";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const endpointSchema = z.url().max(2048).refine((value) => {
  if (!URL.canParse(value)) return false;
  const url = new URL(value);
  if (url.protocol !== "https:" || url.port || url.username || url.password || url.hash) return false;
  const host = url.hostname;
  return host === "fcm.googleapis.com"
    || host === "android.googleapis.com"
    || host.endsWith(".push.services.mozilla.com")
    || host.endsWith(".push.apple.com")
    || host.endsWith(".notify.windows.com");
});

const keySchema = (bytes: number) => z.string().max(90).regex(/^[\w-]+={0,2}$/)
  .refine((value) => Buffer.from(value, "base64url").length === bytes);

export const pushRequestSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("subscribe"),
    subscription: z.object({
      endpoint: endpointSchema,
      keys: z.object({ p256dh: keySchema(65), auth: keySchema(16) }),
    }),
  }),
  z.object({ action: z.literal("status"), endpoint: endpointSchema }),
  z.object({ action: z.literal("unsubscribe"), endpoint: endpointSchema }),
  z.object({ action: z.literal("test"), endpoint: endpointSchema }),
]);

function getVapidDetails(): RequestOptions["vapidDetails"] | null {
  const publicKey = process.env.ADMIN_PUSH_PUBLIC_KEY?.trim();
  const privateKey = process.env.ADMIN_PUSH_PRIVATE_KEY?.trim();
  if (!keySchema(65).safeParse(publicKey).success || !keySchema(32).safeParse(privateKey).success || modes.data() !== "supabase") return null;
  return { publicKey: publicKey!, privateKey: privateKey!, subject: `mailto:${process.env.ADMIN_PUSH_CONTACT?.trim() || "help@unmyeongdaero.com"}` };
}

export function adminPushPublicKey() {
  return getVapidDetails()?.publicKey ?? null;
}

interface PushDevice {
  id: string;
  user_id: string;
  email: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

const DEVICE_FIELDS = "id, user_id, email, endpoint, p256dh, auth";
const devices = () => getSupabaseAdmin().from("admin_push_devices");

export async function saveAdminPushDevice(userId: string, email: string, subscription: PushSubscription) {
  await devices().upsert({
    user_id: userId,
    email: email.toLowerCase(),
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
  }, { onConflict: "endpoint" }).throwOnError();
}

export async function findAdminPushDevice(userId: string, endpoint: string): Promise<PushDevice | null> {
  const { data } = await devices().select(DEVICE_FIELDS).eq("user_id", userId).eq("endpoint", endpoint).maybeSingle().throwOnError();
  return data;
}

export async function removeAdminPushDevice(userId: string, endpoint: string) {
  await devices().delete().eq("user_id", userId).eq("endpoint", endpoint).throwOnError();
}

interface PushMessage {
  title: string;
  body: string;
  url: string;
  tag?: string;
}

function statusCode(error: unknown) {
  return typeof error === "object" && error !== null && "statusCode" in error ? Number(error.statusCode) : null;
}

async function sendDeviceMessage(
  device: PushDevice,
  message: PushMessage,
  vapidDetails: NonNullable<RequestOptions["vapidDetails"]>,
): Promise<"sent" | "expired"> {
  if (!endpointSchema.safeParse(device.endpoint).success) return "expired";
  const subscription = { endpoint: device.endpoint, keys: { p256dh: device.p256dh, auth: device.auth } };
  const topic = message.tag ? createHash("sha256").update(message.tag).digest("base64url").slice(0, 32) : undefined;
  const send = () => webPush.sendNotification(subscription, JSON.stringify(message), {
    vapidDetails, TTL: 60 * 60, timeout: 4000, urgency: "high", topic,
  });
  try {
    await send().catch(async (error) => {
      const code = statusCode(error);
      if (code && code < 500 && code !== 429) throw error;
      await new Promise((resolve) => setTimeout(resolve, 600));
      await send();
    });
    return "sent";
  } catch (error) {
    const code = statusCode(error);
    if (code === 404 || code === 410) {
      await removeAdminPushDevice(device.user_id, device.endpoint);
      return "expired";
    }
    throw error;
  }
}

export async function testAdminPushDevice(device: PushDevice) {
  const vapid = getVapidDetails();
  if (!vapid) throw new Error("Admin Web Push is not configured");
  return sendDeviceMessage(device, {
    title: "운명대로 운영 · 테스트 알림",
    body: "이 기기에서 새 결제 알림을 받을 수 있어요.",
    url: "/admin/notifications",
  }, vapid);
}

const CLAIM_MS = 45_000;
const PAYMENT_MAX_AGE_MS = 15 * 60_000;

async function deliverPayment(
  payment: Payment,
  device: PushDevice,
  message: PushMessage,
  vapid: NonNullable<RequestOptions["vapidDetails"]>,
) {
  const deliveries = () => getSupabaseAdmin().from("admin_payment_push_deliveries");
  const key = { payment_id: payment.id, device_id: device.id };
  await deliveries().upsert(key, { onConflict: "payment_id,device_id", ignoreDuplicates: true }).throwOnError();

  // A callback and a webhook can both observe the same paid order. Only one owns this device's lease.
  const now = Date.now();
  const lease = new Date(now + CLAIM_MS).toISOString();
  const { data: claim } = await deliveries().update({ lease_until: lease }).match(key)
    .is("sent_at", null).lt("lease_until", new Date(now).toISOString())
    .select("device_id").maybeSingle().throwOnError();
  if (!claim) return;

  const result = await sendDeviceMessage(device, message, vapid);
  if (result === "sent") {
    await deliveries().update({ sent_at: new Date().toISOString() }).match(key).eq("lease_until", lease).throwOnError();
  }
}

async function sendPaymentPush(payment: Payment, paidAt: string, reportTitle: string, vapid: NonNullable<RequestOptions["vapidDetails"]>) {
  const { data: registered } = await devices().select(DEVICE_FIELDS).lte("created_at", paidAt).throwOnError();
  const eligible = (registered ?? []).filter((device) => isAdminEmail(device.email));
  const userIds = [...new Set(eligible.map((device) => device.user_id))];
  const currentAdmins = await Promise.all(userIds.map(async (id) => {
    const { data, error } = await getSupabaseAdmin().auth.admin.getUserById(id);
    return !error && isAdminEmail(data.user?.email) ? id : null;
  }));

  const message = {
    title: "새 결제가 완료됐어요",
    body: `${reportTitle} · ${formatKRW(payment.amount)}`,
    url: `/admin/payments?${new URLSearchParams({ order: payment.paymentId })}`,
    tag: payment.paymentId,
  };
  const results = await Promise.allSettled(eligible.filter((device) => currentAdmins.includes(device.user_id))
    .map((device) => deliverPayment(payment, device, message, vapid)));
  const failures = results.filter((result) => result.status === "rejected").length;
  if (failures > 0) console.warn("[admin-push] payment delivery failed", { failures });
}

/** Runs only after verified payment. Admin free issuance and development orders are excluded. */
export function scheduleAdminPaymentPush(payment: Payment, reportTitle: string, newlyPaid = false) {
  const { paidAt } = payment;
  if (payment.provider !== "toss" || payment.status !== "paid" || !paidAt || payment.amount <= 0) return;
  const age = Date.now() - Date.parse(paidAt);
  if (!Number.isFinite(age) || (!newlyPaid && age > PAYMENT_MAX_AGE_MS)) return;
  const vapid = getVapidDetails();
  if (!vapid) return;
  try {
    after(async () => {
      try {
        await sendPaymentPush(payment, paidAt, reportTitle, vapid);
      } catch {
        console.warn("[admin-push] could not process payment notification");
      }
    });
  } catch {
    console.warn("[admin-push] could not schedule payment notification");
  }
}
