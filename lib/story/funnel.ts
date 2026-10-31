// 구매 전 대화형 입력 흐름(웹툰 인트로 이후). 안내자 대사 → 대화 속 입력 → 웹툰 컷 → 결제 CTA.
// 클라이언트에서 재생되므로 서버 전용 모듈을 import 하지 않는다.
import type { ReportProduct } from "../reports/catalog";
import { josa } from "../text/josa";
import { getGuide } from "./guides";
import type { Camera, FigurePose } from "./webtoon";

export type FunnelStep =
  | { kind: "line"; speaker: "guide" | "narration"; text: string }
  | { kind: "reply"; text: string }
  | { kind: "panel"; camera: Camera; figure: FigurePose; asset: string; sfx?: string; caption?: string }
  | { kind: "birth"; target: "subject" | "partner"; optional: boolean }
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

  // 고르는 질문을 없앴다.
  //
  // "지금 인생의 어느 지점인가요 → 막 시작하는 중 / 버티는 중 / 전환을 고민 중" 같은
  // 보기를 받아 왔다. 그런데 보기에서 고른 말은 그 사람의 말이 아니다. 네 개 중 가장 덜
  // 틀린 것을 고를 뿐이고, 그렇게 받은 말이 풀이에 그대로 돌아가면 "버티는 중이라고
  // 하셨는데 사주와 딱 맞아요" 같은 문장이 된다. 자기가 방금 고른 말을 돌려받는 것이라
  // 맞혔다는 느낌이 들지 않는다.
  //
  // 묻는 것은 하나로 줄인다 — 무엇이 궁금한가. 적어도 되고 안 적어도 된다. 풀이는
  // 여덟 글자로 쓰고, 적어 준 말은 어디를 더 짚을지 정하는 데만 쓴다.
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
