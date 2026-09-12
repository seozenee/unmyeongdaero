import "server-only";

import type { AppUser } from "@/lib/auth/session";
import { getRepository, type ConsultSession, type StoredSazu } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { fetchSazuForProfiles } from "@/lib/sazu/readings";

export async function getOwnedSession(user: AppUser, sessionId: string): Promise<ConsultSession> {
  const session = await getRepository().getConsultSession(sessionId);
  if (!session || session.userId !== user.id) {
    throw new AppError(404, "SESSION_NOT_FOUND", "상담 세션을 찾을 수 없어요.");
  }
  return session;
}

/** 남은 턴이 있는 가장 최근 세션 */
export async function getActiveSession(user: AppUser): Promise<ConsultSession | null> {
  const sessions = await getRepository().listConsultSessions(user.id);
  return sessions.find((session) => session.turnsUsed < session.turnLimit) ?? null;
}

export async function ensureSessionSazu(session: ConsultSession): Promise<StoredSazu> {
  if (session.sazu?.consult && session.sazu.manse) return session.sazu;
  const sazu = await fetchSazuForProfiles(["consult"], session.subject, null);
  await getRepository().updateConsultSessionSazu(session.id, sazu);
  return sazu;
}
