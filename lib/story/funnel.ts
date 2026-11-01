// 구매 전 대화형 입력 흐름(웹툰 인트로 이후). 안내자 대사 → 대화 속 입력 → 웹툰 컷 → 결제 CTA.
// 클라이언트에서 재생되므로 서버 전용 모듈을 import 하지 않는다.
import type { ReportProduct } from "../reports/catalog";
import { josa } from "../text/josa";
import { getGuide } from "./guides";
import { intakeQuestions, type IntakeQuestion } from "./intake";
import type { Camera, FigurePose } from "./webtoon";

export type FunnelStep =
  | { kind: "line"; speaker: "guide" | "narration"; text: string }
  | { kind: "reply"; text: string }
  | { kind: "panel"; camera: Camera; figure: FigurePose; asset: string; sfx?: string; caption?: string }
  | { kind: "birth"; target: "subject" | "partner"; optional: boolean }
  | ({ kind: "context" } & IntakeQuestion)
  | { kind: "detail"; prompt: string; placeholder: string }
  | { kind: "submit"; label: string };

const OPENING_REPLY: Record<string, string> = {
  "reunion-deep": "그 사람이 왜 연락을 멈췄는지 알고 싶어요",
  reunion: "그 사람의 속마음이 궁금해요",
  love: "제게 올 인연이 궁금해요",
  compatibility: "우리 둘 사이가 궁금해요",
  life: "제 인생의 큰 흐름이 궁금해요",
  yearly: "다가올 한 해가 궁금해요",
  money: "돈이 들어오는 길을 알고 싶어요",
  career: "저에게 맞는 일을 알고 싶어요",
  health: "몸의 기운을 살펴보고 싶어요",
  study: "공부가 잘 되는 방법과 시기를 알고 싶어요",
  "child-study": "우리 아이에게 맞는 공부와 진로가 궁금해요",
  "parent-child": "아이와 왜 자꾸 부딪히는지 알고 싶어요",
};

const PARTNER_INTRO: Record<string, string> = {
  reunion: "이제 그 사람의 글자도 필요해요. 아는 만큼만 적어도 괜찮아요. 태어난 시간을 모르면 '모름'으로 두세요.",
  chemistry: "상대분의 생년월일도 알려 주세요. 두 장을 나란히 놓아야 보이는 것들이 있거든요.",
  romance: "마음에 둔 사람이 있다면 알려 주세요. 없다면 건너뛰어도 괜찮아요.",
  child: "이제 아이의 글자도 필요해요. 태어난 시간을 모르면 '모름'으로 두세요.",
};

/** 상품이 따로 묻는 말을 두지 않았을 때 쓰는 한 칸 */
const DEFAULT_ASK = {
  prompt: "지금 가장 궁금한 걸 한 줄만 적어 주세요. 안 적으셔도 풀이는 그대로 나와요.",
  placeholder: "(예) 올해 안에 이직해도 괜찮을지 모르겠어요.",
};

export function buildFunnel(report: ReportProduct): FunnelStep[] {
  const guide = getGuide(report.guide);
  if (guide.id === "gangho") {
    return [
      { kind: "reply", text: "돌려 말하지 말고, 제 사주를 짚어 주세요" },
      { kind: "line", speaker: "guide", text: "난 돌직구 강호야. 말은 짧게 해도, 왜 그렇게 읽는지는 빠뜨리지 않아." },
      { kind: "line", speaker: "guide", text: "먼저 네 원국부터 봐야겠어. 태어난 날과 시각을 알려 줘. 시각을 모르면 모름으로 두면 돼." },
      { kind: "birth", target: "subject", optional: false },
      { kind: "panel", camera: "push", figure: "none", asset: "panel-brush", sfx: "스윽", caption: "강호가 붓끝으로 {name}의 첫 글자를 짚었다." },
      { kind: "line", speaker: "guide", text: "됐어. 네가 준 정보는 확인했어. 이제 어디를 더 짚을지 보자." },
      ...intakeQuestions(report).map(question => ({ kind: "context" as const, ...question })),
      { kind: "detail", prompt: "지금 가장 답답한 걸 적어 봐. 일, 돈, 사람 중 어디서 자꾸 막히는지. 안 적어도 풀이는 그대로 나와.", placeholder: "(예) 일을 자꾸 벌이는데 끝내는 건 없어요. 왜 이러는지 알고 싶어요." },
      { kind: "panel", camera: "wide", figure: "reveal", asset: "panel-unfold", sfx: "촤르륵", caption: "강호가 명식을 끝까지 펼쳐 보였다." },
      { kind: "line", speaker: "guide", text: "먼저 네 성향과 지나온 흐름부터 짚어 볼게. 익숙한 모습이 보이면, 다음에 무엇을 바꿀지도 같이 보자." },
      { kind: "submit", label: "내 사주, 제대로 짚어 보기" },
    ];
  }
  const subjectRole = report.roles?.subject ?? "self";
  const subjectAsk =
    subjectRole === "child"
      ? "정확하게 읽으려면 몇 가지가 필요해요. 먼저 아이의 여덟 글자부터 펼쳐 볼게요. 아이가 태어난 날을 알려 주세요."
      : subjectRole === "parent"
        ? "정확하게 읽으려면 몇 가지가 필요해요. 먼저 부모님, 당신의 여덟 글자부터 펼쳐 볼게요."
        : "정확하게 읽으려면 몇 가지가 필요해요. 먼저 당신의 여덟 글자부터 펼쳐 볼게요.";
  const subjectThanks =
    subjectRole === "child" ? "{name}의 글자가 하나씩 떠오르고 있어요. 기질이 또렷한 아이네요." : "{name}님, 고마워요. 글자가 하나씩 떠오르고 있어요.";

  const steps: FunnelStep[] = [
    { kind: "reply", text: OPENING_REPLY[report.slug] ?? "제 사주가 궁금해요" },
    { kind: "line", speaker: "guide", text: `저는 ${josa(guide.title, "이에요/예요")}. 이야기를 명식으로 읽어 드릴게요.` },
    { kind: "line", speaker: "guide", text: subjectAsk },
    { kind: "birth", target: "subject", optional: false },
    { kind: "panel", camera: "push", figure: "none", asset: "panel-brush", sfx: "스윽", caption: `${josa(guide.name, "이/가")} 붓끝으로 {name}의 첫 글자를 짚었다.` },
    { kind: "line", speaker: "guide", text: subjectThanks },
  ];

  if (report.partner !== "none") {
    const intro = report.roles?.partner === "child" ? PARTNER_INTRO.child : PARTNER_INTRO[report.category];
    steps.push(
      { kind: "line", speaker: "guide", text: intro ?? PARTNER_INTRO.chemistry! },
      { kind: "birth", target: "partner", optional: report.partner === "optional" },
      { kind: "panel", camera: "tilt", figure: "silhouette", asset: "panel-second", sfx: "사락", caption: "두 번째 명식지가 나란히 놓였다." },
    );
  }

  steps.push(...intakeQuestions(report).map(question => ({ kind: "context" as const, ...question })));

  // 상황 선택은 풀이의 생활 예시를 정하고, 자유 질문은 가장 답이 필요한 지점을 정한다.
  // 사용자가 알려 준 정보를 사주에서 알아낸 사실처럼 돌려주지 않는다.
  steps.push({
    kind: "detail",
    prompt: report.detail?.prompt ?? DEFAULT_ASK.prompt,
    placeholder: report.detail?.placeholder ?? DEFAULT_ASK.placeholder,
  });

  steps.push(
    { kind: "panel", camera: "wide", figure: "reveal", asset: "panel-unfold", sfx: "촤르륵", caption: `${josa(guide.name, "이/가")} 명식을 끝까지 펼쳐 보였다.` },
    {
      kind: "line",
      speaker: "guide",
      text:
        report.partner === "none"
          ? "다 모였어요. {name}의 명식과 이야기를 한 장씩 맞춰 보고, 보고서로 정리해 드릴게요."
          : "다 모였어요. 두 사람의 명식과 이야기를 나란히 맞춰 보고, 보고서로 정리해 드릴게요.",
    },
    { kind: "submit", label: "내 풀이 열어 보기" },
  );

  return steps;
}
