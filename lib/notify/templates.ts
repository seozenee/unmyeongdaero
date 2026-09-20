// 알림톡 템플릿.
//
// 알림톡은 카카오에 미리 등록해 심사받은 템플릿으로만 보낼 수 있다. 보내는 쪽에서는
// 템플릿 ID 와 치환값(#{...})만 넘기고, 실제 문구는 카카오가 가지고 있다.
//
// 그래서 이 파일의 body 는 "보낼 때 쓰는 문자열"이 아니라 "심사에 제출한 원문"이다.
// 심사에 낸 문구와 여기가 어긋나면 어긋난 줄 모르고 지나가므로, 제출본을 코드에 함께 둔다.
// 등록 절차는 docs/알림톡.md 에 있다.
//
// 두 템플릿 모두 정보성 메시지다. 구매한 사람에게 그 구매 건의 처리 상태를 알리는 것이라
// 광고성 수신동의 없이 보낼 수 있다. 광고 문구(할인, 추천, 이벤트)를 넣는 순간
// 광고성이 되어 별도 동의와 (광고) 표기가 필요해지므로 넣지 않는다.

export type NotifyKind = "reading-started" | "reading-ready";

export interface NotifyTemplate {
  kind: NotifyKind;
  /** 카카오에 등록한 템플릿 이름 — 심사 신청서에 적는 값 */
  name: string;
  /** 심사에 제출한 원문. 치환 자리는 #{...} 로 적는다 */
  body: string;
  /** 이 템플릿이 요구하는 치환 변수 */
  variables: readonly string[];
  /** 버튼 — 링크는 발송할 때 채운다 */
  buttons: ReadonlyArray<{ name: string; kind: "report" | "pdf" }>;
  /** 알림톡이 막혔을 때 문자로 대신 보낼 본문을 만든다 */
  fallback: (values: Record<string, string>, links: Record<string, string>) => string;
}

const render = (body: string, values: Record<string, string>) =>
  body.replace(/#\{([^}]+)\}/g, (_match, name: string) => values[`#{${name}}`] ?? `#{${name}}`);

export const TEMPLATES: Record<NotifyKind, NotifyTemplate> = {
  "reading-started": {
    kind: "reading-started",
    name: "운명대로_풀이시작",
    body: `[운명대로] 풀이를 시작했어요

#{이름}님의 「#{상품}」 풀이를 쓰기 시작했습니다.
완성되면 다시 알려드릴게요.

주문번호: #{주문번호}`,
    variables: ["#{이름}", "#{상품}", "#{주문번호}"],
    buttons: [{ name: "진행 상황 보기", kind: "report" }],
    fallback: (values, links) =>
      `[운명대로] ${values["#{이름}"]}님의 「${values["#{상품}"]}」 풀이를 쓰기 시작했습니다. 완성되면 다시 알려드릴게요. ${links.report ?? ""}`.trim(),
  },

  "reading-ready": {
    kind: "reading-ready",
    name: "운명대로_풀이완성",
    body: `[운명대로] 풀이가 완성됐어요

#{이름}님의 「#{상품}」 풀이가 준비됐습니다.
아래 버튼으로 전문을 읽거나 PDF로 받아 보실 수 있어요.

발행일: #{발행일}
주문번호: #{주문번호}

보관함에서 언제든 다시 보실 수 있습니다.`,
    variables: ["#{이름}", "#{상품}", "#{발행일}", "#{주문번호}"],
    buttons: [
      { name: "보고서 열기", kind: "report" },
      { name: "PDF 받기", kind: "pdf" },
    ],
    fallback: (values, links) =>
      `[운명대로] ${values["#{이름}"]}님의 「${values["#{상품}"]}」 풀이가 완성됐습니다. ${links.report ?? ""}`.trim(),
  },
};

/** 심사에 제출한 원문에 값을 끼워 실제로 보낼 문구를 만든다 — 미리보기·모의 발송에 쓴다 */
export function renderTemplate(kind: NotifyKind, values: Record<string, string>) {
  return render(TEMPLATES[kind].body, values);
}

/** 템플릿이 요구하는 변수가 모두 채워졌는지 */
export function missingVariables(kind: NotifyKind, values: Record<string, string>) {
  return TEMPLATES[kind].variables.filter((name) => !values[name]);
}
