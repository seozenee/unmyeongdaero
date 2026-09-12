import { NextResponse } from "next/server";
import { createDevSessionValue, DEV_SESSION_COOKIE, safeNextPath } from "@/lib/auth/session";
import { env, isProduction, modes } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET /auth/login?next=/reports/reunion → 카카오 OAuth(Supabase) 또는 개발용 세션
export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = safeNextPath(url.searchParams.get("next"));

  if (modes.data() === "supabase") {
    const supabase = createSupabaseServerClient();
    const callback = new URL("/auth/callback", env.siteUrl);
    callback.searchParams.set("next", next);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: { redirectTo: callback.toString() },
    });
    if (error || !data.url) {
      console.error("[auth] kakao signInWithOAuth 실패", error);
      return NextResponse.redirect(new URL(`/login?error=oauth&next=${encodeURIComponent(next)}`, url));
    }
    return NextResponse.redirect(data.url);
  }

  // modes.data() 가 local 이면 비프로덕션이 보장되지만, 방어적으로 한 번 더 막는다.
  if (isProduction) return new NextResponse("Not Found", { status: 404 });

  const response = NextResponse.redirect(new URL(next, url));
  response.cookies.set(DEV_SESSION_COOKIE, createDevSessionValue(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
