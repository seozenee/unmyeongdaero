import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  UUID_PATTERN,
  type ConsultMessage,
  type ConsultSession,
  type Payment,
  type Purchase,
  type Reading,
  type Repository,
} from "./types";

// 생성 타입 없이 행을 매핑한다
type Row = Record<string, any>;

function unwrap<T = Row>(result: { data: unknown; error: PostgrestError | null }, context: string): T | null {
  if (result.error) throw new Error(`[supabase] ${context}: ${result.error.message}`);
  return (result.data ?? null) as T | null;
}

function required<T = Row>(result: { data: unknown; error: PostgrestError | null }, context: string): T {
  const data = unwrap<T>(result, context);
  if (data === null) throw new Error(`[supabase] ${context}: 결과가 없습니다.`);
  return data;
}

const toReading = (row: Row): Reading => ({
  id: row.id,
  userId: row.user_id,
  reportSlug: row.report_slug,
  subject: row.subject,
  partner: row.partner,
  answers: row.answers ?? {},
  status: row.status,
  sazu: row.sazu,
  script: row.script,
  error: row.error,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  generatedAt: row.generated_at,
});

const toPayment = (row: Row): Payment => ({
  id: row.id,
  paymentId: row.payment_id,
  provider: row.provider,
  pgTransactionId: row.pg_transaction_id,
  userId: row.user_id,
  reportSlug: row.report_slug,
  readingId: row.reading_id,
  amount: row.amount,
  status: row.status,
  failureReason: row.failure_reason,
  paidAt: row.paid_at,
  createdAt: row.created_at,
});

const toPurchase = (row: Row): Purchase => ({
  id: row.id,
  userId: row.user_id,
  reportSlug: row.report_slug,
  paymentRowId: row.payment_id,
  readingId: row.reading_id,
  purchasedAt: row.purchased_at,
});

const toSession = (row: Row): ConsultSession => ({
  id: row.id,
  userId: row.user_id,
  paymentRowId: row.payment_id,
  subject: row.subject,
  sazu: row.sazu,
  turnLimit: row.turn_limit,
  turnsUsed: row.turns_used,
  createdAt: row.created_at,
  lastMessageAt: row.last_message_at,
});

const toMessage = (row: Row): ConsultMessage => ({
  id: row.id,
  sessionId: row.session_id,
  role: row.role,
  content: row.content,
  createdAt: row.created_at,
});

const UNIQUE_VIOLATION = "23505";

export function createSupabaseRepository(): Repository {
  const db = () => getSupabaseAdmin();

  return {
    async createReading(input) {
      const row = required(
        await db()
          .from("readings")
          .insert({
            user_id: input.userId,
            report_slug: input.reportSlug,
            subject: input.subject,
            partner: input.partner,
            answers: input.answers,
          })
          .select()
          .single(),
        "createReading",
      );
      return toReading(row);
    },

    async getReading(id) {
      if (!UUID_PATTERN.test(id)) return null;
      const row = unwrap(await db().from("readings").select().eq("id", id).maybeSingle(), "getReading");
      return row ? toReading(row) : null;
    },

    async updateReading(id, patch) {
      unwrap(
        await db()
          .from("readings")
          .update({
            ...(patch.status !== undefined && { status: patch.status }),
            ...(patch.sazu !== undefined && { sazu: patch.sazu }),
            ...(patch.script !== undefined && { script: patch.script }),
            ...(patch.error !== undefined && { error: patch.error }),
            ...(patch.generatedAt !== undefined && { generated_at: patch.generatedAt }),
          })
          .eq("id", id),
        "updateReading",
      );
    },

    async transitionReading(id, from, to) {
      const rows = unwrap(
        await db().from("readings").update({ status: to }).eq("id", id).in("status", from).select("id"),
        "transitionReading",
      );
      return (rows ?? []).length > 0;
    },

    async createPayment(input) {
      const row = required(
        await db()
          .from("payments")
          .insert({
            payment_id: input.paymentId,
            provider: input.provider,
            user_id: input.userId,
            report_slug: input.reportSlug,
            reading_id: input.readingId,
            amount: input.amount,
          })
          .select()
          .single(),
        "createPayment",
      );
      return toPayment(row);
    },

    async getPayment(paymentId) {
      const row = unwrap(await db().from("payments").select().eq("payment_id", paymentId).maybeSingle(), "getPayment");
      return row ? toPayment(row) : null;
    },

    async updatePayment(paymentId, patch) {
      unwrap(
        await db()
          .from("payments")
          .update({
            ...(patch.status !== undefined && { status: patch.status }),
            ...(patch.pgTransactionId !== undefined && { pg_transaction_id: patch.pgTransactionId }),
            ...(patch.failureReason !== undefined && { failure_reason: patch.failureReason }),
            ...(patch.paidAt !== undefined && { paid_at: patch.paidAt }),
          })
          .eq("payment_id", paymentId),
        "updatePayment",
      );
    },

    async getPurchase(userId, reportSlug) {
      const row = unwrap(
        await db().from("purchases").select().eq("user_id", userId).eq("report_slug", reportSlug).maybeSingle(),
        "getPurchase",
      );
      return row ? toPurchase(row) : null;
    },

    async listPurchases(userId) {
      const rows = unwrap(
        await db().from("purchases").select().eq("user_id", userId).order("purchased_at", { ascending: false }),
        "listPurchases",
      );
      return (rows ?? []).map(toPurchase);
    },

    async createPurchase(input) {
      const result = await db()
        .from("purchases")
        .insert({
          user_id: input.userId,
          report_slug: input.reportSlug,
          payment_id: input.paymentRowId,
          reading_id: input.readingId,
        })
        .select()
        .single();
      if (result.error?.code === UNIQUE_VIOLATION) {
        const existing = await this.getPurchase(input.userId, input.reportSlug);
        if (existing) return existing;
      }
      return toPurchase(required(result, "createPurchase"));
    },

    async createConsultSession(input) {
      const result = await db()
        .from("consult_sessions")
        .insert({
          user_id: input.userId,
          payment_id: input.paymentRowId,
          subject: input.subject,
          turn_limit: input.turnLimit,
        })
        .select()
        .single();
      if (result.error?.code === UNIQUE_VIOLATION) {
        const existing = await this.getConsultSessionByPayment(input.paymentRowId);
        if (existing) return existing;
      }
      return toSession(required(result, "createConsultSession"));
    },

    async getConsultSession(id) {
      if (!UUID_PATTERN.test(id)) return null;
      const row = unwrap(await db().from("consult_sessions").select().eq("id", id).maybeSingle(), "getConsultSession");
      return row ? toSession(row) : null;
    },

    async getConsultSessionByPayment(paymentRowId) {
      const row = unwrap(
        await db().from("consult_sessions").select().eq("payment_id", paymentRowId).maybeSingle(),
        "getConsultSessionByPayment",
      );
      return row ? toSession(row) : null;
    },

    async listConsultSessions(userId) {
      const rows = unwrap(
        await db().from("consult_sessions").select().eq("user_id", userId).order("created_at", { ascending: false }),
        "listConsultSessions",
      );
      return (rows ?? []).map(toSession);
    },

    async updateConsultSessionSazu(id, sazu) {
      unwrap(await db().from("consult_sessions").update({ sazu }).eq("id", id), "updateConsultSessionSazu");
    },

    async consumeConsultTurn(sessionId, userId) {
      const remaining = unwrap(
        await db().rpc("consume_consult_turn", { p_session_id: sessionId, p_user_id: userId }),
        "consumeConsultTurn",
      );
      return typeof remaining === "number" ? remaining : null;
    },

    async refundConsultTurn(sessionId, userId) {
      unwrap(
        await db().rpc("refund_consult_turn", { p_session_id: sessionId, p_user_id: userId }),
        "refundConsultTurn",
      );
    },

    async addConsultMessage(input) {
      const row = required(
        await db()
          .from("consult_messages")
          .insert({ session_id: input.sessionId, role: input.role, content: input.content })
          .select()
          .single(),
        "addConsultMessage",
      );
      return toMessage(row);
    },

    async listConsultMessages(sessionId) {
      const rows = unwrap(
        await db()
          .from("consult_messages")
          .select()
          .eq("session_id", sessionId)
          .order("created_at", { ascending: true }),
        "listConsultMessages",
      );
      return (rows ?? []).map(toMessage);
    },
  };
}
