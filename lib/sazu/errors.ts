import type { SazuIssue } from "./schemas";

// sazu.app 에러 코드 → 사용자 메시지 + 우리 API 가 클라이언트에 돌려줄 HTTP 상태.
// 키 인증·쿼터 문제는 사용자 탓이 아니므로 내부 사정을 노출하지 않고 5xx 로 바꾼다.
// (402 는 우리 서비스에서 "리포트 미구매" 의미로 쓰므로 sazu 의 QUOTA_EXHAUSTED(402)를 그대로 흘리지 않는다.)

const TEMPORARY_FAILURE = "사주 분석 서버와 연결이 원활하지 않아요. 잠시 후 다시 시도해 주세요.";

interface ErrorSpec {
  message: string;
  clientStatus: number;
  retryable: boolean;
}

const ERROR_SPECS: Record<string, ErrorSpec> = {
  VALIDATION_ERROR: {
    message: "입력하신 정보의 형식이 올바르지 않아요. 생년월일시를 다시 확인해 주세요.",
    clientStatus: 400,
    retryable: false,
  },
  INVALID_DATE: {
    message: "존재하지 않는 날짜예요. 생년월일을 다시 확인해 주세요.",
    clientStatus: 400,
    retryable: false,
  },
  LEAP_MONTH_NOT_FOUND: {
    message: "입력하신 해에는 해당 윤달이 없어요. 음력·윤달 여부를 다시 확인해 주세요.",
    clientStatus: 400,
    retryable: false,
  },
  SAMPLE_PROFILE_REQUIRED: {
    message: "현재 체험용 분석 키가 연결되어 있어 샘플 명식만 조회할 수 있어요.",
    clientStatus: 503,
    retryable: false,
  },
  BATCH_TOO_MANY_ITEMS: { message: TEMPORARY_FAILURE, clientStatus: 502, retryable: false },
  MISSING_API_KEY: { message: TEMPORARY_FAILURE, clientStatus: 502, retryable: false },
  INVALID_API_KEY: { message: TEMPORARY_FAILURE, clientStatus: 502, retryable: false },
  KEY_REVOKED: { message: TEMPORARY_FAILURE, clientStatus: 502, retryable: false },
  ORIGIN_NOT_ALLOWED: { message: TEMPORARY_FAILURE, clientStatus: 502, retryable: false },
  TOPIC_PRO_ONLY: { message: TEMPORARY_FAILURE, clientStatus: 502, retryable: false },
  QUOTA_EXHAUSTED: {
    message: "지금은 분석 요청이 몰려 처리가 어려워요. 잠시 후 다시 시도해 주세요.",
    clientStatus: 503,
    retryable: true,
  },
  RATE_LIMITED: {
    message: "요청이 너무 잦아요. 잠시 후 다시 시도해 주세요.",
    clientStatus: 429,
    retryable: true,
  },
  AUTH_UNAVAILABLE: { message: TEMPORARY_FAILURE, clientStatus: 503, retryable: true },
  // 우리 쪽에서 만드는 코드
  NETWORK_ERROR: { message: TEMPORARY_FAILURE, clientStatus: 502, retryable: true },
  TIMEOUT: { message: TEMPORARY_FAILURE, clientStatus: 504, retryable: true },
  INVALID_RESPONSE: { message: TEMPORARY_FAILURE, clientStatus: 502, retryable: true },
};

const UNKNOWN_SPEC: ErrorSpec = { message: TEMPORARY_FAILURE, clientStatus: 502, retryable: true };

const FIELD_LABELS: Record<string, string> = {
  birthYear: "태어난 해",
  birthMonth: "태어난 달",
  birthDay: "태어난 날",
  birthHour: "태어난 시",
  birthMinute: "태어난 분",
  isFemale: "성별",
  isLunar: "양력/음력",
  isLeapMonth: "윤달 여부",
  birthCity: "태어난 지역",
  partners: "상대방 정보",
  label: "상대방 이름",
  date: "기준 날짜",
  year: "기준 연도",
  detail: "상세 수준",
};

/** "partners.0.birthYear" → "상대방 1 · 태어난 해" */
export function fieldLabel(path: string): string {
  const parts = path.split(".");
  const partnerIndex = parts[0] === "partners" && /^\d+$/.test(parts[1] ?? "") ? Number(parts[1]) : null;
  const leaf = parts[parts.length - 1] ?? path;
  const leafLabel = FIELD_LABELS[leaf] ?? leaf;
  return partnerIndex === null ? leafLabel : `상대방 ${partnerIndex + 1} · ${leafLabel}`;
}

export interface SazuFieldError {
  field: string;
  label: string;
  message: string;
}

export class SazuApiError extends Error {
  readonly code: string;
  /** upstream(sazu.app) HTTP 상태. 로컬에서 발생한 에러면 null */
  readonly upstreamStatus: number | null;
  readonly clientStatus: number;
  readonly userMessage: string;
  readonly retryable: boolean;
  readonly fieldErrors: SazuFieldError[];

  constructor(params: {
    code: string;
    upstreamStatus?: number | null;
    upstreamMessage?: string;
    issues?: SazuIssue[];
    cause?: unknown;
  }) {
    const spec = ERROR_SPECS[params.code] ?? UNKNOWN_SPEC;
    super(`[sazu] ${params.code}${params.upstreamMessage ? `: ${params.upstreamMessage}` : ""}`, {
      cause: params.cause,
    });
    this.name = "SazuApiError";
    this.code = params.code;
    this.upstreamStatus = params.upstreamStatus ?? null;
    this.clientStatus = spec.clientStatus;
    this.userMessage = spec.message;
    this.retryable = spec.retryable;
    this.fieldErrors = (params.issues ?? [])
      .filter((issue): issue is SazuIssue & { field: string } => Boolean(issue.field))
      .map((issue) => {
        const label = fieldLabel(issue.field);
        return { field: issue.field, label, message: `${label} 항목을 확인해 주세요.` };
      });
  }

  /** 브라우저로 내려보내도 안전한 형태 */
  toClientJSON() {
    return {
      code: this.clientStatus >= 500 ? "SAZU_UNAVAILABLE" : this.code,
      message: this.userMessage,
      retryable: this.retryable,
      fieldErrors: this.fieldErrors,
    };
  }
}
