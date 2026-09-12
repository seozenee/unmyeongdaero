import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env, ServiceNotConfiguredError } from "@/lib/env";

/** 사용자 세션(쿠키) 기반 클라이언트 — 로그인·세션 조회용 */
export function createSupabaseServerClient() {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new ServiceNotConfiguredError("Supabase", ["SUPABASE_URL", "SUPABASE_ANON_KEY"]);
  }
  const cookieStore = cookies();

  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // 서버 컴포넌트에서는 쿠키를 쓸 수 없다. 세션 갱신은 middleware.ts 가 담당한다.
        }
      },
    },
  });
}
