// 구매 전 웹툰 인트로 컷 구성. 한 컷 = 한 화면이고, 넘기는 버튼 문구는 "다음"이 아니라 상황 속 행동으로 쓴다.
import type { ReportProduct } from "../reports/catalog";
import type { GuideId } from "./guides";

/** 장면의 장소. 배경 아트가 어디를 비추는지 정한다. */
export type Place = "far" | "path" | "gate" | "house" | "room";
export type Camera = "wide" | "push" | "close" | "tilt";
export type FigurePose = "none" | "silhouette" | "reveal" | "close";

export interface WebtoonShot {
  id: string;
  /** lib/story/webtoon-assets 의 컷 키 (생성 에셋이 있으면 코드 장면 대신 사용) */
  assetKey: string;
  place: Place;
  camera: Camera;
  figure: FigurePose;
  /** 화면 아래쪽에 겹쳐 나오는 대사·내레이션 줄 */
  lines: string[];
  /** 안내자 말풍선 */
  balloon?: string;
  sfx?: string;
  /** 다음 컷으로 넘어가는 버튼 문구 */
  action: string;
}

const QUESTIONS: Record<string, string> = {
  "reunion-deep": "그 사람이 왜 연락을 멈췄는지… 알고 싶어서 왔군요.",
  reunion: "아직 그 사람 마음이 궁금한 거죠?",
  love: "곧 만나게 될 인연이 궁금해서 왔나요?",
  compatibility: "두 사람 사이에 무엇이 걸려 있는지 보러 왔군요.",
  life: "당신이라는 그릇의 모양을 보러 왔군요.",
  yearly: "다가올 한 해의 결이 궁금한가 봐요.",
  money: "돈이 들어오는 길목을 찾고 있군요.",
  career: "당신에게 맞는 일을 찾고 있군요.",
  health: "몸의 기운이 어디로 기울었는지 살피러 왔군요.",
  study: "공부가 좀처럼 붙지 않아 답답했죠?",
  "child-study": "아이가 어떤 길에서 빛날지 궁금해서 왔군요.",
  "parent-child": "아이와 자꾸 엇갈려서 마음이 무거웠죠?",
};

const SCRIPTS: Record<GuideId, Omit<WebtoonShot, "id" | "assetKey">[]> = {
  seoha: [
    {
      place: "far",
      camera: "wide",
      figure: "none",
      lines: ["깊은 밤, 마음의 행방을 읽어 주는 이가 산다고 했다."],
      action: "달빛이 닿는 곳… 여기다.",
    },
    {
      place: "path",
      camera: "push",
      figure: "none",
      lines: ["골목 끝, 등불 하나만 켜져 있다.", "“…여기가 맞나?”"],
      action: "문 앞까지 걸어간다",
    },
    {
      place: "gate",
      camera: "push",
      figure: "none",
      sfx: "똑, 똑",
      lines: ["“…아무도 없나?”", "“어? 문이 열려 있는데…?”"],
      action: "손을 뻗어 문을 민다",
    },
    {
      place: "house",
      camera: "tilt",
      figure: "silhouette",
      lines: ["마당 안쪽, 누군가 등을 돌리고 서 있었다.", "“저, 혹시…”"],
      action: "조심스럽게 말을 건다",
    },
    {
      place: "room",
      camera: "wide",
      figure: "reveal",
      sfx: "스르륵",
      balloon: "왔어요? …기다린 건 아니고.",
      lines: ["“이 사람이…”", "“달그림자 서하?”"],
      action: "마주 앉는다",
    },
  ],
  yunseul: [
    {
      place: "far",
      camera: "wide",
      figure: "none",
      lines: ["붉은 인주 향이 번지는 골목이 있다고 했다."],
      action: "불빛을 따라 들어간다",
    },
    {
      place: "path",
      camera: "push",
      figure: "none",
      lines: ["두 사람의 이름을 나란히 찍어 준다는 곳.", "“여기라고 했는데…”"],
      action: "작업실 앞에 선다",
    },
    {
      place: "gate",
      camera: "push",
      figure: "none",
      sfx: "탁",
      lines: ["“계세요…?”", "“안에서 무슨 소리가 났는데.”"],
      action: "문을 열어 본다",
    },
    {
      place: "house",
      camera: "tilt",
      figure: "silhouette",
      lines: ["누군가 붓을 내려놓는 소리.", "“손님이신가 봐요.”"],
      action: "안으로 들어선다",
    },
    {
      place: "room",
      camera: "wide",
      figure: "reveal",
      sfx: "사락",
      balloon: "어서 와요. 명식지는 벌써 펼쳐 뒀어요.",
      lines: ["“이 사람이…”", "“인주의 윤슬?”"],
      action: "자리에 앉는다",
    },
  ],
  doham: [
    {
      place: "far",
      camera: "wide",
      figure: "none",
      lines: ["끝이 보이지 않는 서고, 오래된 만세력이 잠들어 있다."],
      action: "안쪽으로 걸어 들어간다",
    },
    {
      place: "path",
      camera: "push",
      figure: "none",
      lines: ["인생의 물줄기를 읽어 주는 서생이 있다고 했다.", "“정말 사람이 살긴 하나?”"],
      action: "등불이 있는 쪽으로 간다",
    },
    {
      place: "gate",
      camera: "push",
      figure: "none",
      sfx: "펄럭",
      lines: ["“…누구 계십니까?”", "“책장이 혼자 넘어갔는데.”"],
      action: "책장 사이로 들어선다",
    },
    {
      place: "house",
      camera: "tilt",
      figure: "silhouette",
      lines: ["등불 아래, 누군가 책장을 넘기고 있었다.", "“실례합니다…”"],
      action: "가까이 다가간다",
    },
    {
      place: "room",
      camera: "wide",
      figure: "reveal",
      sfx: "스윽",
      balloon: "앉으세요. 마침 당신 차례였습니다.",
      lines: ["“이 사람이…”", "“서생 도담?”"],
      action: "맞은편에 앉는다",
    },
  ],
};

export function buildIntroShots(report: ReportProduct): WebtoonShot[] {
  const shots: WebtoonShot[] = SCRIPTS[report.guide].map((shot, index) => ({
    ...shot,
    id: `${report.guide}-${index}`,
    assetKey: `intro-${index}`,
  }));
  shots.push({
    id: `${report.guide}-question`,
    assetKey: "intro-5",
    place: "room",
    camera: "close",
    figure: "close",
    lines: [],
    balloon: QUESTIONS[report.slug] ?? "오늘은 무엇이 궁금해서 왔나요?",
    action: "대화 시작하기",
  });
  return shots;
}
