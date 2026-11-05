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
    양: "곧게 밀고 올라가는 사람이에요. 한번 방향을 정하면 돌아가는 법이 없고, 막히면 돌아가기보다 뚫으려 들어요.",
    음: "휘어지면서 뻗는 사람이에요. 부딪히지 않고 비껴가며 결국 자기 자리를 만들어요. 겉은 유연한데 안은 잘 바뀌지 않아요.",
  },
  화: {
    양: "드러내고 퍼뜨리는 사람이에요. 생각이 바로 말과 표정으로 나와서 숨기지 못하고, 뜨거워지는 만큼 빨리 식어요.",
    음: "안에서 오래 타는 사람이에요. 겉으로는 차분한데 속에서 계속 끓고 있고, 한 번 터지면 주변이 놀라요.",
  },
  토: {
    양: "자리를 지키는 사람이에요. 쉽게 움직이지 않고 맡은 것을 끝까지 들고 있어요. 믿음직한 만큼 때를 놓치기도 해요.",
    음: "사이를 잇는 사람이에요. 양쪽 말을 다 듣고 가운데를 맞추느라, 정작 자기 몫은 뒤로 미뤄요.",
  },
  금: {
    양: "끊고 가는 사람이에요. 기준이 분명해서 아닌 것은 아니라고 말하고, 그 말이 남에게는 차갑게 들리기도 해요.",
    음: "다듬는 사람이에요. 거친 것을 그냥 못 넘기고 손을 대며, 자기에게도 남에게도 엄격해요.",
  },
  수: {
    양: "흘러가며 살피는 사람이에요. 상황을 읽고 길을 바꾸는 데 빠르고, 한자리에 오래 묶이면 답답해해요.",
    음: "깊이 고이는 사람이에요. 속을 잘 보이지 않고 혼자 오래 생각하며, 아는 것을 다 말하지는 않아요.",
  },
};

/** 힘의 크기 — 같은 기질도 밀어붙이는 정도가 다르다 */
const FORCE: Record<Strength, string> = {
  신강: "타고난 힘이 넉넉해서 남의 말보다 자기 판단을 먼저 믿어요. 밀어붙이는 쪽이라 뚫는 일도 많고 부딪히는 일도 많아요.",
  중화: "힘이 한쪽으로 치우치지 않아 상황에 맞춰 세기를 조절해요. 대신 결정적인 순간에 한 번 더 재느라 늦을 때가 있어요.",
  신약: "혼자 다 떠안기보다 기대고 묻는 쪽이 잘 풀려요. 환경과 사람을 잘 고르면 멀리 가고, 잘못 고르면 그 자리에서 흔들려요.",
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
  비겁: "제 몫을 스스로 챙겨요. 남이 정해 준 자리에 오래 있지 못하고, 결국 자기 방식으로 바꿔 놓아요.",
  식상: "떠오른 것을 밖으로 꺼내요. 말이든 작품이든 일이든, 만들어서 내놓을 때 가장 살아나요.",
  재성: "손에 잡히는 것으로 바꿔요. 결과와 숫자가 보여야 움직이고, 사람도 쓸모로 먼저 봐요.",
  관성: "틀과 책임을 먼저 봐요. 맡으면 끝까지 지고 가며, 규칙이 없는 자리에서는 오히려 불안해해요.",
  인성: "먼저 이해하고 움직여요. 배우고 받아들이는 속도가 빠르지만, 알 때까지 시작을 미뤄요.",
};

const GROUP_WEAK: Record<Group, string> = {
  비겁: "혼자 버티는 힘이 얇아서, 곁에 사람이 없으면 금세 흔들려요.",
  식상: "하고 싶은 말을 안에 두고 삼켜요. 표현이 늦어 오해를 사는 일이 잦아요.",
  재성: "눈앞의 돈과 결과를 챙기는 데 서툴러요. 해 놓은 것에 비해 받는 것이 적어요.",
  관성: "스스로를 매어 두는 틀이 약해요. 마감과 규칙이 없으면 끝까지 가기 어려워요.",
  인성: "충분히 알기 전에 몸이 먼저 나가요. 배워 두면 될 것을 겪으며 배워요.",
};

/** 자리별로 드러나는 모습 */
const SEAT_FACE: Record<TenGod, { 안: string; 밖: string }> = {
  비견: { 안: "가까운 사이에서도 각자의 몫을 분명히 나눠요", 밖: "줄 서는 자리보다 제 간판을 걸고 싶어 해요" },
  겁재: { 안: "가까운 사람에게 쓰는 돈과 마음을 아끼지 못해요", 밖: "사람과 돈이 함께 얽히는 일에 자주 들어가요" },
  식신: { 안: "편한 사람 앞에서는 말이 많아지고 잘 먹고 잘 웃어요", 밖: "만들어 내는 일에서 인정을 받아요" },
  상관: { 안: "아니라고 느끼면 가까운 사이에도 그대로 말해요", 밖: "윗사람의 방식에 한 번은 부딪쳐요" },
  편재: { 안: "집 안의 일도 크게 벌이고 넉넉하게 써요", 밖: "기회가 보이면 판을 넓히는 쪽을 골라요" },
  정재: { 안: "살림과 약속을 꼼꼼히 지켜요", 밖: "맡은 범위 안에서 어김없이 해내는 사람으로 통해요" },
  편관: { 안: "가까운 사이에서도 긴장을 놓지 못해요", 밖: "버거운 일을 맡고도 해내며, 평가가 갈려요" },
  정관: { 안: "집에서도 역할과 도리를 먼저 생각해요", 밖: "자리와 이름이 붙는 곳에서 힘이 실려요" },
  편인: { 안: "혼자 있는 시간이 있어야 숨이 쉬어져요", 밖: "남들이 안 보는 쪽을 파고들어 자기 영역을 만들어요" },
  정인: { 안: "가까운 사람에게 기대고, 또 기대게 해요", 밖: "배우고 가르치는 자리에서 오래 가요" },
};

/** 치우친 기운이 만드는 그늘 */
const SHADOW: Record<Element, string> = {
  목: "일을 벌여 놓고 수습이 뒤따라오지 않아요. 조급해질 때 가장 크게 손해를 봐요.",
  화: "감정이 앞서 말이 먼저 나가요. 지나고 나서 그 말 한마디가 오래 남아요.",
  토: "한번 정한 것을 바꾸기 어려워요. 버티는 힘이 고집으로 바뀌는 자리가 있어요.",
  금: "선을 긋고 끊어 내요. 맞는 말인데 차갑게 전해져 사람이 멀어지기도 해요.",
  수: "생각이 길어져 시작이 늦어요. 재는 사이에 때가 지나가요.",
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
  핵심풀이: Array<{ 주제: string; 결론: string; 근거: string[]; 모습: string; 이면: string }>;
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

  // 단일 글자 사전만으로 끝내지 않고, 반복되는 자리와 서로 다른 십성의 결합을 읽는다.
  // 이름·생일에 대한 예외 없이 모든 명식에 같은 규칙을 적용한다.
  const positions = (["year", "month", "day", "hour"] as const).flatMap(slot => {
    const p = pillars[slot];
    if (!p) return [];
    const name = { year: "년", month: "월", day: "일", hour: "시" }[slot];
    return [
      ...(slot === "day" ? [] : [{ label: `${name}간 ${p.stem}`, god: tenGod(dayStem, p.stem as Stem) }]),
      { label: `${name}지 ${p.branch}`, god: branchTenGod(dayStem, p.branch as Branch) },
    ];
  });
  const resources = positions.filter(p => GROUP_OF[p.god] === "인성");
  const outputs = positions.filter(p => GROUP_OF[p.god] === "식상");
  const evidence = (items: typeof positions) => items.map(p => `${p.label} ${p.god}`);
  const core: Character["핵심풀이"] = [];
  if (resources.length >= 2) {
    core.push({ 주제: "이해와 판단", 결론: "이유를 납득해야 움직이고, 충분히 이해한 뒤 자기 기준을 세우는 성향입니다.",
      근거: evidence(resources), 모습: "단순히 외우라는 말보다 원리와 이유가 설명될 때 깊이 파고드는 방식으로 읽습니다. 조용히 듣는 것과 생각이 없는 것은 다릅니다.",
      이면: "확실히 이해하거나 준비하기 전에는 시작과 표현을 미루기 쉽습니다. 충분히 아는 것과 일단 시도해 보는 것 사이의 균형이 중요합니다." });
    core.push({ 주제: "몰입과 완벽주의", 결론: "스스로 납득한 주제는 끝까지 파고들되, 작은 흠을 그냥 넘기기 어려운 성향입니다.",
      근거: evidence(resources), 모습: "예를 들어 한 문제의 원리가 풀릴 때까지 붙들거나, 이미 만든 결과물을 자기 기준에 맞게 여러 번 다듬는 모습으로 읽습니다.",
      이면: "잘하고 싶은 마음이 결과를 내놓는 일을 늦출 수 있습니다. 끈기를 살리면서 중간 결과도 보여 줄 수 있는 환경이 잘 맞습니다." });
    if (outputs.length) core.push({ 주제: "창의성과 표현", 결론: "배운 지식을 연결하고 응용해 새로운 해결책을 만드는 창의성으로 읽습니다.",
      근거: evidence([...resources, ...outputs]), 모습: "설명서의 원리를 이해한 뒤 더 튼튼한 구조를 만들거나, 익힌 방법들을 비교해 자기 방식으로 개선하는 모습이 어울립니다.",
      이면: "머릿속에서 충분히 정리되지 않은 생각은 밖으로 꺼내기 주저할 수 있습니다. 설명과 시연처럼 익힌 것을 표현할 기회가 중요합니다." });
  } else if (outputs.length >= 2) {
    core.push({ 주제: "표현과 시도", 결론: "생각을 말이나 결과물로 꺼내 보면서 자기 방식을 찾는 성향입니다.",
      근거: evidence(outputs), 모습: "충분히 준비한 뒤 시작하기보다 직접 해 보고 반응을 얻으며 개선하는 방향으로 읽습니다.",
      이면: "떠오른 것을 모두 시작하면 마무리가 뒤로 밀릴 수 있습니다. 새 시도를 이어 가되 하나를 완성해 볼 기회도 필요합니다." });
  }
  if (element === "수" && polarity === "음" && resources.length >= 2) core.push({
    주제: "겉과 속", 결론: "겉으로는 차분하고 유연해 보여도, 속에는 쉽게 바뀌지 않는 자기 기준이 있는 성향입니다.",
    근거: [`일간 ${dayStem}`, ...evidence(resources)], 모습: "낯선 자리에서는 먼저 관찰하고, 가까운 사이에서는 자신이 납득한 이유를 분명하게 지키는 쪽으로 읽습니다.",
    이면: "기준을 설명할 시간을 주지 않고 밀어붙이면 고집처럼 드러날 수 있습니다. 무엇이 불편한지 이유부터 듣는 대화가 잘 맞습니다.",
  });
  if (resources.length >= 2 && positions.some(p => GROUP_OF[p.god] === "재성")) core.push({
    주제: "전문성과 진로", 결론: "지식을 깊이 쌓고, 자격과 전문성을 실제 일의 결과로 연결하는 방향이 잘 맞는 사주입니다.",
    근거: evidence(positions.filter(p => ["인성", "재성"].includes(GROUP_OF[p.god]))),
    모습: element === "수"
      ? "금이 물을 돕는 인성과 재성의 조합은 정밀하게 분석하고 실제 문제를 해결하는 전문직의 모습에 연결해 읽습니다. 의료·보건, 생명·자연과학 연구, 금융·회계 분야를 서로 다른 진로 후보로 살펴볼 수 있습니다."
      : "배워서 익힌 것을 실제 문제 해결과 결과로 연결하는 모습입니다. 연구·교육, 전문 자격을 사용하는 업무, 자료를 분석하고 운영을 개선하는 일을 진로 후보로 살펴볼 수 있습니다.",
    이면: "자격을 얻는 과정과 실제 현장의 일을 모두 경험해 보아야 합니다. 사주만으로 특정 직업의 성공이나 진학 가능성을 보장하는 해석은 아닙니다.",
  });

  return {
    바탕: BASE[element][polarity],
    힘: FORCE[strength],
    드러나는쪽: { 이름: top, 모습: GROUP_STRONG[top] },
    모자란쪽: { 이름: bottom, 모습: GROUP_WEAK[bottom] },
    안에서: SEAT_FACE[branchTenGod(dayStem, dayBranch)].안,
    밖에서: SEAT_FACE[branchTenGod(dayStem, monthBranch)].밖,
    그늘: heavy ? SHADOW[heavy.element] : null,
    비는기운: empty
      ? `${empty.element} 쪽이 비어 있어서, 그 자리의 일은 타고난 것으로 되지 않고 배워서 채워야 해요.`
      : null,
    핵심풀이: core,
  };
}

// 음양 표기를 지지에서도 쓰므로 함께 내보낸다 (성격 판정에 일지 음양을 쓰는 곳이 있다)
export { BRANCH_POLARITY };
