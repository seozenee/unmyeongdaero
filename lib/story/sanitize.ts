// 보고서 문장 정제. 규칙 기반 생성기와 AI 생성 결과가 같은 규칙을 쓴다.
// sazu 원본에는 내부 점수와 겁주는 전통 표현이 섞여 있는데, 둘 다 고객이 읽을 문장에는 나가면 안 된다.
// 프롬프트로도 금지하지만 모델이 흘릴 수 있으므로 코드로 한 번 더 막는다.

const SOFTEN: Array<[RegExp, string]> = [
  [/\[인접\]\s*/g, ""],
  [/\s*\(\d+점\)/g, ""],
  [/\s*\d+점/g, ""],
  [/형사사건/g, "시비"],
  [/수술/g, "몸의 무리"],
  [/사고 주의/g, "안전 유의"],
  [/재앙/g, "변수"],
  [/배은망덕/g, "서운함이 쌓이기 쉬움"],
  [/관재구설/g, "말과 서류의 구설"],
  [/형벌/g, "긴장"],
  [/지속적 고통/g, "오래 가는 부담"],
  [/굶어 죽을 일은 없음/g, "먹고사는 기반이 단단함"],
];

/** 한 문장(또는 짧은 텍스트)에서 점수·위협 표현을 걷어낸다 */
export function soften(text: string) {
  return SOFTEN.reduce((current, [pattern, replacement]) => current.replace(pattern, replacement), text)
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * 객체·배열 안의 모든 문자열에 soften 을 적용한다.
 * AI 가 만든 보고서 JSON 전체를 통과시키는 용도.
 */
export function softenDeep<T>(value: T): T {
  if (typeof value === "string") return soften(value) as T;
  if (Array.isArray(value)) return value.map((item) => softenDeep(item)) as T;
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) result[key] = softenDeep(item);
    return result as T;
  }
  return value;
}
