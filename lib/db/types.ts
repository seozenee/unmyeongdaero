// 저장소 도메인 타입과 인터페이스. 구현은 Supabase(실서비스) / 로컬 JSON 파일(개발 대체) 두 가지.
import type { SazuTopic } from "../sazu/schemas";
import type { StoryReport } from "../story/report";

export interface BirthProfile {
  name: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  /** 모르면 null */
  birthHour: number | null;
  birthMinute?: number;
  isFemale: boolean;
  isLunar: boolean;
  isLeapMonth?: boolean;
  birthCity: string;
}

export interface StoredSazuTopic {
  modules: Record<string, unknown>;
  guide: { purpose: string; howToUse: string[] };
  glossary: Record<string, string>;
  reference?: Record<string, unknown>;
  partners?: unknown[];
  /** sazu Free 샌드박스의 고정 샘플 응답이면 true */
  sample: boolean;
}

export type StoredSazu = Partial<Record<SazuTopic, StoredSazuTopic>>;

export type ReadingStatus = "draft" | "generating" | "ready" | "failed";

export interface Reading {
  id: string;
  userId: string;
  reportSlug: string;
  subject: BirthProfile;
  partner: BirthProfile | null;
  answers: Record<string, string>;
  status: ReadingStatus;
  sazu: StoredSazu | null;
  /** 생성된 브리핑 + 보고서 */
  script: StoryReport | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  generatedAt: string | null;
}

export type PaymentProvider = "portone" | "mock";
export type PaymentStatus = "pending" | "paid" | "failed" | "cancelled";

export interface Payment {
  /** 행 id (uuid) */
  id: string;
  /** PortOne 에 넘긴 결제 ID */
  paymentId: string;
  provider: PaymentProvider;
  pgTransactionId: string | null;
  userId: string;
  reportSlug: string;
  readingId: string | null;
  amount: number;
  status: PaymentStatus;
  failureReason: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface Purchase {
  id: string;
  userId: string;
  reportSlug: string;
  paymentRowId: string;
  readingId: string | null;
  purchasedAt: string;
}

export interface ConsultSession {
  id: string;
  userId: string;
  paymentRowId: string;
  subject: BirthProfile;
  sazu: StoredSazu | null;
  turnLimit: number;
  turnsUsed: number;
  createdAt: string;
  lastMessageAt: string | null;
}

export interface ConsultMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface Repository {
  createReading(input: {
    userId: string;
    reportSlug: string;
    subject: BirthProfile;
    partner: BirthProfile | null;
    answers: Record<string, string>;
  }): Promise<Reading>;
  getReading(id: string): Promise<Reading | null>;
  updateReading(
    id: string,
    patch: Partial<Pick<Reading, "status" | "sazu" | "script" | "error" | "generatedAt">>,
  ): Promise<void>;
  /** 현재 상태가 from 중 하나일 때만 to 로 바꾼다(중복 생성 방지). 바꿨으면 true */
  transitionReading(id: string, from: ReadingStatus[], to: ReadingStatus): Promise<boolean>;

  createPayment(input: {
    paymentId: string;
    provider: PaymentProvider;
    userId: string;
    reportSlug: string;
    readingId: string | null;
    amount: number;
  }): Promise<Payment>;
  getPayment(paymentId: string): Promise<Payment | null>;
  updatePayment(
    paymentId: string,
    patch: Partial<Pick<Payment, "status" | "pgTransactionId" | "failureReason" | "paidAt">>,
  ): Promise<void>;

  getPurchase(userId: string, reportSlug: string): Promise<Purchase | null>;
  listPurchases(userId: string): Promise<Purchase[]>;
  /** (userId, reportSlug) 는 유일. 이미 있으면 기존 행을 돌려준다 */
  createPurchase(input: {
    userId: string;
    reportSlug: string;
    paymentRowId: string;
    readingId: string | null;
  }): Promise<Purchase>;

  createConsultSession(input: {
    userId: string;
    paymentRowId: string;
    subject: BirthProfile;
    turnLimit: number;
  }): Promise<ConsultSession>;
  getConsultSession(id: string): Promise<ConsultSession | null>;
  getConsultSessionByPayment(paymentRowId: string): Promise<ConsultSession | null>;
  listConsultSessions(userId: string): Promise<ConsultSession[]>;
  updateConsultSessionSazu(id: string, sazu: StoredSazu): Promise<void>;
  /** 남은 턴이 있으면 1 차감하고 남은 턴 수를, 없으면 null */
  consumeConsultTurn(sessionId: string, userId: string): Promise<number | null>;
  refundConsultTurn(sessionId: string, userId: string): Promise<void>;
  addConsultMessage(input: { sessionId: string; role: "user" | "assistant"; content: string }): Promise<ConsultMessage>;
  listConsultMessages(sessionId: string): Promise<ConsultMessage[]>;
}

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
