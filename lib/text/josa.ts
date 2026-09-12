// 한국어 조사 자동 선택. 마지막 글자에 받침이 있으면 앞의 형태를, 없으면 뒤의 형태를 쓴다.

function hasBatchim(word: string) {
  const last = word.trim().at(-1);
  if (!last) return false;
  const code = last.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

type JosaPair = "이/가" | "은/는" | "을/를" | "과/와" | "이에요/예요" | "아/야";

export function josa(word: string, pair: JosaPair) {
  const [withBatchim, withoutBatchim] = pair.split("/") as [string, string];
  return `${word}${hasBatchim(word) ? withBatchim : withoutBatchim}`;
}
