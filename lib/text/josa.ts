// 한국어 조사 자동 선택. 마지막 글자에 받침이 있으면 앞의 형태를, 없으면 뒤의 형태를 쓴다.

function finalConsonant(word: string) {
  const last = word.trim().at(-1);
  if (!last) return 0;
  const code = last.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return 0;
  return (code - 0xac00) % 28;
}

export const hasBatchim = (word: string) => finalConsonant(word) !== 0;
/** ㄹ 받침 — '으로'가 아니라 '로'를 쓰는 유일한 받침이다 */
const RIEUL = 8;

type JosaPair = "이/가" | "은/는" | "을/를" | "과/와" | "이에요/예요" | "아/야" | "으로/로" | "이라/라";

export function josa(word: string, pair: JosaPair) {
  const [withBatchim, withoutBatchim] = pair.split("/") as [string, string];
  const final = finalConsonant(word);
  if (pair === "으로/로") return `${word}${final === 0 || final === RIEUL ? withoutBatchim : withBatchim}`;
  return `${word}${hasBatchim(word) ? withBatchim : withoutBatchim}`;
}
