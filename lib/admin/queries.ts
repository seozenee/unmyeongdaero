import "server-only";
import { COMMERCE_RESET_AT } from "../commerce-reset";

import { isAdminEmail } from "@/lib/admin/access";
import { getReport } from "@/lib/reports/catalog";
import { modes } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * 운영 화면이 읽는 집계.
 *
 * service_role 로 RLS 를 지나쳐 모든 행을 본다. 그래서 이 파일을 부르는 자리는 반드시
 * requireAdmin() 뒤여야 한다 — 여기에는 권한 검사가 없다.
 *
 * 숫자는 사실만 센다. "전환율 몇 %" 같은 가공은 넣지 않는다. 분모를 무엇으로 잡았는지
 * 잊어버린 지표는 나중에 잘못된 결정을 부른다.
 */

const KST = "Asia/Seoul";

/** 한국 시간 기준 오늘 0시(UTC ISO) */
function startOfTodayKst(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: KST, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now);
  // KST 는 UTC+9 이므로 그날 0시는 전날 15:00 UTC
  return new Date(`${parts}T00:00:00+09:00`).toISOString();
}

function daysAgo(days: number, now = new Date()): string {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

export interface AdminSummary {
  available: boolean;
  today: { paidCount: number; revenue: number };
  week: { paidCount: number; revenue: number };
  daily: { date: string; count: number; revenue: number }[];
  readings: { ready: number; generating: number; failed: number; draft: number };
  pendingPayments: number;
}

const kstDay = new Intl.DateTimeFormat("en-CA", {
  timeZone: KST, year: "numeric", month: "2-digit", day: "2-digit",
});

async function paidOrders(since: string) {
  const db = getSupabaseAdmin();
  const pageSize = 1000;
  const result: { report_slug: string; amount: number; paid_at: string }[] = [];
  for (let offset = 0; ; offset += pageSize) {
    const { data } = await db.from("payments").select("report_slug, amount, paid_at")
      .eq("status", "paid").neq("provider", "mock").gte("paid_at", since)
      .order("paid_at", { ascending: true }).order("id").range(offset, offset + pageSize - 1).throwOnError();
    result.push(...(data ?? []));
    if (!data || data.length < pageSize) return result;
  }
}

export async function loadSummary(now = new Date()): Promise<AdminSummary> {
  const midnight = new Date(startOfTodayKst(now));
  const daily = Array.from({ length: 7 }, (_, index) => ({
    date: kstDay.format(new Date(daysAgo(6 - index, midnight))), count: 0, revenue: 0,
  }));
  const summary: AdminSummary = {
    available: modes.data() === "supabase",
    today: { paidCount: 0, revenue: 0 },
    week: { paidCount: 0, revenue: 0 },
    readings: { ready: 0, generating: 0, failed: 0, draft: 0 },
    pendingPayments: 0,
    daily,
  };
  if (!summary.available) return summary;
  const db = getSupabaseAdmin();

  const since = [daysAgo(6, midnight), COMMERCE_RESET_AT].sort().at(-1)!;
  const readingCount = (status: string) => db.from("readings").select("id", { count: "exact", head: true })
    .eq("status", status).gte("created_at", COMMERCE_RESET_AT).throwOnError();
  const [payments, ready, generating, failed, draft, pending] = await Promise.all([
    paidOrders(since),
    readingCount("ready"), readingCount("generating"), readingCount("failed"), readingCount("draft"),
    db.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending")
      .neq("provider", "mock").gte("created_at", COMMERCE_RESET_AT).throwOnError(),
  ]);

  const byDay = new Map(daily.map((day) => [day.date, day]));
  for (const payment of payments) {
    const day = byDay.get(kstDay.format(new Date(payment.paid_at)));
    if (day) { day.count += 1; day.revenue += payment.amount; }
  }

  const today = daily.at(-1)!;
  return {
    ...summary,
    today: { paidCount: today.count, revenue: today.revenue },
    week: { paidCount: daily.reduce((total, day) => total + day.count, 0), revenue: daily.reduce((total, day) => total + day.revenue, 0) },
    readings: { ready: ready.count ?? 0, generating: generating.count ?? 0, failed: failed.count ?? 0, draft: draft.count ?? 0 },
    pendingPayments: pending.count ?? 0,
  };
}

export async function listAdminMembers(page: number) {
  if (modes.data() !== "supabase") return { members: [], total: null, nextPage: null, available: false };
  const { data, error } = await getSupabaseAdmin().auth.admin.listUsers({ page, perPage: 30 });
  if (error) throw new Error("[admin] 회원 목록을 읽지 못했습니다.");
  return {
    members: data.users.map((user) => ({
      id: user.id,
      email: user.email ?? null,
      provider: typeof user.app_metadata.provider === "string" ? user.app_metadata.provider : "",
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at ?? null,
      isAdmin: isAdminEmail(user.email),
    })),
    total: data.total ?? null,
    nextPage: data.nextPage,
    available: true,
  };
}

export interface AdminReadingRow {
  id: string;
  createdAt: string;
  status: string;
  reportTitle: string;
  subjectName: string;
  error: string | null;
  notifiedKind: string | null;
  hasPdf: boolean;
}

export async function listReadings(options: { status?: string; limit?: number; includeHistory?: boolean } = {}): Promise<AdminReadingRow[]> {
  if (modes.data() !== "supabase") return [];
  const db = getSupabaseAdmin();

  let query = db
    .from("readings")
    .select("id, created_at, status, report_slug, subject, error, notified_kind, pdf_path")
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 50);
  if (!options.includeHistory) query = query.gte("created_at",COMMERCE_RESET_AT);
  if (options.status) query = query.eq("status", options.status);

  const { data, error } = await query;
  if (error) throw new Error(`[admin] 풀이 목록을 읽지 못했습니다: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id as string,
    createdAt: row.created_at as string,
    status: row.status as string,
    reportTitle: getReport(row.report_slug as string)?.title ?? (row.report_slug as string),
    subjectName: ((row.subject as { name?: string } | null)?.name ?? "—") as string,
    error: (row.error as string | null) ?? null,
    notifiedKind: (row.notified_kind as string | null) ?? null,
    hasPdf: Boolean(row.pdf_path),
  }));
}

export interface AdminPaymentRow {
  paymentId: string;
  createdAt: string;
  paidAt: string | null;
  status: string;
  provider: string;
  amount: number;
  reportTitle: string;
  failureReason: string | null;
  pgTransactionId: string | null;
}

export async function listPayments(options: { status?: string; limit?: number; includeHistory?: boolean; orderId?: string; realOnly?: boolean } = {}): Promise<AdminPaymentRow[]> {
  if (modes.data() !== "supabase") return [];
  const db = getSupabaseAdmin();

  let query = db
    .from("payments")
    .select("payment_id, created_at, paid_at, status, provider, amount, report_slug, failure_reason, pg_transaction_id")
    .order(options.status === "paid" ? "paid_at" : "created_at", { ascending: false })
    .limit(options.limit ?? 50);
  if (options.orderId) query = query.eq("payment_id", options.orderId);
  else if (!options.includeHistory) query = query.gte("created_at", COMMERCE_RESET_AT);
  if (options.realOnly) query = query.neq("provider", "mock");
  if (options.status) query = query.eq("status", options.status);

  const { data, error } = await query;
  if (error) throw new Error(`[admin] 결제 목록을 읽지 못했습니다: ${error.message}`);

  return (data ?? []).map((row) => ({
    paymentId: row.payment_id as string,
    createdAt: row.created_at as string,
    paidAt: (row.paid_at as string | null) ?? null,
    status: row.status as string,
    provider: row.provider as string,
    amount: (row.amount as number) ?? 0,
    reportTitle: getReport(row.report_slug as string)?.title ?? (row.report_slug as string),
    failureReason: (row.failure_reason as string | null) ?? null,
    pgTransactionId: (row.pg_transaction_id as string | null) ?? null,
  }));
}

/** 상품별 판매 집계 — 무엇이 팔리는지 */
export async function listProductSales() {
  if (modes.data() !== "supabase") return [];
  const tally = new Map<string, { count: number; revenue: number }>();
  for (const row of await paidOrders(COMMERCE_RESET_AT)) {
    const slug = row.report_slug as string;
    const entry = tally.get(slug) ?? { count: 0, revenue: 0 };
    entry.count += 1;
    entry.revenue += (row.amount as number) ?? 0;
    tally.set(slug, entry);
  }
  return Array.from(tally.entries())
    .map(([slug, entry]) => ({ slug, title: getReport(slug)?.title ?? slug, ...entry }))
    .sort((a, b) => b.revenue - a.revenue);
}
