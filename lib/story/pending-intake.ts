import type { BirthProfile } from "@/lib/db/types";

export interface PendingIntake {
  subject: BirthProfile;
  partner: BirthProfile | null;
  answers: Record<string, string>;
  notifyPhone?: string;
  offerSlug?: string;
}

interface StoredIntake {
  token: string;
  expiresAt: number;
  intake: PendingIntake;
}

const keyFor = (slug: string) => `sazudaero:pending-intake:${slug}`;
const legacyKeyFor = (slug: string) => `sazudaero:funnel2:${slug}`;
const browserStores = ["localStorage", "sessionStorage"] as const;

function readStoredIntake(storage: Storage, key: string): StoredIntake | null {
  const raw = storage.getItem(key);
  if (!raw) return null;
  const saved = JSON.parse(raw) as StoredIntake;
  if (saved.expiresAt > Date.now()) return saved;
  storage.removeItem(key);
  return null;
}

export function savePendingIntake(slug: string, token: string, intake: PendingIntake) {
  const value = JSON.stringify({ token, intake, expiresAt: Date.now() + 60 * 60 * 1000 } satisfies StoredIntake);
  // 이메일 확인 링크가 같은 브라우저의 새 탭으로 열려도 이어갈 수 있게 한다.
  for (const store of browserStores) {
    try {
      window[store].setItem(keyFor(slug), value);
      return true;
    } catch {
      // 브라우저에서 한 종류의 저장소만 허용할 수 있다.
    }
  }
  return false;
}

export function readPendingIntake(slug: string, token?: string): PendingIntake | null {
  for (const store of browserStores) {
    try {
      const saved = readStoredIntake(window[store], keyFor(slug));
      if (token && saved?.token === token && saved.intake?.subject && saved.intake.answers) return saved.intake;
    } catch {
      // 다른 저장소에 입력이 남아 있을 수 있다.
    }
  }
  if (token) return null;
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(legacyKeyFor(slug)) ?? "null") as PendingIntake | null;
    return saved?.subject && saved.answers ? saved : null;
  } catch {
    return null;
  }
}

export function clearPendingIntake(slug: string, token?: string) {
  for (const store of browserStores) {
    try {
      const storage = window[store];
      const key = keyFor(slug);
      if (token && readStoredIntake(storage, key)?.token === token) storage.removeItem(key);
      if (store === "sessionStorage") storage.removeItem(legacyKeyFor(slug));
    } catch {
      // 저장소 오류로 이미 준비된 풀이가 가려지지 않게 한다.
    }
  }
}
