import "server-only";

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { env, isLandingOnly, modes } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface AppUser {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  provider: "kakao" | "dev";
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
    return {
      id: user.id,
      displayName: meta.name ?? meta.full_name ?? meta.preferred_username ?? null,
      avatarUrl: meta.avatar_url ?? meta.picture ?? null,
      provider: "kakao",
    };
  }

  const userId = readDevSession(cookies().get(DEV_SESSION_COOKIE)?.value);
  return userId ? { id: userId, displayName: "개발용 사용자", avatarUrl: null, provider: "dev" } : null;
}

/** 오픈 리다이렉트 방지: 같은 사이트 내부 경로만 허용 */
export function safeNextPath(next: string | null | undefined, fallback = "/") {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback;
}

export function loginUrl(next: string) {
  return `/login?next=${encodeURIComponent(next)}`;
}
