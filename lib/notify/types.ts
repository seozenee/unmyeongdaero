import type { NotifyKind } from "./templates";

export interface NotifyRequest {
  kind: NotifyKind;
  /** 수신 번호. 하이픈 없이 숫자만 */
  to: string;
  /** #{이름} 같은 치환값 */
  variables: Record<string, string>;
  /** 버튼이 열 주소. 버튼 종류를 키로 둔다 */
  links: Partial<Record<"report" | "pdf", string>>;
}

export interface NotifyResult {
  /** 실제로 보냈는지. 설정이 없으면 false 로 돌아오고 예외는 던지지 않는다 */
  sent: boolean;
  /** 보내지 않았다면 그 이유 */
  reason?: string;
}

export interface NotifySender {
  send(request: NotifyRequest): Promise<NotifyResult>;
}

/** 하이픈·공백·국가번호를 걷어 내고 숫자만 남긴다 */
export function normalizePhone(value: string): string | null {
  const digits = value.replace(/[^0-9]/g, "");
  const local = digits.startsWith("82") ? `0${digits.slice(2)}` : digits;
  // 휴대전화만 받는다 — 알림톡은 휴대전화로만 간다
  return /^01[0-9]{8,9}$/.test(local) ? local : null;
}
