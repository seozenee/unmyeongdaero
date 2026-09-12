// 판매 상품 카탈로그 — 가격·안내자·챕터·대화 질문의 단일 원본.
// 가격은 design/code.html 명시가 + 마스터 프롬프트 추가 상품. supabase/migrations 시드는 scripts/generate-report-seed.mts 로 생성한다.
import type { SazuTopic } from "../sazu/schemas";
import type { GuideId } from "../story/guides";

export type ReportCategory = "reunion" | "romance" | "chemistry" | "destiny" | "year" | "wealth" | "study";
export type PartnerRequirement = "none" | "optional" | "required";
export type ProductKind = "report" | "consult";

/** 입력 대화에서 묻는 선택형 질문. 답변은 풀이를 개인화하는 근거가 된다 */
export interface SituationQuestion {
  id: string;
  question: string;
  options: readonly string[];
}

export interface ReportProduct {
  slug: string;
  kind: ProductKind;
  category: ReportCategory;
  /** 카테고리 배지 문구 */
  categoryLabel: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  discountLabel?: string;
  guide: GuideId;
  /** 명식 주인의 역할 라벨. 기본은 본인(subject)·그 사람(partner). 자녀 상품은 자녀 명식을 부모가 입력한다 */
  roles?: { subject: "self" | "child" | "parent"; partner?: "lover" | "child" };
  /** 해석에 쓰는 sazu v2 토픽 (manse 는 항상 함께 호출) */
  topics: readonly SazuTopic[];
  partner: PartnerRequirement;
  /** 보고서 목차. AI 가 이 순서·제목으로 장을 쓴다 */
  chapters: readonly string[];
  questions: readonly SituationQuestion[];
  /** 자유 서술 질문 */
  detail?: { prompt: string; placeholder: string };
  /** components/home/assets 의 장면 이미지 키 */
  cover: "highlightReunion" | "thumbReunion" | "thumbLove" | "thumbCompatibility" | "thumbLife";
  /** 화면·AI 풀이에 반드시 붙일 고지 */
  disclaimer?: string;
}

const BREAKUP_PERIOD: SituationQuestion = {
  id: "breakupPeriod",
  question: "헤어진 지는 얼마나 됐나요?",
  options: ["3개월 이내", "6개월 이내", "1년 이상", "아직 헤어지지 않았어요"],
};
const CONTACT_STATUS: SituationQuestion = {
  id: "contactStatus",
  question: "지금 그 사람과 연락은 어떤 상태예요?",
  options: ["완전히 끊겼어요", "차단됐어요", "가끔 연락해요", "계속 연락하고 있어요"],
};
const REUNION_DETAIL = {
  prompt: "두 분의 이야기를 편하게 적어 주세요. 만난 계기, 헤어진 이유, 마지막 대화… 적어 주신 만큼 더 가까이 읽을게요.",
  placeholder: "(예) 작년 여름 소개로 만나 올해 2월에 헤어졌어요. 제가 바쁘다는 이유로 연락을 소홀히 했고, 지금은 연락이 끊겼어요.",
};

export const REPORTS = [
  {
    slug: "reunion-deep",
    kind: "report",
    category: "reunion",
    categoryLabel: "재회 심층 리포트",
    title: "월령의 밤 : 그 사람은 왜 연락을 멈췄을까?",
    description:
      "헤어진 상대의 가려진 무의식과 마음의 빗장이 풀리는 결정적 타이밍, 그리고 내가 먼저 연락하면 안 되는 사주적 이유.",
    price: 14900,
    originalPrice: 24000,
    discountLabel: "38% OFF",
    guide: "seoha",
    topics: ["love"],
    partner: "required",
    chapters: [
      "두 사람의 명식이 엇갈린 자리",
      "그 사람이 연락을 멈춘 진짜 이유",
      "지금 그 사람의 마음에 남아 있는 것",
      "마음의 빗장이 풀리는 시기",
      "먼저 연락하면 안 되는 사주적 이유",
      "다시 닿기 위한 현실적인 한 걸음",
    ],
    questions: [
      BREAKUP_PERIOD,
      { id: "whoEnded", question: "이별은 누가 먼저 꺼냈나요?", options: ["제가 먼저", "그 사람이 먼저", "자연스럽게 멀어졌어요"] },
      CONTACT_STATUS,
      { id: "wish", question: "지금 가장 바라는 건 무엇인가요?", options: ["다시 만나고 싶어요", "그 사람 마음만 알고 싶어요", "후회 없이 정리하고 싶어요"] },
    ],
    detail: REUNION_DETAIL,
    cover: "highlightReunion",
  },
  {
    slug: "reunion",
    kind: "report",
    category: "reunion",
    categoryLabel: "재회 사주",
    title: "그 사람의 속마음과 재회 타이밍",
    description: "상대방의 현재 사주 대운 속 연애관, 연락이 닿을 가능성이 가장 높은 날짜와 금기 행동",
    price: 12900,
    guide: "seoha",
    topics: ["love"],
    partner: "required",
    chapters: ["두 사람의 기운이 엇갈린 지점", "그 사람의 속마음과 연애관", "연락이 닿기 쉬운 흐름", "피해야 할 행동"],
    questions: [BREAKUP_PERIOD, CONTACT_STATUS],
    detail: REUNION_DETAIL,
    cover: "thumbReunion",
  },
  {
    slug: "love",
    kind: "report",
    category: "romance",
    categoryLabel: "연애 사주",
    title: "올해 나를 찾아올 결정적 인연의 얼굴과 장소",
    description: "내 사주 원국에 박힌 정관/편관의 기운으로 풀어낸 인연의 나이대, 외모 분위기, 첫 만남의 계기",
    price: 13900,
    guide: "seoha",
    topics: ["love"],
    partner: "none",
    chapters: ["내 원국에 새겨진 연애의 결", "반복되는 연애 패턴과 그 이유", "올해 인연이 들어오는 흐름", "인연을 알아보고 붙잡는 법"],
    questions: [
      { id: "status", question: "지금 연애는 어떤 상태인가요?", options: ["솔로예요", "썸 타는 중이에요", "연애 중이에요", "조금 복잡해요"] },
      { id: "want", question: "어떤 인연을 기다리고 있나요?", options: ["편안한 사람", "설레는 사람", "결혼까지 갈 사람", "아직 잘 모르겠어요"] },
      { id: "pattern", question: "지난 연애에서 가장 자주 반복된 건?", options: ["금방 식어요", "제가 더 좋아해요", "자주 다퉈요", "시작이 어려워요"] },
    ],
    detail: { prompt: "요즘 마음에 둔 사람이나 연애 고민이 있다면 적어 주세요. 없어도 괜찮아요.", placeholder: "(예) 회사 동료가 신경 쓰이는데 먼저 다가가도 될지 모르겠어요." },
    cover: "thumbLove",
  },
  {
    slug: "compatibility",
    kind: "report",
    category: "chemistry",
    categoryLabel: "궁합 사주",
    title: "사소한 말에 상처받는 이유 : 기운 충돌 처방전",
    description: "반복되는 싸움의 오행적 원인과 대화법, 서로의 결핍을 채워주는 현실적 조화의 길",
    price: 16800,
    guide: "yunseul",
    topics: ["compatibility"],
    partner: "required",
    chapters: ["서로를 끌어당기는 기운", "자꾸 부딪히는 오행의 이유", "서로의 결핍을 채우는 방식", "두 사람만의 대화법"],
    questions: [
      { id: "relation", question: "두 분은 어떤 사이인가요?", options: ["연인이에요", "부부예요", "썸 타는 중이에요", "친구·동료예요"] },
      { id: "duration", question: "함께한 지는 얼마나 됐나요?", options: ["6개월 미만", "6개월~3년", "3년 이상"] },
      { id: "concern", question: "요즘 가장 큰 고민은 무엇인가요?", options: ["자주 싸워요", "마음이 식은 것 같아요", "미래가 걱정돼요", "더 깊어지고 싶어요"] },
    ],
    detail: { prompt: "두 분 사이에 자주 생기는 장면이 있다면 적어 주세요.", placeholder: "(예) 제가 서운함을 말하면 상대는 대화를 피하고 잠수를 타요." },
    cover: "thumbCompatibility",
  },
  {
    slug: "life",
    kind: "report",
    category: "destiny",
    categoryLabel: "평생 사주",
    title: "타고난 그릇과 30대 후반 대운의 방향성",
    description: "내 사주의 중심 오행과 용신 분석, 인생의 가장 큰 물줄기가 바뀌는 황금기 전환점",
    price: 19800,
    guide: "doham",
    topics: ["life"],
    partner: "none",
    chapters: ["타고난 그릇의 모양", "나를 움직이는 힘과 막는 힘", "중심 오행과 용신이 가리키는 방향", "대운이 바뀌는 전환점", "앞으로 10년을 위한 태도"],
    questions: [
      { id: "concern", question: "요즘 가장 마음이 쓰이는 건 무엇인가요?", options: ["진로·일", "사람·관계", "돈", "나 자신"] },
      { id: "phase", question: "지금 인생의 어느 지점이라고 느끼나요?", options: ["막 시작하는 중", "버티는 중", "전환을 고민 중", "안정적이에요"] },
    ],
    detail: { prompt: "지금 가장 크게 고민하는 선택이 있다면 적어 주세요.", placeholder: "(예) 10년 다닌 회사를 그만두고 창업을 할지 고민이에요." },
    cover: "thumbLife",
  },
  {
    slug: "yearly",
    kind: "report",
    category: "year",
    categoryLabel: "신년 운세",
    title: "다가오는 해, 나에게 머무는 한 글자",
    description: "세운과 월운으로 짚어 보는 한 해의 큰 흐름, 기회가 열리는 달과 한 템포 쉬어 갈 달",
    price: 14900,
    guide: "yunseul",
    topics: ["yearly"],
    partner: "none",
    chapters: ["한 해를 관통하는 기운", "달마다 달라지는 흐름", "기회를 잡을 때와 쉬어 갈 때"],
    questions: [
      { id: "focus", question: "새해에 가장 궁금한 건 무엇인가요?", options: ["일·커리어", "연애·관계", "재물", "건강"] },
      { id: "word", question: "다가올 해를 한 단어로 고른다면?", options: ["도전", "회복", "정리", "성장"] },
    ],
    cover: "thumbLife",
  },
  {
    slug: "money",
    kind: "report",
    category: "wealth",
    categoryLabel: "금전운",
    title: "돈이 들어오는 길목과 새는 구멍",
    description: "재성의 구조와 재고(財庫)가 열리는 시기로 읽는 나만의 재물 흐름",
    price: 9900,
    guide: "doham",
    topics: ["money"],
    partner: "none",
    chapters: ["돈이 들어오는 사주의 구조", "재물이 모이는 시기", "새지 않게 지키는 습관"],
    questions: [
      { id: "money", question: "돈과 관련해 지금 가장 궁금한 건 무엇인가요?", options: ["수입을 늘리고 싶어요", "모으는 게 어려워요", "투자·사업을 고민 중이에요"] },
      { id: "income", question: "지금 수입은 주로 어디서 오나요?", options: ["직장 월급", "사업·프리랜서", "투자 수익도 있어요", "준비 중이에요"] },
    ],
    cover: "thumbLife",
  },
  {
    slug: "career",
    kind: "report",
    category: "wealth",
    categoryLabel: "취업운",
    title: "나에게 맞는 일, 움직이기 좋은 때",
    description: "십성과 대운으로 보는 일의 적성, 지원·이직에 힘이 실리는 시기",
    price: 9900,
    guide: "doham",
    topics: ["money", "decade"],
    partner: "none",
    chapters: ["나에게 맞는 일의 결", "지금 대운이 여는 일의 방향", "움직이기 좋은 시기"],
    questions: [
      { id: "career", question: "지금 어떤 상황인가요?", options: ["취업 준비 중이에요", "이직을 고민 중이에요", "창업·프리랜서를 고민 중이에요", "지금 일에 만족해요"] },
      { id: "value", question: "일에서 가장 중요한 건 무엇인가요?", options: ["안정", "성장", "돈", "자유"] },
    ],
    cover: "thumbLife",
  },
  {
    slug: "health",
    kind: "report",
    category: "destiny",
    categoryLabel: "건강운",
    title: "내 몸의 기운이 기우는 방향",
    description: "오행 균형으로 살피는 유의 계통과 생활 속 기운 고르기",
    price: 9900,
    guide: "doham",
    topics: ["health"],
    partner: "none",
    chapters: ["타고난 기운의 균형", "유의해서 살필 계통", "생활에서 기운을 고르는 법"],
    questions: [
      { id: "condition", question: "요즘 컨디션은 어떤가요?", options: ["자주 피곤해요", "잠이 부족해요", "스트레스가 많아요", "대체로 괜찮아요"] },
      { id: "area", question: "특히 신경 쓰이는 곳이 있나요?", options: ["소화", "수면·마음", "호흡기·피부", "근육·관절"] },
    ],
    cover: "thumbLife",
    disclaimer: "전통 명리 관점의 참고 정보이며 의료 조언이 아닙니다. 증상이 있다면 전문의와 상담하세요.",
  },
  // ─── 니즈별: 학업·자녀 (가격은 제안값) ─────────────────────────────────────
  {
    slug: "study",
    kind: "report",
    category: "study",
    categoryLabel: "학업·시험운",
    title: "공부가 붙는 시기와 나에게 맞는 공부법",
    description: "인성·식상의 흐름으로 읽는 집중력의 결, 시험·자격증에 힘이 실리는 달과 흔들리기 쉬운 달",
    price: 12900,
    guide: "doham",
    topics: ["life", "yearly"],
    partner: "none",
    chapters: ["타고난 공부 체질과 집중의 결", "나에게 맞는 공부 방식", "시험·목표에 힘이 실리는 시기", "흔들릴 때 붙잡을 기준"],
    questions: [
      { id: "goal", question: "지금 준비하는 건 무엇인가요?", options: ["수능·내신", "공무원·임용", "자격증·어학", "대학원·유학"] },
      { id: "struggle", question: "공부에서 가장 힘든 건 무엇인가요?", options: ["집중이 안 돼요", "꾸준히 못 해요", "시험만 보면 긴장해요", "방향을 모르겠어요"] },
      { id: "dday", question: "목표 시험은 언제쯤인가요?", options: ["3개월 이내", "6개월 이내", "1년 이내", "1년 이상"] },
    ],
    detail: { prompt: "지금 공부 상황을 편하게 적어 주세요.", placeholder: "(예) 공무원 시험 2년째인데 작년에 두 문제 차이로 떨어졌어요." },
    cover: "thumbLife",
  },
  {
    slug: "child-study",
    kind: "report",
    category: "study",
    categoryLabel: "자녀 학업·진로",
    title: "우리 아이가 빛나는 공부 방향과 진로의 결",
    description: "자녀의 명식으로 읽는 타고난 학습 기질과 재능, 공부에 힘이 붙는 시기, 부모가 건네면 좋은 말",
    price: 14900,
    guide: "doham",
    roles: { subject: "child" },
    topics: ["life", "yearly"],
    partner: "none",
    chapters: ["아이의 타고난 기질과 재능", "아이에게 맞는 공부 방식", "학업에 힘이 붙는 시기", "진로의 방향", "부모가 건네면 좋은 말과 피할 말"],
    questions: [
      { id: "grade", question: "자녀는 지금 몇 학년인가요?", options: ["초등학생", "중학생", "고등학생", "대학생·수험생"] },
      { id: "childConcern", question: "요즘 가장 걱정되는 건 무엇인가요?", options: ["집중력·습관", "성적", "진로 선택", "친구·마음"] },
      { id: "childStyle", question: "아이는 어떤 편인가요?", options: ["스스로 하는 편", "시켜야 하는 편", "잘하다가 금방 지쳐요", "아직 잘 모르겠어요"] },
    ],
    detail: { prompt: "아이에 대해 더 알려 주고 싶은 게 있다면 적어 주세요.", placeholder: "(예) 수학은 좋아하는데 영어를 유독 싫어하고, 요즘 휴대폰 보는 시간이 길어요." },
    cover: "thumbLife",
  },
  {
    slug: "parent-child",
    kind: "report",
    category: "study",
    categoryLabel: "부모·자녀 궁합",
    title: "나와 아이, 부딪히는 이유와 가까워지는 말",
    description: "부모와 자녀의 오행이 서로를 채우고 부딪히는 지점, 잔소리 대신 닿는 대화법",
    price: 14900,
    guide: "yunseul",
    roles: { subject: "parent", partner: "child" },
    topics: ["compatibility"],
    partner: "required",
    chapters: ["나와 아이의 기운이 닮은 곳과 다른 곳", "자꾸 부딪히는 이유", "아이에게 닿는 대화법"],
    questions: [
      { id: "grade", question: "자녀는 지금 몇 학년인가요?", options: ["초등학생", "중학생", "고등학생", "대학생·수험생"] },
      { id: "conflict", question: "아이와 가장 자주 부딪히는 건 무엇인가요?", options: ["공부·성적", "생활습관", "휴대폰·게임", "감정 표현"] },
    ],
    detail: { prompt: "최근 아이와 있었던 장면을 하나 적어 주세요.", placeholder: "(예) 숙제하라고 하면 방문을 닫고 대답을 안 해요." },
    cover: "thumbCompatibility",
  },
  {
    slug: "consult",
    kind: "consult",
    category: "destiny",
    categoryLabel: "AI 상담",
    title: "서하와 나누는 1:1 사주 상담",
    description: "내 명식을 바탕으로 궁금한 것을 자유롭게 묻는 대화 세션 · 최대 20턴",
    price: 5900,
    guide: "seoha",
    topics: ["consult"],
    partner: "none",
    chapters: [],
    questions: [],
    cover: "thumbReunion",
  },
] as const satisfies readonly ReportProduct[];

export type ReportSlug = (typeof REPORTS)[number]["slug"];

/** AI 상담 세션 1회당 최대 턴(사용자 질문 수) */
export const CONSULT_TURN_LIMIT = 20;

export function getReport(slug: string): ReportProduct | undefined {
  return REPORTS.find((report) => report.slug === slug);
}

export function listReports(kind: ProductKind = "report"): ReportProduct[] {
  return REPORTS.filter((report) => report.kind === kind);
}
