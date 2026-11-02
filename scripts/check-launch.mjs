/** 키 값을 출력하거나 외부 요청을 보내지 않는 출시 설정 검사. */
const issues = [];
const required = ["NEXT_PUBLIC_SITE_URL", "SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "NEXT_PUBLIC_TOSS_CLIENT_KEY", "TOSS_SECRET_KEY"];
for (const name of required) if (!process.env[name]?.trim()) issues.push(`${name}: 설정 필요`);
for (const name of ["FREE_ACCESS", "LANDING_ONLY"]) if (process.env[name] === "1") issues.push(`${name}: 정식 판매 전 해제 필요`);
const provider = process.env.AI_PROVIDER;
const providers = { openai: "OPENAI_API_KEY", anthropic: "ANTHROPIC_API_KEY", gemini: "GEMINI_API_KEY" };
if (provider && !(provider in providers)) issues.push("AI_PROVIDER: 지원하는 공급자로 설정 필요");
else if (provider ? !process.env[providers[provider]] : !Object.values(providers).some(key => process.env[key])) issues.push("풀이 생성: 선택한 AI 공급자 키 설정 필요");
for (const name of ["NEXT_PUBLIC_TOSS_CLIENT_KEY", "TOSS_SECRET_KEY"]) {
  const value = process.env[name];
  if (value && !value.startsWith("live_")) issues.push(`${name}: 실결제 키 확인 필요`);
}
try {
  const url = new URL(process.env.NEXT_PUBLIC_SITE_URL);
  if (url.protocol !== "https:" || /^(localhost|127\.|0\.|\[::1\])/.test(url.hostname)) issues.push("서비스 주소: 공개 HTTPS 도메인 필요");
} catch { issues.push("서비스 주소: 올바른 HTTPS URL 필요"); }
console.log("출시 설정 검사 (키 값 비공개 · 외부 요청 없음)");
if (issues.length) { for (const issue of issues) console.log(`미완료 · ${issue}`); process.exitCode = 1; }
else console.log("필수 설정 통과. 실결제·취소·로그인·알림 전달의 실제 동작은 별도 확인해야 합니다.");
