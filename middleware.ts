import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// 랜딩 전용 임시 배포(LANDING_ONLY=1)에서 막을 경로.
// 상품 상세·무료 콘텐츠·약관은 백엔드 없이도 돌아가므로 열어 둔다.
const LANDING_BLOCKED = ["/checkout", "/library", "/consult", "/login", "/auth", "/dev"];
const LANDING_BLOCKED_API = ["/api/readings", "/api/consult", "/api/payments", "/api/saju"];

// Supabase 세션 쿠키 갱신. Supabase 미설정(개발 대체 모드)이면 아무것도 하지 않는다.
// (Edge 런타임이라 server-only 모듈인 lib/env 를 쓰지 않고 process.env 를 직접 읽는다)
export async function middleware(request: NextRequest) {
  // Edge 런타임이라 server-only 모듈인 lib/env 대신 process.env 를 직접 읽는다
  if (process.env.LANDING_ONLY === "1") {
    const { pathname } = request.nextUrl;

    if (LANDING_BLOCKED_API.some((prefix) => pathname.startsWith(prefix))) {
      return NextResponse.json(
        { error: { code: "LANDING_ONLY", message: "정식 오픈 준비 중이에요. 곧 만나요." } },
        { status: 503 },
      );
    }

    const blocked =
      LANDING_BLOCKED.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) ||
      /^\/reports\/[^/]+\/read$/.test(pathname);

    if (blocked) {
      return NextResponse.redirect(new URL("/coming-soon", request.url));
    }
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: [
    // 정적 파일·결제 웹훅(원문 본문 서명 검증)은 제외
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|api/payments/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
