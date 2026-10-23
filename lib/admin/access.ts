import "server-only";

import { notFound } from "next/navigation";
import { getCurrentUser, type AppUser } from "@/lib/auth/session";
import { isProduction } from "@/lib/env";

/**
 * 운영자 판별.
 *
 * 이메일 목록을 환경변수에 둔다. DB 에 권한 칸을 만들지 않는 이유는, 그 칸을 바꿀 수 있는
 * 경로가 생기는 순간 거기가 권한 상승의 입구가 되기 때문이다. 환경변수는 배포하는 사람만
 * 바꿀 수 있다.
 *
 * 카카오 로그인은 이메일 동의를 받지 못하면 email 이 비어 있다. 그래서 운영자는
 * 이메일·비밀번호로 로그인해야 한다.
 */
function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdmin(user: AppUser | null): boolean {
  if (!user?.email) return false;
  const allowed = adminEmails();
  // 목록이 비어 있으면 아무도 들어오지 못한다. 설정을 깜빡했을 때 전부 열리는 것보다 낫다.
  if (allowed.length === 0) return false;
  return allowed.includes(user.email.toLowerCase());
}

/** 운영자가 아니면 404. 로그인 화면으로 보내지 않는 건, 이 주소의 존재 자체를 알리지 않기 위해서다 */
export async function requireAdmin(): Promise<AppUser> {
  const user = await getCurrentUser();
  if (!isAdmin(user)) {
    if (!isProduction) console.warn("[admin] 접근 거부:", user?.email ?? "로그인 안 됨");
    notFound();
  }
  return user!;
}
