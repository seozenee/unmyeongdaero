import "server-only";

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { env, isLandingOnly, modes } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface AppUser {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  provider: "kakao" | "email" | "dev";
  /** 운영자 판별에 쓴다. 카카오 로그인은 이메일 동의를 받지 못하면 비어 있다 */
  email: string | null;
}

// ─── 개발 대체 로그인 (Supabase 미설정 + 비프로덕션에서만) ─────────────────────

export const DEV_SESSION_COOKIE = "sd_dev_session";

const sign = (value: string) => createHmac("sha256", env.devSessionSecret).update(value).digest("base64url");

export function createDevSessionValue(userId: string = randomUUID()) {
  return `${userId}.${sign(userId)}`;
}

function readDevSession(value: string | undefined): string | null {
  if (!value) return null;
  const [userId, signature] = value.split(".");
  if (!userId || !signature) return null;
  const expected = Buffer.from(sign(userId));
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual) ? userId : null;
}

// ─── 공통 ────────────────────────────────────────────────────────────────────

export async function getCurrentUser(): Promise<AppUser | null> {
  // 랜딩 전용 배포에는 인증 백엔드가 없다. 설정 누락 에러 대신 "아무도 로그인하지 않음"으로 본다.
  if (isLandingOnly) return null;

  if (modes.data() === "supabase") {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const meta = user.user_metadata ?? {};
    // 카카오로 들어왔는지 이메일로 들어왔는지는 Supabase 가 기록해 둔다
    const provider = user.app_metadata?.provider === "email" ? "email" : "kakao";
    return {
      id: user.id,
      displayName:
        meta.name ?? meta.full_name ?? meta.preferred_username ?? (provider === "email" ? (user.email ?? null) : null),
      avatarUrl: meta.avatar_url ?? meta.picture ?? null,
      provider,
      email: user.email ?? null,
    };
  }

  const userId = readDevSession(cookies().get(DEV_SESSION_COOKIE)?.value);
  return userId
    ? { id: userId, displayName: "개발용 사용자", avatarUrl: null, provider: "dev", email: "dev@localhost" }
    : null;
}

/** 오픈 리다이렉트 방지: 같은 사이트 내부 경로만 허용 */
export function safeNextPath(next: string | null | undefined, fallback = "/") {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback;
}

export function loginUrl(next: string) {
  return `/login?next=${encodeURIComponent(next)}`;
}
