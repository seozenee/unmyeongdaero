import "server-only";

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
  /** 집계가 가능한 환경인지. 로컬 파일 DB 에서는 집계하지 않는다 */
  available: boolean;
  today: { paidCount: number; revenue: number };
  week: { paidCount: number; revenue: number };
  readings: { ready: number; generating: number; failed: number; draft: number };
  /** 아직 결제가 끝나지 않고 남아 있는 건 */
  pendingPayments: number;
  users: number;
}

const EMPTY: AdminSummary = {
  available: false,
  today: { paidCount: 0, revenue: 0 },
  week: { paidCount: 0, revenue: 0 },
  readings: { ready: 0, generating: 0, failed: 0, draft: 0 },
  pendingPayments: 0,
  users: 0,
};

export async function loadSummary(now = new Date()): Promise<AdminSummary> {
  if (modes.data() !== "supabase") return EMPTY;
  const db = getSupabaseAdmin();

  const since = { today: startOfTodayKst(now), week: daysAgo(7, now) };

  const [todayRows, weekRows, readingRows, pending, users] = await Promise.all([
    db.from("payments").select("amount").eq("status", "paid").gte("paid_at", since.today),
    db.from("payments").select("amount").eq("status", "paid").gte("paid_at", since.week),
    db.from("readings").select("status"),
    db.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending"),
    db.from("purchases").select("user_id"),
  ]);

  const sum = (rows: { amount: number }[] | null) => (rows ?? []).reduce((total, row) => total + (row.amount ?? 0), 0);
  const countBy = (rows: { status: string }[] | null, status: string) =>
    (rows ?? []).filter((row) => row.status === status).length;

  return {
    available: true,
    today: { paidCount: (todayRows.data ?? []).length, revenue: sum(todayRows.data) },
    week: { paidCount: (weekRows.data ?? []).length, revenue: sum(weekRows.data) },
    readings: {
      ready: countBy(readingRows.data, "ready"),
      generating: countBy(readingRows.data, "generating"),
      failed: countBy(readingRows.data, "failed"),
      draft: countBy(readingRows.data, "draft"),
    },
    pendingPayments: pending.count ?? 0,
    // 구매한 적 있는 사람 수 — 가입만 한 사람은 세지 않는다
    users: new Set((users.data ?? []).map((row) => row.user_id as string)).size,
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

export async function listReadings(options: { status?: string; limit?: number } = {}): Promise<AdminReadingRow[]> {
  if (modes.data() !== "supabase") return [];
  const db = getSupabaseAdmin();

  let query = db
    .from("readings")
    .select("id, created_at, status, report_slug, subject, error, notified_kind, pdf_token")
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 50);
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
    hasPdf: Boolean(row.pdf_token),
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

export async function listPayments(options: { status?: string; limit?: number } = {}): Promise<AdminPaymentRow[]> {
  if (modes.data() !== "supabase") return [];
  const db = getSupabaseAdmin();

  let query = db
    .from("payments")
    .select("payment_id, created_at, paid_at, status, provider, amount, report_slug, failure_reason, pg_transaction_id")
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 50);
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
export async function listProductSales(): Promise<Array<{ title: string; count: number; revenue: number }>> {
  if (modes.data() !== "supabase") return [];
  const { data, error } = await getSupabaseAdmin()
    .from("payments")
    .select("report_slug, amount")
    .eq("status", "paid");
  if (error) throw new Error(`[admin] 상품별 판매를 읽지 못했습니다: ${error.message}`);

  const tally = new Map<string, { count: number; revenue: number }>();
  for (const row of data ?? []) {
    const slug = row.report_slug as string;
    const entry = tally.get(slug) ?? { count: 0, revenue: 0 };
    entry.count += 1;
    entry.revenue += (row.amount as number) ?? 0;
    tally.set(slug, entry);
  }
  return Array.from(tally.entries())
    .map(([slug, entry]) => ({ title: getReport(slug)?.title ?? slug, ...entry }))
    .sort((a, b) => b.revenue - a.revenue);
}
