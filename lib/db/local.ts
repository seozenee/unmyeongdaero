import "server-only";

// 개발 대체 저장소: .data/local-db.json 한 파일에 전부 저장한다. 프로덕션에서는 선택되지 않는다(lib/env.ts).
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ConsultMessage, ConsultSession, Payment, Purchase, Reading, Repository } from "./types";

interface LocalData {
  readings: Reading[];
  payments: Payment[];
  purchases: Purchase[];
  consultSessions: ConsultSession[];
  consultMessages: ConsultMessage[];
}

const DATA_FILE = path.join(process.cwd(), ".data", "local-db.json");

const emptyData = (): LocalData => ({
  readings: [],
  payments: [],
  purchases: [],
  consultSessions: [],
  consultMessages: [],
});

// Next dev 는 라우트별로 모듈 인스턴스가 나뉠 수 있어 직렬화 큐를 globalThis 에 둔다.
const globalQueue = globalThis as typeof globalThis & { __sazudaeroLocalDbQueue?: Promise<unknown> };

async function load(): Promise<LocalData> {
  try {
    return { ...emptyData(), ...JSON.parse(await readFile(DATA_FILE, "utf8")) };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return emptyData();
    throw error;
  }
}

async function save(data: LocalData) {
  await mkdir(path.dirname(DATA_FILE), { recursive: true });
  const tmp = `${DATA_FILE}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2));
  await rename(tmp, DATA_FILE);
}

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = (globalQueue.__sazudaeroLocalDbQueue ?? Promise.resolve()).then(task);
  globalQueue.__sazudaeroLocalDbQueue = run.catch(() => undefined);
  return run;
}

const read = <T>(fn: (data: LocalData) => T): Promise<T> => enqueue(async () => structuredClone(fn(await load())));

const write = <T>(fn: (data: LocalData) => T): Promise<T> =>
  enqueue(async () => {
    const data = await load();
    const result = fn(data);
    await save(data);
    return structuredClone(result);
  });

const now = () => new Date().toISOString();

function findOrThrow<T>(items: T[], predicate: (item: T) => boolean, label: string): T {
  const item = items.find(predicate);
  if (!item) throw new Error(`[local-db] ${label} 를 찾을 수 없습니다.`);
  return item;
}

export function createLocalRepository(): Repository {
  return {
    createReading: (input) =>
      write((data) => {
        const timestamp = now();
        const reading: Reading = {
          id: randomUUID(),
          ...input,
          status: "draft",
          sazu: null,
          script: null,
          error: null,
          createdAt: timestamp,
          updatedAt: timestamp,
          generatedAt: null,
        };
        data.readings.push(reading);
        return reading;
      }),

    getReading: (id) => read((data) => data.readings.find((reading) => reading.id === id) ?? null),

    updateReading: (id, patch) =>
      write((data) => {
        const reading = findOrThrow(data.readings, (item) => item.id === id, "reading");
        Object.assign(reading, patch, { updatedAt: now() });
      }),

    transitionReading: (id, from, to) =>
      write((data) => {
        const reading = data.readings.find((item) => item.id === id);
        if (!reading || !from.includes(reading.status)) return false;
        reading.status = to;
        reading.updatedAt = now();
        return true;
      }),

    createPayment: (input) =>
      write((data) => {
        const payment: Payment = {
          id: randomUUID(),
          ...input,
          pgTransactionId: null,
          status: "pending",
          failureReason: null,
          paidAt: null,
          createdAt: now(),
        };
        data.payments.push(payment);
        return payment;
      }),

    getPayment: (paymentId) => read((data) => data.payments.find((payment) => payment.paymentId === paymentId) ?? null),

    updatePayment: (paymentId, patch) =>
      write((data) => {
        Object.assign(findOrThrow(data.payments, (item) => item.paymentId === paymentId, "payment"), patch);
      }),

    getPurchase: (userId, reportSlug) =>
      read(
        (data) =>
          data.purchases.find((purchase) => purchase.userId === userId && purchase.reportSlug === reportSlug) ?? null,
      ),

    listPurchases: (userId) =>
      read((data) =>
        data.purchases
          .filter((purchase) => purchase.userId === userId)
          .sort((a, b) => b.purchasedAt.localeCompare(a.purchasedAt)),
      ),

    createPurchase: (input) =>
      write((data) => {
        const existing = data.purchases.find(
          (purchase) => purchase.userId === input.userId && purchase.reportSlug === input.reportSlug,
        );
        if (existing) return existing;
        const purchase: Purchase = { id: randomUUID(), ...input, purchasedAt: now() };
        data.purchases.push(purchase);
        return purchase;
      }),

    createConsultSession: (input) =>
      write((data) => {
        const existing = data.consultSessions.find((session) => session.paymentRowId === input.paymentRowId);
        if (existing) return existing;
        const session: ConsultSession = {
          id: randomUUID(),
          ...input,
          sazu: null,
          turnsUsed: 0,
          createdAt: now(),
          lastMessageAt: null,
        };
        data.consultSessions.push(session);
        return session;
      }),

    getConsultSession: (id) => read((data) => data.consultSessions.find((session) => session.id === id) ?? null),

    getConsultSessionByPayment: (paymentRowId) =>
      read((data) => data.consultSessions.find((session) => session.paymentRowId === paymentRowId) ?? null),

    listConsultSessions: (userId) =>
      read((data) =>
        data.consultSessions
          .filter((session) => session.userId === userId)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      ),

    updateConsultSessionSazu: (id, sazu) =>
      write((data) => {
        findOrThrow(data.consultSessions, (item) => item.id === id, "consult session").sazu = sazu;
      }),

    consumeConsultTurn: (sessionId, userId) =>
      write((data) => {
        const session = data.consultSessions.find((item) => item.id === sessionId && item.userId === userId);
        if (!session || session.turnsUsed >= session.turnLimit) return null;
        session.turnsUsed += 1;
        session.lastMessageAt = now();
        return session.turnLimit - session.turnsUsed;
      }),

    refundConsultTurn: (sessionId, userId) =>
      write((data) => {
        const session = data.consultSessions.find((item) => item.id === sessionId && item.userId === userId);
        if (session) session.turnsUsed = Math.max(session.turnsUsed - 1, 0);
      }),

    addConsultMessage: (input) =>
      write((data) => {
        const message: ConsultMessage = { id: randomUUID(), ...input, createdAt: now() };
        data.consultMessages.push(message);
        return message;
      }),

    listConsultMessages: (sessionId) =>
      read((data) =>
        data.consultMessages
          .filter((message) => message.sessionId === sessionId)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      ),
  };
}
