import { NextResponse } from "next/server";
import { safeNextPath } from "@/lib/auth/session";
import { modes } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * POST /auth/email — 이메일·비밀번호로 로그인하거나 가입한다.
 *
 * 카카오 로그인만 있으면 안 되는 이유가 둘 있다. 카드사 심사는 소셜 계정을 심사용으로
 * 받아 주지 않아 ID/PW 계정이 있어야 하고, 카카오를 쓰지 않는 사람도 있다.
 *
 * 폼에서 직접 보내므로(JS 없이도 동작) 결과는 화면 이동으로 알린다.
 */
export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const intent = String(form.get("intent") ?? "signin");
  const next = safeNextPath(String(form.get("next") ?? ""));

  const back = (error: string) =>
    NextResponse.redirect(
      new URL(`/login?error=${error}&next=${encodeURIComponent(next)}&mode=email`, request.url),
      { status: 303 },
    );

  if (!email || !password) return back("empty");
  if (password.length < 8) return back("weak");
  if (modes.data() !== "supabase") return back("unavailable");

  const supabase = createSupabaseServerClient();

  if (intent === "signup") {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      console.error("[auth] 이메일 가입 실패", error.message);
      // 이미 있는 계정이면 그냥 로그인해 준다 — 사용자에게 둘의 차이는 중요하지 않다
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) return back("signup");
    }
    // 이메일 확인이 켜져 있으면 세션 없이 돌아온다. 그때는 확인 안내를 띄운다.
    const { data } = await supabase.auth.getUser();
    if (!data.user) return back("confirm");
    return NextResponse.redirect(new URL(next, request.url), { status: 303 });
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error("[auth] 이메일 로그인 실패", error.message);
    return back("credentials");
  }
  return NextResponse.redirect(new URL(next, request.url), { status: 303 });
}
