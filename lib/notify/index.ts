import "server-only";

import { isProduction } from "@/lib/env";
import { createSolapiSender } from "./solapi";
import { renderTemplate, missingVariables } from "./templates";
import type { NotifyRequest, NotifyResult, NotifySender } from "./types";

export type { NotifyRequest, NotifyResult, NotifySender } from "./types";
export { normalizePhone } from "./types";
export { TEMPLATES, renderTemplate, type NotifyKind } from "./templates";

/**
 * 설정이 없을 때의 발송기 — 보낼 문구를 로그에 찍고 끝낸다.
 *
 * 알림톡은 발신프로필 등록과 템플릿 심사가 끝나야 쓸 수 있다. 그때까지, 그리고
 * 로컬 개발에서는 이 발송기가 대신한다. 예외를 던지지 않는 것이 중요하다 —
 * 알림은 곁가지인데 이것 때문에 결제나 풀이 생성이 실패하면 안 된다.
 */
class LoggingSender implements NotifySender {
  async send(request: NotifyRequest): Promise<NotifyResult> {
    console.info(
      `[notify] (모의) ${request.kind} → ${request.to}\n${renderTemplate(request.kind, request.variables)}\n버튼: ${JSON.stringify(request.links)}`,
    );
    return { sent: false, reason: "알림톡 설정 없음 — 로그로 대신함" };
  }
}

let cached: NotifySender | null = null;

export function getNotifySender(): NotifySender {
  if (!cached) cached = createSolapiSender() ?? new LoggingSender();
  return cached;
}

/**
 * 알림 한 건을 보낸다.
 *
 * 실패해도 던지지 않는다. 부르는 쪽(결제 완료, 풀이 생성)은 알림이 안 갔다고
 * 되돌릴 수 없는 일들이라, 여기서 던지면 더 큰 것을 망가뜨린다.
 */
export async function notify(request: NotifyRequest): Promise<NotifyResult> {
  const missing = missingVariables(request.kind, request.variables);
  if (missing.length > 0) {
    console.error(`[notify] ${request.kind} 치환값이 비었습니다: ${missing.join(", ")}`);
    return { sent: false, reason: "치환값 누락" };
  }

  try {
    return await getNotifySender().send(request);
  } catch (error) {
    // 프로덕션에서는 알림이 안 간 것 자체가 신호이므로 남겨 둔다
    console.error(`[notify] ${request.kind} 발송 실패 (${isProduction ? "운영" : "개발"})`, error);
    return { sent: false, reason: error instanceof Error ? error.message : "알 수 없는 오류" };
  }
}
