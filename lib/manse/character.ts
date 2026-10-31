// 타고난 성격.
//
// 성격은 풀이에서 가장 먼저 읽히는 자리인데, 모델에게 넘기는 재료에는 성격을 바로
// 가리키는 값이 없었다. 원국·강약·십성 분포를 던져 주고 "알아서 읽어라" 한 셈이다.
// 그래서 "성실하시네요", "감수성이 풍부해요" 처럼 누구에게나 걸리는 말로 돌아갔다.
//
// 명리에서 성격을 읽는 자리는 정해져 있다. 그 자리를 계산해서 말로 옮겨 둔다.
//
//   바탕      일간의 오행과 음양 — 타고난 기질
//   힘        신강·신약 — 그 기질을 얼마나 밀어붙이는가
//   드러나는쪽 가장 두꺼운 십성 묶음 — 평소에 쓰는 힘
//   모자란쪽   가장 얇은 십성 묶음 — 쓰지 못해 애먹는 힘
//   안에서     일지 — 가장 가까운 사람 앞에서 나오는 모습
//   밖에서     월지 — 일하고 사람 만나는 자리에서 보이는 모습
//   그늘      치우친 오행 — 지나칠 때 나오는 모습
//
// 좋은 말만 적지 않는다. 그늘이 없는 성격 풀이는 읽는 사람이 믿지 않는다.
import { countElementsWithHidden, type Strength } from "./strength";
import type { FourPillars } from "./pillars";
import {
  BRANCH_POLARITY,
  HIDDEN_STEMS,
  STEM_ELEMENT,
  STEM_POLARITY,
  branchTenGod,
  tenGod,
  type Branch,
  type Element,
  type Stem,
  type TenGod,
} from "./tables";

/** 일간의 오행과 음양이 가리키는 바탕 기질 */
const BASE: Record<Element, { 양: string; 음: string }> = {
  목: {
    양: "곧게 밀고 올라가는 사람. 한번 방향을 정하면 돌아가는 법이 없고, 막히면 돌아가기보다 뚫으려 든다.",
    음: "휘어지면서 뻗는 사람. 부딪히지 않고 비껴가며 결국 자기 자리를 만든다. 겉은 유연한데 안은 잘 안 바뀐다.",
  },
  화: {
    양: "드러내고 퍼뜨리는 사람. 생각이 바로 말과 표정으로 나와서 숨기지 못하고, 뜨거워지는 만큼 빨리 식는다.",
    음: "안에서 오래 타는 사람. 겉으로는 차분한데 속에서 계속 끓고 있고, 한 번 터지면 주변이 놀란다.",
  },
  토: {
    양: "자리를 지키는 사람. 쉽게 움직이지 않고 맡은 것을 끝까지 들고 있다. 믿음직한 만큼 때를 놓치기도 한다.",
    음: "사이를 잇는 사람. 양쪽 말을 다 듣고 가운데를 맞추느라, 정작 자기 몫은 뒤로 미룬다.",
  },
  금: {
    양: "끊고 가는 사람. 기준이 분명해서 아닌 것은 아니라고 하고, 그 말이 남에게는 차갑게 들린다.",
    음: "다듬는 사람. 거친 것을 그냥 못 넘기고 손을 대며, 자기에게도 남에게도 엄격하다.",
  },
  수: {
    양: "흘러가며 살피는 사람. 상황을 읽고 길을 바꾸는 데 빠르고, 한자리에 오래 묶이면 답답해한다.",
    음: "깊이 고이는 사람. 속을 잘 보이지 않고 혼자 오래 생각하며, 아는 것을 다 말하지 않는다.",
  },
};

/** 힘의 크기 — 같은 기질도 밀어붙이는 정도가 다르다 */
const FORCE: Record<Strength, string> = {
  신강: "타고난 힘이 넉넉해서 남의 말보다 자기 판단을 먼저 믿는다. 밀어붙이는 쪽이라 뚫는 일도 많고 부딪히는 일도 많다.",
  중화: "힘이 한쪽으로 치우치지 않아 상황에 맞춰 세기를 조절한다. 대신 결정적인 순간에 한 번 더 재느라 늦을 때가 있다.",
  신약: "혼자 다 떠안기보다 기대고 묻는 쪽이 잘 풀린다. 환경과 사람을 잘 고르면 멀리 가고, 잘못 고르면 그 자리에서 흔들린다.",
};

/** 십성 묶음 — 평소에 쓰는 힘 */
type Group = "비겁" | "식상" | "재성" | "관성" | "인성";
const GROUP_OF: Record<TenGod, Group> = {
  비견: "비겁", 겁재: "비겁",
  식신: "식상", 상관: "식상",
  편재: "재성", 정재: "재성",
  편관: "관성", 정관: "관성",
  편인: "인성", 정인: "인성",
};

const GROUP_STRONG: Record<Group, string> = {
  비겁: "제 몫을 스스로 챙긴다. 남이 정해 준 자리에 오래 못 있고, 결국 자기 방식으로 바꿔 놓는다.",
  식상: "떠오른 것을 밖으로 꺼낸다. 말이든 작품이든 일이든, 만들어서 내놓을 때 가장 살아난다.",
  재성: "손에 잡히는 것으로 바꾼다. 결과와 숫자가 보여야 움직이고, 사람도 쓸모로 먼저 본다.",
  관성: "틀과 책임을 먼저 본다. 맡으면 끝까지 지고 가며, 규칙이 없는 자리에서는 오히려 불안해한다.",
  인성: "먼저 이해하고 움직인다. 배우고 받아들이는 속도가 빠르지만, 알 때까지 시작을 미룬다.",
};

const GROUP_WEAK: Record<Group, string> = {
  비겁: "혼자 버티는 힘이 얇아, 곁에 사람이 없으면 금세 흔들린다.",
  식상: "하고 싶은 말을 안에 두고 삼킨다. 표현이 늦어 오해를 사는 일이 잦다.",
  재성: "눈앞의 돈과 결과를 챙기는 데 서툴다. 해 놓은 것에 비해 받는 것이 적다.",
  관성: "스스로를 매어 두는 틀이 약하다. 마감과 규칙이 없으면 끝까지 가지 못한다.",
  인성: "충분히 알기 전에 몸이 먼저 나간다. 배워 두면 될 것을 겪으며 배운다.",
};

/** 자리별로 드러나는 모습 */
const SEAT_FACE: Record<TenGod, { 안: string; 밖: string }> = {
  비견: { 안: "가까운 사이에서도 각자의 몫을 분명히 나눈다", 밖: "줄 서는 자리보다 제 간판을 걸고 싶어 한다" },
  겁재: { 안: "가까운 사람에게 쓰는 돈과 마음을 아끼지 못한다", 밖: "사람과 돈이 함께 얽히는 일에 자주 들어간다" },
  식신: { 안: "편한 사람 앞에서는 말이 많아지고 잘 먹고 잘 웃는다", 밖: "만들어 내는 일에서 인정을 받는다" },
  상관: { 안: "아니라고 느끼면 가까운 사이에도 그대로 말한다", 밖: "윗사람의 방식에 한 번은 부딪친다" },
  편재: { 안: "집 안의 일도 크게 벌이고 넉넉하게 쓴다", 밖: "기회가 보이면 판을 넓히는 쪽을 고른다" },
  정재: { 안: "살림과 약속을 꼼꼼히 지킨다", 밖: "맡은 범위 안에서 어김없이 해내는 사람으로 통한다" },
  편관: { 안: "가까운 사이에서도 긴장을 놓지 못한다", 밖: "버거운 일을 맡고도 해내며 평가가 갈린다" },
  정관: { 안: "집에서도 역할과 도리를 먼저 생각한다", 밖: "자리와 이름이 붙는 곳에서 힘이 실린다" },
  편인: { 안: "혼자 있는 시간이 있어야 숨이 쉬어진다", 밖: "남들이 안 보는 쪽을 파고들어 자기 영역을 만든다" },
  정인: { 안: "가까운 사람에게 기대고 또 기대게 한다", 밖: "배우고 가르치는 자리에서 오래 간다" },
};

/** 치우친 기운이 만드는 그늘 */
const SHADOW: Record<Element, string> = {
  목: "일을 벌여 놓고 수습이 뒤따라오지 않는다. 조급해질 때 가장 크게 손해 본다.",
  화: "감정이 앞서 말이 먼저 나간다. 지나고 나서 그 말 한마디가 오래 남는다.",
  토: "한번 정한 것을 못 바꾼다. 버티는 힘이 고집으로 바뀌는 자리가 있다.",
  금: "선을 긋고 끊어 낸다. 맞는 말인데 차갑게 전해져 사람이 떨어진다.",
  수: "생각이 길어져 시작이 늦는다. 재는 사이에 때가 지나간다.",
};

export interface Character {
  바탕: string;
  힘: string;
  드러나는쪽: { 이름: string; 모습: string };
  모자란쪽: { 이름: string; 모습: string };
  안에서: string;
  밖에서: string;
  그늘: string | null;
  비는기운: string | null;
}

const GROUPS: Group[] = ["비겁", "식상", "재성", "관성", "인성"];

/** 지장간까지 세어 십성 묶음의 두께를 잰다 */
function groupWeights(pillars: FourPillars, dayStem: Stem) {
  const weight: Record<Group, number> = { 비겁: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0 };
  const slots = [pillars.year, pillars.month, pillars.day, pillars.hour].filter(Boolean) as FourPillars["year"][];
  for (const pillar of slots) {
    weight[GROUP_OF[tenGod(dayStem, pillar.stem as Stem)]] += 1;
    weight[GROUP_OF[branchTenGod(dayStem, pillar.branch as Branch)]] += 1;
    // 지지 속에 숨은 글자도 성격으로 나온다. 본기만큼은 아니므로 절반만 센다.
    for (const hidden of HIDDEN_STEMS[pillar.branch as Branch].slice(0, -1)) {
      weight[GROUP_OF[tenGod(dayStem, hidden)]] += 0.5;
    }
  }
  return weight;
}

export function readCharacter(pillars: FourPillars, strength: Strength): Character {
  const dayStem = pillars.day.stem as Stem;
  const element = STEM_ELEMENT[dayStem];
  const polarity = STEM_POLARITY[dayStem];

  const weight = groupWeights(pillars, dayStem);
  const sorted = GROUPS.slice().sort((a, b) => weight[b] - weight[a]);
  const top = sorted[0]!;
  const bottom = sorted[sorted.length - 1]!;

  const dayBranch = pillars.day.branch as Branch;
  const monthBranch = pillars.month.branch as Branch;

  const counts = countElementsWithHidden(pillars);
  const total = counts.reduce((sum, row) => sum + row.total, 0) || 1;
  const heavy = counts.find((row) => row.total / total >= 0.35) ?? null;
  const empty = counts.find((row) => row.total === 0) ?? null;

  return {
    바탕: BASE[element][polarity],
    힘: FORCE[strength],
    드러나는쪽: { 이름: top, 모습: GROUP_STRONG[top] },
    모자란쪽: { 이름: bottom, 모습: GROUP_WEAK[bottom] },
    안에서: SEAT_FACE[branchTenGod(dayStem, dayBranch)].안,
    밖에서: SEAT_FACE[branchTenGod(dayStem, monthBranch)].밖,
    그늘: heavy ? SHADOW[heavy.element] : null,
    비는기운: empty
      ? `${empty.element} 쪽이 비어 있어, 그 자리의 일은 타고난 것으로 되지 않고 배워서 채워야 한다.`
      : null,
  };
}

// 음양 표기를 지지에서도 쓰므로 함께 내보낸다 (성격 판정에 일지 음양을 쓰는 곳이 있다)
export { BRANCH_POLARITY };
