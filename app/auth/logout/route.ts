import { NextResponse } from "next/server";
import { DEV_SESSION_COOKIE } from "@/lib/auth/session";
import { modes } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url), { status: 303 });

  if (modes.data() === "supabase") {
    await createSupabaseServerClient().auth.signOut();
  } else {
    response.cookies.delete(DEV_SESSION_COOKIE);
  }
  return response;
}
