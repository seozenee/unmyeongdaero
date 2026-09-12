import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env, ServiceNotConfiguredError } from "@/lib/env";

let adminClient: SupabaseClient | undefined;

/** service_role 클라이언트 — RLS 를 우회하므로 서버에서 사용자 소유권을 직접 확인한 뒤에만 쓴다 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    throw new ServiceNotConfiguredError("Supabase", ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
  }
  adminClient ??= createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return adminClient;
}
