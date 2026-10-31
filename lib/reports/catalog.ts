// 판매 상품 카탈로그 — 가격·안내자·챕터·대화 질문의 단일 원본.
// 가격은 design/code.html 명시가 + 마스터 프롬프트 추가 상품. supabase/migrations 시드는 scripts/generate-report-seed.mts 로 생성한다.
import type { SazuTopic } from "../sazu/schemas";
import type { GuideId } from "../story/guides";

export type ReportCategory = "reunion" | "romance" | "chemistry" | "destiny" | "year" | "wealth" | "work" | "study" | "child";
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
  /** 간판. 짧고 부르기 쉬운 상품 이름 */
  title: string;
  /** 후킹 한 줄. 카드에서 제목 다음으로 큰 글씨가 된다 */
  tagline: string;
  /** 실제로 무엇을 받는지. 전문용어 없이 */
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
  /** 더 쓰지 않는다 — 고르는 질문을 없애고 자유 서술 한 칸으로 바꿨다(0; 운영 데이터 호환용) */
  questions?: readonly SituationQuestion[];
  /** 자유 서술 질문 */
  detail?: { prompt: string; placeholder: string };
  /** components/home/assets 의 장면 이미지 키 */
  cover: "highlightReunion" | "thumbReunion" | "thumbLove" | "thumbCompatibility" | "thumbLife" | "thumbStudy" | "thumbChild" | "thumbWork" | "thumbAdmission" | "thumbDream" | "thumbTalent";
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
  prompt: "두 분의 이야기를 편하게 적어 주세요. 만난 계기, 헤어진 이유, 마지막 대화… 적어 주신 만큼 더 가까이 읽을게요. 안 적으셔도 풀이는 그대로 나와요.",
  placeholder: "(예) 작년 여름 소개로 만나 올해 2월에 헤어졌어요. 제가 바쁘다는 이유로 연락을 소홀히 했고, 지금은 연락이 끊겼어요.",
};

export const REPORTS = [
  {
    slug: "reunion-deep",
    kind: "report",
    category: "reunion",
    categoryLabel: "재회 심층",
    title: "그 사람은 왜 연락을 멈췄을까?",
    tagline: "그 사람이 연락을 멈춘 진짜 이유",
    description:
      "헤어진 상대의 명식까지 함께 펼쳐, 지금 그 사람 마음에 남아 있는 것과 빗장이 풀리는 시기, 먼저 연락하면 안 되는 이유까지 짚어 드려요.",
    price: 14900,
    originalPrice: 24000,
    discountLabel: "38% OFF",
    guide: "seoha",
    topics: ["love"],
    partner: "required",
    chapters: [
      "두 사람이 어디서부터 엇갈렸나",
      "그 사람이 연락을 멈춘 진짜 이유",
      "지금 그 사람의 마음에 남아 있는 것",
      "마음의 빗장이 풀리는 시기",
      "먼저 연락하면 안 되는 사주적 이유",
      "다시 닿기 위한 현실적인 한 걸음",
    ],
    detail: REUNION_DETAIL,
    cover: "highlightReunion",
  },
  {
    slug: "reunion",
    kind: "report",
    category: "reunion",
    categoryLabel: "재회",
    title: "우리 다시 만날 수 있을까?",
    tagline: "다시 닿을 수 있을까",
    description:
      "그 사람의 지금 연애관과, 연락이 닿기 쉬운 흐름·지금은 피해야 할 행동을 짚어 드려요.",
    price: 12900,
    guide: "seoha",
    topics: ["love"],
    partner: "required",
    chapters: ["두 사람의 기운이 엇갈린 지점", "그 사람의 속마음과 연애관", "연락이 닿기 쉬운 흐름", "피해야 할 행동"],
    detail: REUNION_DETAIL,
    cover: "thumbReunion",
  },
  {
    slug: "love",
    kind: "report",
    category: "romance",
    categoryLabel: "연애",
    title: "내 사랑은 언제 올까?",
    tagline: "올해 나를 찾아올 사람의 얼굴",
    description:
      "내 명식에 새겨진 연애의 결과 자꾸 반복되는 패턴, 올해 인연이 들어오는 시기를 읽어 드려요.",
    price: 13900,
    guide: "seoha",
    topics: ["love"],
    partner: "none",
    chapters: ["타고난 연애의 결", "반복되는 연애 패턴과 그 이유", "올해 인연이 들어오는 흐름", "인연을 알아보고 붙잡는 법"],
    detail: { prompt: "요즘 마음에 둔 사람이나 연애 고민이 있다면 적어 주세요. 없어도 괜찮아요.", placeholder: "(예) 회사 동료가 신경 쓰이는데 먼저 다가가도 될지 모르겠어요." },
    cover: "thumbLove",
  },
  {
    slug: "compatibility",
    kind: "report",
    category: "chemistry",
    categoryLabel: "궁합",
    title: "우리 둘은 잘 맞을까?",
    tagline: "우리는 왜 같은 걸로 또 싸울까",
    description:
      "두 사람의 기운이 부딪히는 지점과 서로를 채우는 자리, 이 사람에게 실제로 닿는 말투를 찾아 드려요.",
    price: 16800,
    guide: "yunseul",
    topics: ["compatibility"],
    partner: "required",
    chapters: ["서로를 끌어당기는 기운", "자꾸 같은 걸로 부딪히는 이유", "서로의 결핍을 채우는 방식", "두 사람만의 대화법"],
    detail: { prompt: "두 분 사이에 자주 생기는 장면이 있다면 적어 주세요. 안 적으셔도 풀이는 그대로 나와요.", placeholder: "(예) 제가 서운함을 말하면 상대는 대화를 피하고 잠수를 타요." },
    cover: "thumbCompatibility",
  },
  {
    // 최고가 상품. 다른 리포트가 한 주제를 깊게 판다면 이건 평생의 줄기를 통째로 본다.
    // 토픽 다섯을 한 명식 위에 겹쳐 읽으므로 생성에 드는 시간과 비용도 그만큼 크다.
    slug: "destiny-full",
    kind: "report",
    category: "destiny",
    categoryLabel: "종합 명식",
    title: "나는 무얼 가지고 태어났을까?",
    tagline: "타고난 결부터 말년까지, 한 권으로",
    description:
      "타고난 그릇에서 시작해 열 해씩 바뀌는 대운 아홉 칸, 올해와 내년, 재물과 인연, 말년까지 — 흩어져 있던 풀이를 한 사람의 생애 순서로 꿰어 읽는 열한 장입니다.",
    price: 48200,
    originalPrice: 72000,
    discountLabel: "33% OFF",
    guide: "doham",
    // 다섯 토픽을 모두 계산해 한 보고서로 엮는다
    topics: ["life", "decade", "yearly", "money", "love"],
    partner: "optional",
    chapters: [
      "타고난 그릇의 모양",
      "나를 움직이는 힘과 막는 힘",
      "나를 살리는 기운은 어느 쪽인가",
      "열 해마다 바뀌는 삶의 배경",
      "지금 지나는 열 해의 한가운데에서",
      "올해와 내년, 그리고 그다음",
      "재물이 들어오는 길목과 새는 구멍",
      "인연의 자리와 가까워지는 방식",
      "몸과 마음이 기우는 방향",
      "말년의 결과 지금 심어 둘 것",
      "앞으로 10년을 위한 태도",
    ],
    detail: {
      prompt: "지금의 상황과, 이 풀이에서 꼭 답을 얻고 싶은 것을 적어 주세요. 적어 주신 만큼 가까이 읽습니다. 안 적으셔도 풀이는 그대로 나와요.",
      placeholder: "(예) 마흔을 앞두고 일도 관계도 한 번 정리하고 싶은데, 무엇을 남기고 무엇을 놓아야 할지 모르겠어요.",
    },
    cover: "thumbLife",
  },
  {
    slug: "life",
    kind: "report",
    category: "destiny",
    categoryLabel: "평생",
    title: "내 인생은 어떻게 흘러갈까?",
    tagline: "내 그릇의 크기와 물줄기가 바뀌는 때",
    description:
      "타고난 그릇의 모양과 중심이 되는 기운, 인생의 큰 물줄기가 바뀌는 전환점을 읽어 드려요.",
    price: 19800,
    guide: "doham",
    topics: ["life"],
    partner: "none",
    chapters: ["타고난 그릇의 모양", "나를 움직이는 힘과 막는 힘", "나를 살리는 기운은 어느 쪽인가", "삶의 배경이 바뀌는 전환점", "앞으로 10년을 위한 태도"],
    detail: { prompt: "지금 가장 크게 고민하는 선택이 있다면 적어 주세요. 안 적으셔도 풀이는 그대로 나와요.", placeholder: "(예) 10년 다닌 회사를 그만두고 창업을 할지 고민이에요." },
    cover: "thumbLife",
  },
  {
    slug: "yearly",
    kind: "report",
    category: "year",
    categoryLabel: "신년",
    title: "내년엔 무슨 일이 생길까?",
    tagline: "내년 한 해, 나에게 머무는 한 글자",
    description:
      "한 해의 큰 흐름을 달 단위로 쪼개, 기회가 열리는 달과 한 템포 쉬어 갈 달을 나눠 드려요.",
    price: 14900,
    guide: "yunseul",
    topics: ["yearly"],
    partner: "none",
    chapters: ["한 해를 관통하는 기운", "달마다 달라지는 흐름", "기회를 잡을 때와 쉬어 갈 때"],
    cover: "thumbLife",
  },
  {
    slug: "money",
    kind: "report",
    category: "wealth",
    categoryLabel: "재물",
    title: "나는 돈을 어떻게 벌까?",
    tagline: "돈이 들어오는 길목과 새는 구멍",
    description:
      "돈이 들어오는 자리와 새어 나가는 구조, 재물의 흐름이 바뀌는 시기를 읽어 드려요.",
    price: 9900,
    guide: "doham",
    topics: ["money"],
    partner: "none",
    chapters: ["돈이 들어오는 사주의 구조", "재물이 모이는 시기", "새지 않게 지키는 습관"],
    cover: "thumbLife",
  },
  {
    slug: "career",
    kind: "report",
    category: "work",
    categoryLabel: "직업",
    title: "나에게 맞는 일은 뭘까?",
    tagline: "하늘이 내게 맞춘 일",
    description:
      "타고난 기질로 읽는 일의 적성과, 지원·이직에 힘이 실리는 시기를 짚어 드려요.",
    price: 9900,
    guide: "doham",
    topics: ["money", "decade"],
    partner: "none",
    chapters: ["나에게 맞는 일의 결", "지금 흐름이 여는 일의 방향", "움직이기 좋은 시기"],
    cover: "thumbLife",
  },
  {
    slug: "health",
    kind: "report",
    category: "destiny",
    categoryLabel: "건강",
    title: "내 몸은 어디가 약할까?",
    tagline: "내 몸이 먼저 지치는 자리",
    description:
      "기운의 치우침으로 읽는 몸의 긴장 자리와, 리듬을 고르게 되돌리는 생활 습관을 짚어 드려요.",
    price: 9900,
    guide: "doham",
    topics: ["health"],
    partner: "none",
    chapters: ["타고난 기운의 균형", "유의해서 살필 계통", "생활에서 기운을 고르는 법"],
    cover: "thumbLife",
    disclaimer: "전통 명리 관점의 참고 정보이며 의료 조언이 아닙니다. 증상이 있다면 전문의와 상담하세요.",
  },
  // ─── 니즈별: 학업·자녀 (가격은 제안값) ─────────────────────────────────────
  {
    slug: "study",
    kind: "report",
    category: "study",
    categoryLabel: "공부",
    title: "나는 언제 공부가 터질까?",
    tagline: "나에게 붙는 공부법과 터지는 시기",
    description:
      "내가 어떤 방식으로 공부해야 남는 사람인지, 시험과 자격증에 힘이 실리는 달은 언제인지 읽어 드려요.",
    price: 12900,
    guide: "doham",
    topics: ["life", "yearly"],
    partner: "none",
    chapters: ["타고난 공부 체질과 집중의 결", "나에게 맞는 공부 방식", "시험·목표에 힘이 실리는 시기", "흔들릴 때 붙잡을 기준"],
    detail: { prompt: "지금 공부 상황을 편하게 적어 주세요. 안 적으셔도 풀이는 그대로 나와요.", placeholder: "(예) 공무원 시험 2년째인데 작년에 두 문제 차이로 떨어졌어요." },
    cover: "thumbLife",
  },
  {
    slug: "child-study",
    kind: "report",
    category: "child",
    categoryLabel: "우리 아이 공부",
    title: "우리 아이는 어떻게 공부해야 할까?",
    tagline: "이 아이에게 맞는 공부 방식",
    description:
      "아이의 명식으로 읽는 공부 체질과 집중이 붙는 방식, 부모가 건네면 좋은 말과 눌러서는 안 될 결을 짚어 드려요.",
    price: 14900,
    guide: "doham",
    roles: { subject: "child" },
    topics: ["life", "yearly"],
    partner: "none",
    chapters: ["아이의 타고난 기질과 재능", "아이에게 맞는 공부 방식", "학업에 힘이 붙는 시기", "진로의 방향", "부모가 건네면 좋은 말과 피할 말"],
    detail: { prompt: "아이에 대해 더 알려 주고 싶은 게 있다면 적어 주세요. 안 적으셔도 풀이는 그대로 나와요.", placeholder: "(예) 수학은 좋아하는데 영어를 유독 싫어하고, 요즘 휴대폰 보는 시간이 길어요." },
    cover: "thumbChild",
  },
  {
    slug: "parent-child",
    kind: "report",
    category: "child",
    categoryLabel: "부모·자녀",
    title: "우리 아이와 왜 자꾸 부딪힐까?",
    tagline: "잔소리 대신 닿는 말",
    description:
      "부모와 아이의 기운이 부딪히는 지점과, 이 아이에게 실제로 닿는 말투를 찾아 드려요.",
    price: 14900,
    guide: "yunseul",
    roles: { subject: "parent", partner: "child" },
    topics: ["compatibility"],
    partner: "required",
    chapters: ["나와 아이의 기운이 닮은 곳과 다른 곳", "자꾸 부딪히는 이유", "아이에게 닿는 대화법"],
    detail: { prompt: "최근 아이와 있었던 장면을 하나 적어 주세요. 안 적으셔도 풀이는 그대로 나와요.", placeholder: "(예) 숙제하라고 하면 방문을 닫고 대답을 안 해요." },
    cover: "thumbCompatibility",
  },
  {
    slug: "business",
    kind: "report",
    category: "work",
    categoryLabel: "사업",
    title: "나는 사업을 해도 될까?",
    tagline: "내 사주에 사업이 있을까",
    description:
      "남 밑에서 버는 결인지 내 간판을 걸 결인지, 사람을 써야 크는지 혼자 해야 남는지 — 벌일 때와 접을 때까지 짚어 드려요.",
    price: 16900,
    originalPrice: 24000,
    discountLabel: "29% OFF",
    guide: "doham",
    topics: ["money", "decade"],
    partner: "none",
    chapters: [
      "내 밑천 — 혼자 밀고 나가는 힘의 크기",
      "사람을 쓰는 결인가, 혼자 쥐는 결인가",
      "돈이 돌아 들어오는 구조와 새는 구멍",
      "벌일 때와 거둘 때",
      "올해와 내년, 움직여도 되는 달",
      "이 사주가 피해야 할 사업의 모양",
    ],
    detail: {
      prompt: "어떤 일을 하고 계시거나 하려는지, 지금 가장 막힌 지점을 적어 주세요. 안 적으셔도 풀이는 그대로 나와요.",
      placeholder: "(예) 3년째 카페를 하는데 매출이 제자리라 확장할지 접을지 고민이에요.",
    },
    cover: "thumbWork",
  },
  {
    // 입시 상품. 합격 여부를 점치지 않는다 — 학업 기운이 차오르는 해와 꺾이는 해,
    // 시험에 힘이 실리는 달을 연도별로 짚는 것이 이 상품이 파는 것이다.
    slug: "child-admission",
    kind: "report",
    category: "child",
    categoryLabel: "우리 아이 입시",
    title: "우리 아이는 어느 대학에 갈까?",
    tagline: "우리 아이가 갈 대학의 첫 글자",
    description:
      "입시를 앞둔 아이의 학업 기운이 차오르는 해와 꺾이는 해를 연도별 표로 펼쳐, 고3·재수 시기의 흐름과 시험에 힘이 실리는 달을 짚어 드려요.",
    price: 19800,
    originalPrice: 29000,
    discountLabel: "31% OFF",
    guide: "doham",
    roles: { subject: "child" },
    topics: ["yearly", "decade"],
    partner: "none",
    chapters: [
      "이 아이의 공부 그릇 — 타고난 학업의 결",
      "집중이 붙는 자리와 흩어지는 자리",
      "연도별 학업 흐름 — 중3부터 재수까지",
      "지금 흐름이 공부에 주는 배경",
      "시험에 힘이 실리는 달과 흔들리는 달",
      "원서와 선택 — 기운이 열리는 방향",
      "부모가 할 일과 하지 말아야 할 일",
    ],
    detail: {
      prompt: "아이의 지금 상황과, 이 풀이에서 꼭 알고 싶은 것을 적어 주세요. 안 적으셔도 풀이는 그대로 나와요.",
      placeholder: "(예) 고2인데 2학기 들어 성적이 계속 떨어져요. 재수를 각오해야 할지 고민입니다.",
    },
    disclaimer: "학업의 기운이 차오르는 해와 꺾이는 해를 읽습니다. 어느 대학에 붙는지를 찍어 주는 풀이는 아닙니다.",
    cover: "thumbAdmission",
  },
  {
    slug: "child-dream",
    kind: "report",
    category: "child",
    categoryLabel: "우리 아이 진로",
    title: "우리 아이는 뭐가 되고 싶을까?",
    tagline: "이 아이는 무엇이 되려고 태어났을까",
    description:
      "타고난 재능이 어느 쪽으로 뻗는지, 어떤 일에서 빛나고 어떤 일에서 시드는지 — 아이가 스스로 길을 고를 때 참고할 결을 읽어 드려요.",
    price: 16900,
    guide: "doham",
    roles: { subject: "child" },
    topics: ["life", "decade"],
    partner: "none",
    chapters: [
      "이 아이가 타고난 기질의 모양",
      "재능이 뻗는 방향 — 만들까, 다룰까, 이끌까",
      "빛나는 자리와 시드는 자리",
      "재능이 자라는 시기 — 열 해 단위의 배경",
      "어울리는 일의 결과 어울리지 않는 일의 결",
      "부모가 길을 넓혀 주는 방법",
    ],
    detail: {
      prompt: "아이가 요즘 빠져 있는 것이나, 진로를 두고 드는 생각을 적어 주세요. 안 적으셔도 풀이는 그대로 나와요.",
      placeholder: "(예) 그림을 몇 시간씩 그리는데 이걸 직업으로 밀어줘도 될지 모르겠어요.",
    },
    cover: "thumbDream",
  },
  {
    slug: "child-talent",
    kind: "report",
    category: "child",
    categoryLabel: "영재",
    title: "우리 아이는 어떤 재능이 있을까?",
    tagline: "우리 아이는 어떤 영재일까",
    description:
      "아이의 명식에 드러난 재능의 종류와 그것이 터지는 시기, 그리고 지금 눌러서는 안 될 결을 짚어 드려요.",
    price: 14900,
    guide: "yunseul",
    roles: { subject: "child" },
    topics: ["life"],
    partner: "none",
    chapters: [
      "이 아이의 재능이 머무는 자리",
      "어떤 종류의 영재인가 — 다섯 결로 보는 분류",
      "재능이 터지는 시기와 기다려야 할 시기",
      "키우는 법과 꺾는 법",
    ],
    detail: {
      prompt: "아이에게서 유난히 눈에 띄는 모습이 있다면 적어 주세요. 안 적으셔도 풀이는 그대로 나와요.",
      placeholder: "(예) 다섯 살인데 한글을 혼자 떼고 책을 하루 종일 읽어요.",
    },
    cover: "thumbTalent",
  },
  {
    slug: "consult",
    kind: "consult",
    category: "destiny",
    categoryLabel: "1:1 상담",
    title: "1:1 사주 상담",
    tagline: "궁금한 걸 직접 묻는 자리",
    description:
      "내 명식을 띄워 두고 궁금한 것을 자유롭게 묻는 대화 세션이에요 · 최대 20턴",
    price: 5900,
    guide: "seoha",
    topics: ["consult"],
    partner: "none",
    chapters: [],
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
