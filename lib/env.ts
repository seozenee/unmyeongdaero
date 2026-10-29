import "server-only";

// 외부 서비스 설정과 동작 모드. 키가 없는 서비스는 개발 환경에서만 로컬 대체 구현으로 돈다.
// 프로덕션(NODE_ENV=production)에서는 대체 모드를 절대 쓰지 않고, 설정 누락 시 사용 시점에 에러를 던진다.

const read = (name: string) => {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
};

/**
 * 배포 환경변수에는 "example.com" 처럼 프로토콜 없이 넣기 쉽다.
 * 그대로 new URL() 에 넘기면 예외가 나고 빌드가 통째로 깨지므로 여기서 한 번 보정한다.
 *
 * 비어 있을 때 곧장 localhost 로 떨어뜨리지는 않는다. 이 주소는 결제 복귀 주소와
 * 카카오톡 버튼 주소에 그대로 박히는데, localhost 가 박히면 개발 중에는 아무 일도
 * 없고 손님 휴대폰에서만 죽는다. 배포 환경이 알려 주는 주소를 먼저 쓰고,
 * 그것도 없을 때만 localhost 로 간다.
 */
function normalizeSiteUrl(value: string | undefined) {
  const candidates = [
    value,
    read("NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL"),
    read("VERCEL_PROJECT_PRODUCTION_URL"),
    read("NEXT_PUBLIC_VERCEL_URL"),
    read("VERCEL_URL"),
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const withProtocol = /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`;
    try {
      return new URL(withProtocol).origin;
    } catch {
      // 다음 후보로 넘어간다
    }
  }

  return "http://localhost:3001";
}

export const env = {
  siteUrl: normalizeSiteUrl(read("NEXT_PUBLIC_SITE_URL")),
  anthropicApiKey: read("ANTHROPIC_API_KEY"),
  anthropicModel: read("ANTHROPIC_MODEL"),
  geminiApiKey: read("GEMINI_API_KEY"),
  geminiModel: read("GEMINI_MODEL"),
  supabaseUrl: read("SUPABASE_URL"),
  supabaseAnonKey: read("SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: read("SUPABASE_SERVICE_ROLE_KEY"),
  // 토스페이먼츠 직접 연동
  tossClientKey: read("NEXT_PUBLIC_TOSS_CLIENT_KEY"),
  tossSecretKey: read("TOSS_SECRET_KEY"),
  devSessionSecret: read("DEV_SESSION_SECRET") ?? "sazudaero-local-dev-only",
  // 알림톡 — 솔라피 계정과 카카오 비즈니스 채널·템플릿
  solapiApiKey: read("SOLAPI_API_KEY"),
  solapiApiSecret: read("SOLAPI_API_SECRET"),
  kakaoPfId: read("KAKAO_PF_ID"),
  kakaoTemplateStarted: read("KAKAO_TEMPLATE_STARTED"),
  kakaoTemplateReady: read("KAKAO_TEMPLATE_READY"),
};

export const isProduction = process.env.NODE_ENV === "production";

/** 랜딩 전용 임시 배포. 백엔드 없이 마케팅 화면만 띄우고, 구매·로그인 경로는 미들웨어가 막는다. */
export const isLandingOnly = process.env.LANDING_ONLY === "1";

/**
 * 결제 없이 전 기능을 열어 두는 시험 모드.
 * 실제 결제창 대신 모의 승인으로 소장 권한을 준다 — 즉 상품이 공짜가 된다.
 * 실고객을 받기 전에 반드시 꺼야 한다. 화면에도 시험 모드 띠를 띄워 눈에 띄게 한다.
 */
export const isFreeAccess = process.env.FREE_ACCESS === "1";

const supabaseReady = Boolean(env.supabaseUrl && env.supabaseAnonKey && env.supabaseServiceRoleKey);
const tossReady = Boolean(env.tossClientKey && env.tossSecretKey);

export type DataMode = "supabase" | "local";
export type PaymentMode = "toss" | "mock";
export type AiMode = "gemini" | "anthropic" | "template";

export class ServiceNotConfiguredError extends Error {
  constructor(service: string, variables: string[]) {
    super(`[config] ${service} 설정이 없습니다: ${variables.join(", ")}`);
    this.name = "ServiceNotConfiguredError";
  }
}

function pick<T extends string>(ready: boolean, real: T, fallback: T, service: string, variables: string[]): T {
  if (ready) return real;
  if (isProduction) throw new ServiceNotConfiguredError(service, variables);
  return fallback;
}

export const modes = {
  data: (): DataMode =>
    pick(supabaseReady, "supabase", "local", "Supabase", ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"]),
  payment: (): PaymentMode =>
    // 무료 시험 모드에서는 토스 키가 있어도 모의 결제로 보낸다
    isFreeAccess
      ? "mock"
      : pick(tossReady, "toss", "mock", "토스페이먼츠", ["NEXT_PUBLIC_TOSS_CLIENT_KEY", "TOSS_SECRET_KEY"]),
  // 제미나이가 있으면 그쪽을 먼저 쓴다. 둘 다 없으면 규칙 기반 템플릿으로 떨어진다.
  ai: (): AiMode =>
    env.geminiApiKey
      ? "gemini"
      : pick(Boolean(env.anthropicApiKey), "anthropic", "template", "Anthropic", ["ANTHROPIC_API_KEY"]),
};

/** sazu Free 키는 5개 샘플 프로필만 계산하는 샌드박스로 동작한다 */
