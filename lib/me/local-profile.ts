import type { BirthProfile } from "@/lib/db/types";

/**
 * 이 브라우저가 기억하는 "나".
 *
 * 처음 온 사람에게 보여 줄 수 있는 것은 상품 목록뿐이다. 그런데 생년월일을 한 번이라도
 * 적은 사람에게는 그 사람의 여덟 글자를 바로 펼쳐 보여 줄 수 있다 — 우리가 직접 계산하기
 * 때문이다. 목록을 보는 사람과 자기 원국을 보는 사람은 같은 화면을 봐도 다른 것을 본다.
 *
 * 로그인 전에도 쓰려고 브라우저에 둔다. 서버로는 가지 않고, 이 브라우저에만 남는다.
 * 그래서 비밀번호 같은 것은 절대 여기 두지 않는다 — 생년월일과 이름까지다.
 *
 * 시크릿 창이나 저장을 막아 둔 브라우저에서는 읽기도 쓰기도 그대로 실패한다. 실패해도
 * 아무 일도 일어나지 않아야 한다. 개인화는 있으면 좋은 것이지, 없으면 화면이 깨지는
 * 것이어서는 안 된다.
 */

const KEY = "sazudaero:me";

export function readLocalProfile(): BirthProfile | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BirthProfile>;
    // 저장해 둔 모양이 바뀌었을 수 있다. 최소한 이것들이 있어야 명식을 세운다
    if (!parsed.name || !parsed.birthYear || !parsed.birthMonth || !parsed.birthDay) return null;
    return parsed as BirthProfile;
  } catch {
    return null;
  }
}

export function writeLocalProfile(profile: BirthProfile): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(profile));
  } catch {
    // 저장이 막혀 있으면 개인화만 없다. 그게 전부다
  }
}

export function forgetLocalProfile(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // 지우지 못해도 할 수 있는 일이 없다
  }
}
