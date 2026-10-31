// 나이로 꿴 삶의 연표.
//
// 그동안 모델에게 넘긴 재료는 "지금 이 사람이 어떤 사람인가" 뿐이었다. 대운 목록이
// 있긴 했지만 간지와 시작 나이만 적힌 표라, 읽는 쪽에서 "몇 살에 무엇이" 를 쓸 수가
// 없었다. 그래서 풀이가 늘 성격 이야기로 돌아갔다 — 누구에게나 조금씩 맞는 글이다.
//
// 사람이 사주를 보러 오는 이유는 "내가 어떤 사람인지" 가 아니라 "언제 무엇이 오는지"다.
// 그 질문에 답하려면 나이가 박힌 표가 있어야 한다. 여기서 만든다.
//
// 지어내지는 않는다. 각 칸의 영역과 결은 전부 계산에서 나온다 —
//   · 들어온 글자가 일간과 맺는 관계(십성)가 "무엇이 움직이는가"를 정한다.
//   · 들어온 글자가 용신 쪽인지 기신 쪽인지가 "순풍인가 역풍인가"를 정한다.
//   · 들어온 글자가 원국의 어느 자리와 합·충하는지가 "삶의 어디가 흔들리는가"를 정한다.
import type { FourPillars } from "./pillars";
import { incomingRelations } from "./relations";
import type { Strength } from "./strength";
import {
  STEM_ELEMENT,
  branchTenGod,
  tenGod,
  twelveStage,
  type Branch,
  type Element,
  type Stem,
  type TenGod,
} from "./tables";

/** 십성이 가리키는 삶의 영역. 사건을 쓰려면 "무엇이 움직이는지"부터 정해야 한다 */
const FIELD: Record<TenGod, { 영역: string; 일어나는일: string }> = {
  비견: { 영역: "사람과 독립", 일어나는일: "제 몫을 따로 챙기게 되는 일 — 독립·분가·동업·경쟁" },
  겁재: { 영역: "사람과 돈의 섞임", 일어나는일: "가까운 사람과 돈이 얽히는 일 — 보증·동업·빌려주기" },
  식신: { 영역: "만들고 내보내는 일", 일어나는일: "새로 벌이는 일과 결과물 — 창업·출산·작품·먹고사는 기반" },
  상관: { 영역: "드러내고 부딪히는 일", 일어나는일: "말과 재능이 밖으로 터지는 일 — 발표·이직·윗사람과의 마찰" },
  편재: { 영역: "크게 움직이는 돈", 일어나는일: "큰돈이 오가는 일 — 사업·투자·이동이 잦은 벌이" },
  정재: { 영역: "꾸준히 쌓는 돈", 일어나는일: "고정 수입과 살림 — 취업·월급·집·결혼(남)" },
  편관: { 영역: "밀어붙이는 압박", 일어나는일: "버거운 책임이 오는 일 — 승진·이직·수술·관재" },
  정관: { 영역: "맡은 자리와 책임", 일어나는일: "자리와 이름이 붙는 일 — 합격·취업·승진·결혼(여)" },
  편인: { 영역: "혼자 익히는 힘", 일어나는일: "안으로 파고드는 일 — 자격증·유학·종교·요양" },
  정인: { 영역: "배움과 기댈 곳", 일어나는일: "배우고 보호받는 일 — 진학·문서·집·어른의 도움" },
};

/** 십이운성이 가리키는 힘의 크기 */
const STAGE_FORCE: Record<string, string> = {
  장생: "막 시작해 힘이 붙는 때",
  목욕: "흔들리며 배우는 때",
  관대: "자리를 잡아 가는 때",
  건록: "제 힘으로 버는 때",
  제왕: "기세가 가장 센 때",
  쇠: "한풀 꺾이는 때",
  병: "힘이 빠지는 때",
  사: "정리하고 마무리하는 때",
  묘: "거두어 묻어 두는 때",
  절: "끊기고 비는 때",
  태: "다시 생기는 때",
  양: "품고 기르는 때",
};

export type Wind = "순풍" | "역풍" | "보통";

export interface LifeSpan {
  /** 이 칸이 시작되는 나이(세는 나이) */
  startAge: number;
  endAge: number;
  startYear: number;
  endYear: number;
  /** 들어온 간지 — 글에는 내보내지 않고 근거로만 쓴다 */
  ganji: string;
  /** 무엇이 움직이는가 */
  영역: string;
  일어나는일: string;
  /** 얼마나 센가 */
  힘: string;
  /** 순풍인가 역풍인가 */
  바람: Wind;
  /** 삶의 어느 자리가 흔들리는가 */
  흔들리는자리: string[];
}

export interface YearSpan {
  age: number;
  year: number;
  ganji: string;
  영역: string;
  일어나는일: string;
  바람: Wind;
  흔들리는자리: string[];
}

export interface LifeTimeline {
  /** 지금 나이 (세는 나이) */
  나이: number;
  /** 열 해씩 아홉 칸 */
  열해: LifeSpan[];
  /** 올해부터 열두 해 */
  해마다: YearSpan[];
  /** 지금 지나는 칸의 번호 (없으면 -1) */
  지금칸: number;
}

/** 원국의 자리를 삶의 영역으로 — 글에 자리 이름을 꺼내지 않기 위해서다 */
const SEAT: Record<string, string> = {
  년: "집안과 뿌리",
  연: "집안과 뿌리",
  월: "일하고 사람 만나는 자리",
  일: "나 자신과 가장 가까운 사이",
  시: "말년과 자식",
};

function seatsOf(pillars: FourPillars, incoming: { stem: Stem; branch: Branch; label: string }) {
  const seats = new Set<string>();
  for (const relation of incomingRelations(pillars, incoming)) {
    for (const position of [relation.sourcePosition, relation.targetPosition]) {
      if (position.includes(incoming.label)) continue;
      const seat = SEAT[position.trim().charAt(0)];
      if (seat) seats.add(seat);
    }
  }
  return Array.from(seats);
}

/**
 * 순풍인가 역풍인가.
 *
 * 용신은 "채우면 풀리는 것", 기신은 "길어지면 탈 나는 것"이다. 들어온 글자가 어느
 * 쪽인지만 본다 — 점수를 매기지 않는다. 우리가 세지 않는 숫자는 만들지 않는다.
 */
function windOf(element: Element, yongsin: Element | null, gisin: Element | null): Wind {
  if (yongsin && element === yongsin) return "순풍";
  if (gisin && element === gisin) return "역풍";
  return "보통";
}

function spanOf(
  pillars: FourPillars,
  dayStem: Stem,
  ganji: string,
  label: string,
  yongsin: Element | null,
  gisin: Element | null,
) {
  const stem = ganji[0] as Stem;
  const branch = ganji[1] as Branch;
  // 천간이 무엇을 움직이는지를 먼저 본다. 지지는 그 일이 어느 자리에서 벌어지는지다.
  const god = tenGod(dayStem, stem);
  const field = FIELD[god] ?? FIELD[branchTenGod(dayStem, branch)]!;
  return {
    ganji,
    영역: field.영역,
    일어나는일: field.일어나는일,
    힘: STAGE_FORCE[twelveStage(dayStem, branch)] ?? "고르게 흐르는 때",
    바람: windOf(STEM_ELEMENT[stem], yongsin, gisin),
    흔들리는자리: seatsOf(pillars, { stem, branch, label }),
  };
}

export interface LifeTimelineInput {
  pillars: FourPillars;
  /** 대운 — 시작 나이 순서대로 */
  decades: ReadonlyArray<{ startAge: number; full: string; startYear: number }>;
  /** 올해부터 열두 해의 세운 */
  years: ReadonlyArray<{ year: number; full: string }>;
  birthYear: number;
  yongsin: Element | null;
  gisin: Element | null;
  strength: Strength;
  now?: Date;
}

/**
 * 나이가 박힌 연표를 만든다.
 *
 * 세는 나이를 쓴다. 대운이 세는 나이로 돌아가고, 손님도 "서른둘에" 라고 말하지
 * "만 서른하나에" 라고 말하지 않는다.
 */
export function buildLifeTimeline(input: LifeTimelineInput): LifeTimeline {
  const now = input.now ?? new Date();
  const dayStem = input.pillars.day.stem as Stem;
  const 나이 = now.getFullYear() - input.birthYear + 1;

  const 열해 = input.decades.map((item, index) => {
    const next = input.decades[index + 1];
    return {
      startAge: item.startAge,
      endAge: next ? next.startAge - 1 : item.startAge + 9,
      startYear: item.startYear,
      endYear: next ? next.startYear - 1 : item.startYear + 9,
      ...spanOf(input.pillars, dayStem, item.full, "대운", input.yongsin, input.gisin),
    };
  });

  const 해마다 = input.years.map((item) => ({
    age: item.year - input.birthYear + 1,
    year: item.year,
    ...spanOf(input.pillars, dayStem, item.full, "세운", input.yongsin, input.gisin),
  }));

  return {
    나이,
    열해,
    해마다: 해마다.map(({ ganji, 영역, 일어나는일, 바람, 흔들리는자리, age, year }) => ({
      age,
      year,
      ganji,
      영역,
      일어나는일,
      바람,
      흔들리는자리,
    })),
    지금칸: 열해.findIndex((span) => 나이 >= span.startAge && 나이 <= span.endAge),
  };
}
