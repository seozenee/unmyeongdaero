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
 */
function normalizeSiteUrl(value: string | undefined) {
  const fallback = "http://localhost:3001";
  if (!value) return fallback;
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    return new URL(withProtocol).origin;
  } catch {
    return fallback;
  }
}

export const env = {
  siteUrl: normalizeSiteUrl(read("NEXT_PUBLIC_SITE_URL")),
  sazuApiKey: read("SAZU_API_KEY"),
  anthropicApiKey: read("ANTHROPIC_API_KEY"),
  anthropicModel: read("ANTHROPIC_MODEL"),
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
  solapiSender: read("SOLAPI_SENDER"),
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
export type AiMode = "anthropic" | "template";

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
  ai: (): AiMode => pick(Boolean(env.anthropicApiKey), "anthropic", "template", "Anthropic", ["ANTHROPIC_API_KEY"]),
};

/** sazu Free 키는 5개 샘플 프로필만 계산하는 샌드박스로 동작한다 */
export const isSazuSandbox = () => Boolean(env.sazuApiKey?.startsWith("sazu_free_"));
