import "server-only";

// 외부 서비스 설정과 동작 모드. 키가 없는 서비스는 개발 환경에서만 로컬 대체 구현으로 돈다.
// 프로덕션(NODE_ENV=production)에서는 대체 모드를 절대 쓰지 않고, 설정 누락 시 사용 시점에 에러를 던진다.

const read = (name: string) => {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
};

export const env = {
  siteUrl: read("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3001",
  sazuApiKey: read("SAZU_API_KEY"),
  anthropicApiKey: read("ANTHROPIC_API_KEY"),
  anthropicModel: read("ANTHROPIC_MODEL"),
  supabaseUrl: read("SUPABASE_URL"),
  supabaseAnonKey: read("SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: read("SUPABASE_SERVICE_ROLE_KEY"),
  portoneStoreId: read("PORTONE_STORE_ID"),
  portoneChannelKey: read("PORTONE_CHANNEL_KEY"),
  portoneApiSecret: read("PORTONE_API_SECRET"),
  portoneWebhookSecret: read("PORTONE_WEBHOOK_SECRET"),
  devSessionSecret: read("DEV_SESSION_SECRET") ?? "sazudaero-local-dev-only",
};

export const isProduction = process.env.NODE_ENV === "production";

/** 랜딩 전용 임시 배포. 백엔드 없이 마케팅 화면만 띄우고, 구매·로그인 경로는 미들웨어가 막는다. */
export const isLandingOnly = process.env.LANDING_ONLY === "1";

const supabaseReady = Boolean(env.supabaseUrl && env.supabaseAnonKey && env.supabaseServiceRoleKey);
const portoneReady = Boolean(
  env.portoneStoreId && env.portoneChannelKey && env.portoneApiSecret && env.portoneWebhookSecret,
);

export type DataMode = "supabase" | "local";
export type PaymentMode = "portone" | "mock";
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
    pick(portoneReady, "portone", "mock", "PortOne", [
      "PORTONE_STORE_ID",
      "PORTONE_CHANNEL_KEY",
      "PORTONE_API_SECRET",
      "PORTONE_WEBHOOK_SECRET",
    ]),
  ai: (): AiMode => pick(Boolean(env.anthropicApiKey), "anthropic", "template", "Anthropic", ["ANTHROPIC_API_KEY"]),
};

/** sazu Free 키는 5개 샘플 프로필만 계산하는 샌드박스로 동작한다 */
export const isSazuSandbox = () => Boolean(env.sazuApiKey?.startsWith("sazu_free_"));
