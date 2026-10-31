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

/**
 * 손님에게 나가서는 안 되는 사주 용어.
 *
 * 읽는 사람은 명리를 모르고 배울 생각도 없다. "토가 많아 심신이 무겁고 재성이 약해"는
 * 한 글자도 가 닿지 않는다. 프롬프트에서 금지했지만 모델이 흘릴 수 있어 여기서 본다.
 *
 * 고쳐 쓰지는 않는다 — "대운"을 기계로 바꾸면 문장이 망가진다. 대신 어떤 말이 샜는지
 * 로그에 남겨, 프롬프트를 고칠 수 있게 한다.
 */
const JARGON = [
  "비견", "겁재", "식신", "상관", "편재", "정재", "편관", "정관", "편인", "정인",
  "신강", "신약", "용신", "기신", "희신", "격국", "대운", "세운", "월운", "일간",
  "천간", "십성", "오행", "일지", "월지", "시지", "연지", "일주", "월주",
  "삼합", "육합", "천을귀인", "도화살", "역마살", "백호살", "공망", "진태양시",
  "명식", "사주팔자",
];

// 일부러 뺀 말이 둘 있다.
//  · "지지" — 받침 없는 보통 말("지지하다")과 글자가 같아 애먼 문장을 잡는다.
//  · "귀인" — "이때 귀인을 만나요"는 사주를 몰라도 그대로 읽힌다. 오히려 듣고 싶은 말이다.

/** 손님 글에 샌 용어를 모아 돌려준다 (없으면 빈 배열) */
export function findJargon(text: string): string[] {
  const hanja = /[\u4e00-\u9fff]/.test(text) ? ["한자"] : [];
  return [...JARGON.filter((word) => text.includes(word)), ...hanja];
}

/**
 * 시기 칸에 붙는 간지 꼬리를 뗀다.
 *
 * "36~45세 · 경신 대운", "2027 정미 세운" 처럼 우리끼리 쓰는 이름이 뒤에 붙어 나온다.
 * 모양이 늘 같아서 이것만은 기계로 떼도 문장이 망가지지 않는다. 손님에게 필요한 것은
 * 달력에서 찾을 수 있는 앞쪽뿐이다.
 */
function stripGanziTail(text: string) {
  return text
    .replace(/\s*·\s*[가-힣]{2}\s*(대운|세운|월운|일운)/g, "")
    .replace(/\s*[가-힣]{2}\s*(대운|세운|월운|일운)\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** 한 문장(또는 짧은 텍스트)에서 점수·위협 표현을 걷어낸다 */
export function soften(text: string) {
  const softened = SOFTEN.reduce((current, [pattern, replacement]) => current.replace(pattern, replacement), text);
  return stripGanziTail(softened).replace(/\s{2,}/g, " ").trim();
}

/**
 * 객체·배열 안의 모든 문자열에 soften 을 적용한다.
 * AI 가 만든 보고서 JSON 전체를 통과시키는 용도.
 */
export function softenDeep<T>(value: T): T {
  if (typeof value === "string") return soften(value) as T;
  // 아래 재귀가 끝나면 한 번에 살펴본다(문자열마다 로그를 찍으면 시끄럽다)
  if (Array.isArray(value)) return value.map((item) => softenDeep(item)) as T;
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) result[key] = softenDeep(item);
    return result as T;
  }
  return value;
}

/**
 * 보고서 한 벌을 손님에게 내보내기 전에 살핀다.
 *
 * 막지는 않는다 — 용어가 하나 섞였다고 돈 낸 사람에게 아무것도 주지 않는 쪽이 더 나쁘다.
 * 대신 무엇이 샜는지 남긴다. 고쳐야 할 것은 프롬프트고, 고치려면 샜다는 걸 알아야 한다.
 */
export function auditReport(value: unknown, label: string): string[] {
  const leaked = Array.from(new Set(findJargon(JSON.stringify(value))));
  if (leaked.length > 0) console.warn(`[풀이] 손님 글에 용어가 샜습니다 (${label}): ${leaked.join(", ")}`);
  return leaked;
}
