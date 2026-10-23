// 알림톡이 실제 발송으로 돌 준비가 됐는지 본다.
//
//   pnpm notify:status
//
// 키가 하나라도 비면 발송기는 모의 발송(로그)으로 돈다. 그게 조용히 일어나므로,
// "왜 카톡이 안 오지" 를 찾기 전에 여기서 먼저 확인할 수 있게 둔다.
import { SolapiMessageService } from "solapi";

const NEEDED: Array<[string, string]> = [
  ["SOLAPI_API_KEY", "솔라피 API 키"],
  ["SOLAPI_API_SECRET", "솔라피 시크릿"],
  ["SOLAPI_SENDER", "등록한 발신번호 (하이픈 없이)"],
  ["KAKAO_PF_ID", "연동한 카카오 채널의 pfId"],
  ["KAKAO_TEMPLATE_STARTED", "템플릿① 운명대로_풀이시작 ID"],
  ["KAKAO_TEMPLATE_READY", "템플릿② 운명대로_풀이완성 ID"],
];

const missing: string[] = [];
for (const [key, label] of NEEDED) {
  const ok = Boolean(process.env[key]?.trim());
  console.log(`${ok ? "O" : "X"}  ${key.padEnd(24)} ${label}`);
  if (!ok) missing.push(key);
}

console.log(
  missing.length === 0
    ? "\n→ 실제 발송으로 돕니다"
    : `\n→ ${missing.length}개가 비어 모의 발송(로그)으로 돕니다: ${missing.join(", ")}`,
);

// 키가 있으면 실제로 인증되는지도 본다. 잔액 조회는 읽기만 하므로 아무것도 보내지 않는다.
const { SOLAPI_API_KEY, SOLAPI_API_SECRET } = process.env;
if (SOLAPI_API_KEY && SOLAPI_API_SECRET) {
  try {
    const balance = await new SolapiMessageService(SOLAPI_API_KEY, SOLAPI_API_SECRET).getBalance();
    console.log(`\n솔라피 인증 성공 · 포인트 ${balance.point ?? 0} · 캐시 ${balance.balance ?? 0}`);
  } catch (error) {
    console.error(`\n솔라피 인증 실패: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
