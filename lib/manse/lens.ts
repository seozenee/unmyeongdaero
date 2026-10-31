import type { SazuModules } from "../saju/modules";
import { parseElementCounts } from "../saju/modules";

/**
 * 계산값을 "알아듣는 틀"로 옮긴다.
 *
 * 사주 값만 넘기면 모델은 결국 두루뭉술하게 쓴다. "집중력이 좋아요", "감수성이
 * 풍부해요" — 누구에게나 조금씩 맞는 말이라 아무것도 맞히지 못한다.
 *
 * 그래서 사이에 틀을 하나 둔다. 아이 재능이면 렌줄리의 세 고리(평균 이상의 능력 ·
 * 과제 집착력 · 창의성)처럼, 그 분야에서 이미 쓰이는 눈금을 가져와 계산값을 거기에
 * 얹는다. 눈금이 있으면 "과제 집착력이 높은 쪽"까지 좁혀지고, 거기서 나오는 행동은
 * 훨씬 구체적으로 적을 수 있다.
 *
 *   과제 집착력이 높다 → 완벽주의로 비틀린다 → 한 문제가 막히면 다음 장으로 못 넘어가고,
 *   글씨가 마음에 안 들면 종이가 찢어질 때까지 지운다
 *
 * 분명히 해 둘 것: 우리는 렌줄리 검사를 하지 않는다. 그 틀의 눈금과 말을 빌려, 계산값이
 * 가리키는 쪽을 적는 것이다. 그래서 점수를 매기지 않고 "높은 쪽 / 보통 / 낮은 쪽"까지만
 * 말한다. 없는 정밀도를 꾸미지 않는다.
 *
 * 아래 looksLike 는 손님에게 그대로 나가는 글이 아니다. 모델에게 "이 수준이면 이런
 * 모습으로 나온다"를 알려 주는 본보기다. 최종 문장은 모델이 나머지 계산값까지 함께
 * 보고 새로 쓴다.
 */

export type Level = "높은 쪽" | "보통" | "낮은 쪽";

export interface LensDimension {
  이름: string;
  수준: Level;
  왜: string;
  이런모습으로: string[];
}

export interface Lens {
  틀: string;
  차원: LensDimension[];
}

/** 십성 열 가지를 다섯 묶음으로 */
const GROUP_OF: Record<string, Group> = {
  비견: "비겁", 겁재: "비겁",
  식신: "식상", 상관: "식상",
  편재: "재성", 정재: "재성",
  편관: "관성", 정관: "관성",
  편인: "인성", 정인: "인성",
};

const GROUP_LABEL = { 비겁: "주도", 식상: "표현", 재성: "현실", 관성: "규율", 인성: "흡수" } as const;
type Group = keyof typeof GROUP_LABEL;

const STEM_ELEMENT: Record<string, Element> = {
  갑: "목", 을: "목", 병: "화", 정: "화", 무: "토",
  기: "토", 경: "금", 신: "금", 임: "수", 계: "수",
};
type Element = "목" | "화" | "토" | "금" | "수";

/**
 * 자리마다 무게가 다르다.
 *
 * 여덟 글자를 하나씩 똑같이 세고 있었다. 그런데 명리에서 월지는 계절을 쥔 자리라
 * 나머지와 무게가 다르고(월령), 일지는 바로 내 자리다. 년지·시지는 그보다 가볍다.
 * 똑같이 세면 월지에 무엇이 앉았든 결과가 같아져, 사람이 덜 갈린다.
 */
const POSITION_WEIGHT: Record<string, number> = { year: 0.8, month: 1.5, day: 1.2, hour: 0.8 };

/**
 * 지지 속에 숨은 글자(지장간)까지 센다.
 *
 * 엔진은 이미 지장간을 계산해 두고 있었는데 한 번도 쓰지 않았다. 겉으로 드러난 여덟
 * 글자만 세면 유(酉) 하나를 금 하나로 치지만, 그 안에는 경·신이 들어 있다. 반대로
 * 미(未)는 토로만 보이지만 안에 정(화)과 을(목)이 섞여 있다. 숨은 글자를 빼놓으면
 * 치우침이 실제보다 단순하게 보인다.
 *
 * 본기는 그 지지의 주인이라 온전히 세고, 중기와 여기는 섞여 있는 만큼만 센다.
 */
const HIDDEN_WEIGHT = { main: 1, middle: 0.5, residue: 0.3 } as const;

interface Weighted {
  십성: Record<Group, number>;
  오행: Record<Element, number>;
}

function weigh(modules: SazuModules): Weighted {
  const 십성: Record<Group, number> = { 비겁: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0 };
  const 오행: Record<Element, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  const four = modules.fourPillars as Record<string, Record<string, unknown>> | undefined;
  if (!four) return { 십성, 오행 };

  for (const [slot, weight] of Object.entries(POSITION_WEIGHT)) {
    const cell = four[slot];
    if (!cell) continue;

    // 천간 — 드러난 글자 하나
    const skyGroup = typeof cell.sippiSeong === "string" ? GROUP_OF[cell.sippiSeong] : undefined;
    if (skyGroup) 십성[skyGroup] += weight;
    const skyElement = typeof cell.sky === "string" ? STEM_ELEMENT[cell.sky] : undefined;
    if (skyElement) 오행[skyElement] += weight;

    // 지지 — 드러난 결은 십성으로, 속에 든 글자는 오행으로
    const earthGroup = typeof cell.earthSippiSeong === "string" ? GROUP_OF[cell.earthSippiSeong] : undefined;
    if (earthGroup) 십성[earthGroup] += weight;

    const hidden = cell.jiJangGan as Record<string, { stem?: string } | null> | undefined;
    for (const [part, share] of Object.entries(HIDDEN_WEIGHT)) {
      const stem = hidden?.[part]?.stem;
      const element = typeof stem === "string" ? STEM_ELEMENT[stem] : undefined;
      if (element) 오행[element] += weight * share;
    }
  }
  return { 십성, 오행 };
}

const share = (value: number, total: number) => (total > 0 ? value / total : 0);

/**
 * 어디에 서 있는가.
 *
 * 무게를 매기고 나면 합이 더 이상 여덟이 아니다. 그래서 절대 숫자가 아니라 전체에서
 * 차지하는 몫으로 본다. 다섯으로 고르게 나뉘면 각자 20%다.
 *
 * 처음에는 30%를 기준으로 삼았다가 거의 모두 "보통"으로 뭉개졌다. 평균이 20%인데
 * 30%를 요구하면 평균의 1.5배를 넘겨야 기운 쪽이 되는 셈이라 너무 빡빡하다. 평균보다
 * 뚜렷이 많다는 말은 1.35배쯤이면 충분하다.
 *
 * 두 신호를 섞는다. 어떤 글자를 쓰는가(십성)가 그 사람이 쓰는 힘에 더 가까우므로
 * 조금 더 무겁게 보고, 어떤 기운이 깔려 있는가(오행)를 거든다. 한쪽만 보면 얇다.
 */
function levelOf(sipseong: number, element: number): Level {
  const blended = sipseong * 0.6 + element * 0.4;
  if (blended >= 0.27) return "높은 쪽";
  if (blended <= 0.13) return "낮은 쪽";
  return "보통";
}

const BEHAVIOUR: Record<string, Record<Level, string[]>> = {
  과제집착력: {
    "높은 쪽": [
      "한 문제가 막히면 다음 장으로 넘어가지 못하고 그 자리에 붙들려 있는다",
      "글씨나 줄이 마음에 안 들면 종이가 상할 때까지 지우고 다시 쓴다",
      "다 끝내지 못한 것이 있으면 자리를 떠도 머릿속에 남아 다른 일이 손에 안 잡힌다",
    ],
    보통: [
      "흥미가 붙은 것은 끝까지 가지만 그렇지 않은 것은 적당히 끊는다",
      "마감이 보이면 속도가 붙고, 멀면 미뤄 둔다",
    ],
    "낮은 쪽": [
      "시작은 쉽게 하는데 중간에 다른 것이 눈에 들어오면 그쪽으로 옮겨 간다",
      "벌여 놓은 것은 여럿인데 끝맺은 것은 몇 없다",
    ],
  },
  창의성: {
    "높은 쪽": [
      "하라는 대로 하지 않고 자기 방식으로 바꿔서 해 놓는다",
      "엉뚱한 질문을 해서 어른을 멈칫하게 만든다",
      "만들다 만 것, 그리다 만 것이 방 여기저기 널려 있다",
    ],
    보통: ["틀 안에서 자기 색을 조금씩 낸다", "익숙한 방식을 쓰다가 가끔 다른 길을 시도한다"],
    "낮은 쪽": [
      "정해진 순서와 방식이 있어야 마음이 놓인다",
      "새로운 방식을 권하면 왜 바꿔야 하냐고 되묻는다",
    ],
  },
  배우는힘: {
    "높은 쪽": [
      "한 번 들은 것을 오래 기억하고, 설명을 들으면 바로 자기 말로 바꿔 말한다",
      "궁금한 것이 생기면 찾아보다 한참을 그 안에 머문다",
    ],
    보통: ["반복하면 확실히 붙는다", "관심 있는 쪽은 빨리 익히고 아닌 쪽은 더디다"],
    "낮은 쪽": [
      "앉아서 듣는 것보다 직접 해 보면서 익히는 쪽이 빠르다",
      "글로 된 설명보다 그림이나 손으로 만지는 쪽이 잘 들어온다",
    ],
  },
  다가가는힘: {
    "높은 쪽": ["마음이 생기면 먼저 연락하고 먼저 약속을 잡는다", "좋으면 티가 나서 주위가 먼저 안다"],
    보통: ["상대가 반쯤 오면 나머지를 간다", "확신이 서면 움직이고 아니면 지켜본다"],
    "낮은 쪽": [
      "마음이 있어도 먼저 연락하지 못하고 상대가 올 때까지 기다린다",
      "좋아하는 티를 안 내려다 오히려 차갑게 보인다",
    ],
  },
  버티는힘: {
    "높은 쪽": ["한번 맺은 관계나 일을 쉽게 놓지 못한다", "아니라는 걸 알면서도 한참을 더 붙들고 있는다"],
    보통: ["어느 정도까지는 버티다 선을 넘으면 정리한다"],
    "낮은 쪽": ["아니다 싶으면 비교적 빨리 접는다", "오래 끄는 것 자체를 힘들어한다"],
  },
  쓰는결: {
    "높은 쪽": ["모으는 것보다 쓰는 쪽이 익숙해서 통장이 자주 비워진다", "사람에게 쓰는 돈을 아끼지 못한다"],
    보통: ["쓸 때 쓰고 모을 때 모으는 편이다"],
    "낮은 쪽": ["모아 두는 쪽이라 쓸 때마다 한 번 더 생각한다", "큰 지출 앞에서 결정을 한참 미룬다"],
  },
};

const dimension = (이름: string, 수준: Level, 왜: string): LensDimension => ({
  이름,
  수준,
  왜,
  이런모습으로: BEHAVIOUR[이름]?.[수준] ?? [],
});

/**
 * 상품의 분야에 맞는 틀을 고른다.
 *
 * 아이 재능에 애착 성향을 들이대거나 연애에 과제 집착력을 들이대면 틀이 있으나 마나다.
 * 분야마다 그 분야에서 쓰이는 눈금을 쓴다.
 */
export function buildLens(modules: SazuModules, category: string): Lens | null {
  const { 십성, 오행 } = weigh(modules);
  const 십성합 = Object.values(십성).reduce((sum, value) => sum + value, 0);
  const 오행합 = Object.values(오행).reduce((sum, value) => sum + value, 0);

  const read = (group: Group, element: Element): Level =>
    levelOf(share(십성[group], 십성합), share(오행[element], 오행합));

  /** 어디서 그렇게 봤는지 — 숫자를 그대로 적어 둔다. 따져 볼 수 있어야 근거다 */
  const why = (group: Group, element: Element) =>
    `${GROUP_LABEL[group]} 쪽 글자 ${Math.round(share(십성[group], 십성합) * 100)}% · ` +
    `${element} 기운 ${Math.round(share(오행[element], 오행합) * 100)}% ` +
    `(고르게 나뉘면 각 20%). 월지·일지를 무겁게 세고, 지지 속에 숨은 글자까지 넣었다.`;

  if (category === "child" || category === "study") {
    return {
      틀: "렌줄리의 세 고리 — 재능은 능력 하나로 나오지 않고, 능력·과제 집착력·창의성 셋이 겹치는 자리에서 나온다",
      차원: [
        dimension("배우는힘", read("인성", "수"), why("인성", "수")),
        dimension("과제집착력", read("관성", "토"), why("관성", "토")),
        dimension("창의성", read("식상", "화"), why("식상", "화")),
      ],
    };
  }

  if (category === "romance" || category === "reunion" || category === "chemistry") {
    return {
      틀: "가까워지는 방식 — 먼저 다가가는 힘과 붙들고 있는 힘은 따로 논다",
      차원: [
        dimension("다가가는힘", read("식상", "화"), why("식상", "화")),
        dimension("버티는힘", read("관성", "토"), why("관성", "토")),
      ],
    };
  }

  if (category === "wealth" || category === "work") {
    return {
      틀: "일과 돈을 대하는 결 — 버는 힘, 끌고 가는 힘, 쓰는 결은 서로 다른 자리에서 나온다",
      차원: [
        dimension("쓰는결", read("재성", "화"), why("재성", "화")),
        dimension("버티는힘", read("관성", "토"), why("관성", "토")),
        dimension("창의성", read("식상", "목"), why("식상", "목")),
      ],
    };
  }

  return null;
}
