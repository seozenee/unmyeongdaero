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
  errorRetryable: (row.error_retryable as boolean | null) ?? null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  generatedAt: row.generated_at,
  notifyPhone: row.notify_phone ?? null,
  notifyConsentAt: row.notify_consent_at ?? null,
  notifiedKind: row.notified_kind ?? null,
  pdfPath: row.pdf_path ?? null,
  pdfToken: row.pdf_token ?? null,
  pdfCreatedAt: row.pdf_created_at ?? null,
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
            notify_phone: input.notifyPhone ?? null,
            notify_consent_at: input.notifyPhone ? new Date().toISOString() : null,
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
            ...(patch.notifyPhone !== undefined && { notify_phone: patch.notifyPhone }),
            ...(patch.notifyConsentAt !== undefined && { notify_consent_at: patch.notifyConsentAt }),
            ...(patch.errorRetryable !== undefined && { error_retryable: patch.errorRetryable }),
            ...(patch.notifiedKind !== undefined && { notified_kind: patch.notifiedKind }),
            ...(patch.pdfPath !== undefined && { pdf_path: patch.pdfPath }),
            ...(patch.pdfToken !== undefined && { pdf_token: patch.pdfToken }),
            ...(patch.pdfCreatedAt !== undefined && { pdf_created_at: patch.pdfCreatedAt }),
          })
          .eq("id", id),
        "updateReading",
      );
    },

    async getReadingByPdfToken(token) {
      const row = unwrap(
        await db().from("readings").select().eq("pdf_token", token).maybeSingle(),
        "getReadingByPdfToken",
      );
      return row ? toReading(row) : null;
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

    /**
     * 가장 최근 구매 한 건.
     *
     * 같은 상품을 다시 살 수 있게 되면서 한 사람에게 같은 슬러그의 구매가 여럿 생긴다.
     * maybeSingle 은 행이 둘 이상이면 던지므로 쓸 수 없다 — 다시 산 사람의 화면이
     * 통째로 깨진다. 늘 마지막에 산 것을 연다.
     */
    async getPurchase(userId, reportSlug) {
      const rows = unwrap(
        await db()
          .from("purchases")
          .select()
          .eq("user_id", userId)
          .eq("report_slug", reportSlug)
          .order("purchased_at", { ascending: false })
          .limit(1),
        "getPurchase",
      );
      const row = rows?.[0];
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
        // 같은 결제가 두 번 들어온 경우 — 기존 것을 그대로 돌려준다(payment_id 가 unique 다)
        const samePayment = unwrap(
          await db().from("purchases").select().eq("payment_id", input.paymentRowId).limit(1),
          "createPurchase.samePayment",
        );
        if (samePayment?.[0]) return toPurchase(samePayment[0]);

        // 아직 (user_id, report_slug) 제약이 살아 있는 데이터베이스다(0008 마이그레이션 전).
        //
        // 여기서 던지면 손님은 돈을 내고 에러를 본다. 그것만은 안 된다. 기존 구매가
        // 방금 만든 풀이를 가리키게 고쳐서, 적어도 산 것은 받게 한다. 전에 받은 풀이도
        // readings 에 그대로 남아 보관함에서 열린다.
        console.error(
          `[purchase] (user, slug) 유일 제약이 아직 살아 있습니다 — supabase/migrations/0008_repurchase.sql 을 적용해 주세요`,
        );
        const moved = unwrap(
          await db()
            .from("purchases")
            .update({ payment_id: input.paymentRowId, reading_id: input.readingId, purchased_at: new Date().toISOString() })
            .eq("user_id", input.userId)
            .eq("report_slug", input.reportSlug)
            .select()
            .limit(1),
          "createPurchase.moved",
        );
        if (moved?.[0]) return toPurchase(moved[0]);
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
