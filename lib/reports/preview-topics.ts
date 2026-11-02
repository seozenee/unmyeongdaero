import type { PreviewContext } from "../manse/preview";

export type LockedTopic = { title: string; subtitle: string; rows: readonly string[]; format: "date" | "money" | "text" };
const TOPICS: Record<string, LockedTopic> = {
  relationship: { title: "나에게 맞는 인연", subtitle: "끌리는 사람과 편하게 오래 가는 사람은 어떻게 다를까", rows: ["마음이 가까워지는 방식", "서로 맞춰 볼 생활의 기준", "관계의 변화를 살펴볼 시기"], format: "date" },
  everyday: { title: "가까워진 뒤에도 편하려면", subtitle: "연락과 만남, 혼자 쉬는 시간까지 서로 맞춰 보기", rows: ["편안하게 느끼는 관계의 속도", "애정을 표현하고 받는 방법", "서운함을 구체적인 부탁으로 바꾸기"], format: "text" },
  reunion: { title: "다시 말을 건네기 전에", subtitle: "기다림을 이어 갈지, 내 생활을 되찾을지 판단할 기준", rows: ["반복해서 어긋난 대화", "실제 상대의 반응에서 확인할 것", "연락을 멈추거나 이어 갈 기준"], format: "date" },
  money: { title: "돈이 들어오는 길과 남는 조건", subtitle: "많이 버는 것과 내 손에 남는 것은 왜 다를까", rows: ["내게 맞는 수입을 만드는 방식", "지출과 약속에서 새는 부분", "돈의 계획을 다시 살펴볼 시기"], format: "money" },
  work: { title: "지금 하는 일이 나와 맞을까", subtitle: "잘 버티는 환경과, 계속 소모되는 환경을 나눠 보기", rows: ["의욕이 붙는 일의 조건", "독립과 협업에서 확인할 것", "이동 전에 준비할 기준"], format: "text" },
  study: { title: "노력한 만큼 배우는 방법", subtitle: "양을 늘리기 전에, 이해하고 익히는 순서를 맞춰 보기", rows: ["이해가 붙는 설명 방식", "스스로 해 볼 때의 강점", "공부 계획을 조절할 시기"], format: "text" },
  child: { title: "아이에게 닿는 말과 환경", subtitle: "재촉하지 않아도 시작하고, 스스로 이어 가는 조건", rows: ["아이에게 맞는 설명과 질문", "잘하는 것을 알아볼 작은 시도", "부모가 바꿔 볼 말과 기대"], format: "text" },
  talent: { title: "아이의 강점을 알아보는 방법", subtitle: "잘한다고 정하기 전에, 어떤 활동을 오래 붙잡는지", rows: ["직접 해 볼 때 보이는 강점", "반복할수록 의욕이 붙는 활동", "부모가 마련해 줄 작은 경험"], format: "text" },
  dream: { title: "아이가 자기 길을 고르는 기준", subtitle: "정답을 골라 주기보다, 직접 비교할 경험을 만들기", rows: ["관심과 실제로 해 본 일의 차이", "선택할 여지가 있을 때의 반응", "진로를 좁히기 전에 해 볼 경험"], format: "text" },
  admission: { title: "입시를 준비하며 맞춰 볼 것", subtitle: "목표를 정한 뒤, 아이에게 맞는 준비 순서를 찾기", rows: ["공부 방식과 준비 환경", "계획을 점검할 시기", "결과를 재촉하기 전에 확인할 조건"], format: "date" },
  health: { title: "몸과 마음을 덜 소모하는 생활", subtitle: "무리할 때 먼저 흐트러지는 습관을 살펴보기", rows: ["쉬는 시간을 미루는 패턴", "생활에서 확인할 부담", "일과 휴식을 나눌 기준"], format: "text" },
  time: { title: "앞으로의 시기와 선택", subtitle: "기다리기만 하는 대신, 때에 맞춰 무엇을 준비할까", rows: ["새롭게 시험해 볼 시기", "벌인 일을 정리할 시기", "큰 선택 전에 확인할 조건"], format: "date" },
};

export function lockedTopicsFor(context: PreviewContext): LockedTopic[] {
  if (context.slug === "child-talent") return [TOPICS.talent!, TOPICS.child!, TOPICS.time!];
  if (context.slug === "child-dream") return [TOPICS.dream!, TOPICS.talent!, TOPICS.child!];
  if (context.slug === "child-admission") return [TOPICS.admission!, TOPICS.study!, TOPICS.child!];
  if (context.category === "child") return [TOPICS.child!, TOPICS.study!, TOPICS.time!];
  if (context.category === "study" || context.minor) return [TOPICS.study!, TOPICS.child!, TOPICS.time!];
  if (context.category === "reunion") return [TOPICS.reunion!, TOPICS.relationship!, TOPICS.time!];
  if (context.category === "romance" || context.category === "chemistry") return [TOPICS.relationship!, TOPICS.time!, TOPICS.everyday!];
  if (context.category === "wealth" || context.slug === "business") return [TOPICS.money!, TOPICS.work!, TOPICS.time!];
  if (context.category === "work") return [TOPICS.work!, TOPICS.money!, TOPICS.time!];
  if (context.slug === "health") return [TOPICS.health!, TOPICS.work!, TOPICS.time!];
  if (context.category === "year") return [TOPICS.time!, TOPICS.work!, TOPICS.relationship!];
  const relation = context.lifeContext.relationshipStatus === "재회 원해요" ? TOPICS.reunion!
    : context.lifeContext.relationshipStatus === "결혼했어요" ? TOPICS.everyday! : TOPICS.relationship!;
  return [relation, TOPICS.money!, TOPICS.time!];
}

/** 실제 판매 목차의 내용을 쉽게 읽을 세 항목으로 펼친다. */
export function chapterPreview(title: string): readonly string[] {
  if (/귀인/.test(title)) return ["내 편이 되는 사람의 역할과 특징", "조언과 소개가 힘이 되는 시기", "도움을 알아보고 관계를 이어 가는 법"];
  if (/지나온|과거/.test(title)) return ["최근의 변화가 겹쳤던 해", "그때 마음과 선택이 달라진 이유", "지금까지 이어지는 반복과 전환점"];
  if (/표현|말과/.test(title)) return ["내 말을 듣게 만드는 타고난 강점", "설명과 설득이 잘 맞는 자리", "같은 말이 오해로 바뀌는 순간"];
  if (/배우자/.test(title)) return ["내가 끌리는 사람과 오래 편한 사람", "관계의 흐름이 겹치는 연도와 달", "가까워진 뒤 맞춰 가야 할 부분"];
  if (/몸|건강|체질/.test(title)) return ["무리할 때의 생활 패턴", "일과 휴식을 조절할 기준", "일상에서 먼저 확인할 변화"];
  if (/돈|재물|수입|사업/.test(title)) return ["수입과 지출에서 반복되는 선택", "기회가 생겼을 때 살펴볼 조건", "내 생활에 맞는 준비와 기준"];
  if (/인연|연애|재회|마음|관계|부부|결혼|상대/.test(title)) return ["서로에게 편한 거리와 표현", "같은 일로 어긋나는 이유", "실제 대화와 행동에서 확인할 것"];
  if (/공부|학업|입시|대학|전공|배우/.test(title)) return ["이해하고 익히는 나만의 순서", "의욕이 붙거나 끊기는 조건", "준비한 것을 점검할 시기"];
  if (/아이|부모|양육|재능|진로/.test(title)) return ["일상에서 눈여겨볼 강점", "기대와 부담이 엇갈리는 부분", "함께 시도해 볼 말과 환경"];
  if (/몸|건강|마음이|체질/.test(title)) return ["무리할 때의 생활 패턴", "일과 휴식을 조절할 기준", "일상에서 먼저 확인할 변화"];
  if (/해|시기|언제|대운|말년|흐름|앞으로/.test(title)) return ["지금과 다음 시기의 차이", "새로 해 볼 일과 정리할 일", "선택 전에 준비할 조건"];
  if (/일|직업|간판|밑/.test(title)) return ["잘 맞는 역할과 일의 방식", "혼자 할 때와 함께할 때의 차이", "방향을 바꾸기 전에 확인할 것"];
  return ["겉으로 보이는 모습과 속의 차이", "같은 성향이 장점과 부담이 되는 때", "나에게 맞게 바꿔 볼 선택"];
}
