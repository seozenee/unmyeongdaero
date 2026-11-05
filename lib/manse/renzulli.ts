import { parseGanji } from "../saju/ganji";
import type { FourPillarsInput } from "../saju/modules";
import { branchTenGod, tenGod, type Branch, type Stem } from "./tables";

export const RENZULLI_SOURCE = "https://gifted.uconn.edu/schoolwide-enrichment-model/three-ring_conception_of_giftedness/";
export const RENZULLI_VERSION = "three-rings-interpretation-v1";
const GROUP = { 정인: "resource", 편인: "resource", 식신: "output", 상관: "output", 정관: "authority", 편관: "authority", 비견: "peer", 겁재: "peer", 정재: "wealth", 편재: "wealth" } as const;
type Group = typeof GROUP[keyof typeof GROUP];
const GROUP_NAMES: Record<Group, string> = { resource: "인성", output: "식상", authority: "관성", peer: "비겁", wealth: "재성" };
// 서비스 자체의 설명용 가중치. 렌줄리의 검사 규준·확률·백분위가 아니다.
const POSITION = { year: 0.8, month: 1.5, day: 1.2, hour: 0.8 } as const;
const AXES = [
  { id: "ability", label: "학습·이해", ring: "평균 이상의 능력", weights: { resource: 0.6, output: 0.2, authority: 0.1, peer: 0.05, wealth: 0.05 },
    question: "익힌 원리를 새로운 문제에 적용하고, 풀이의 이유를 자기 말로 설명하나요?",
    activity: "같은 원리를 쓰되 모양이 다른 문제 두 개를 주고, 무엇이 같고 다른지 설명하도록 해 주세요." },
  { id: "creativity", label: "창의성", ring: "창의성", weights: { resource: 0.25, output: 0.5, authority: 0.05, peer: 0.15, wealth: 0.05 },
    question: "한 가지 답에 그치지 않고 다른 방법을 만들거나 배운 것을 새롭게 조합하나요?",
    activity: "만든 결과물을 보여 달라고 한 뒤, 재료나 조건 하나를 바꾸면 어떻게 달라질지 함께 이야기해 보세요." },
  { id: "commitment", label: "과제 집착력", ring: "과제 집착력", weights: { resource: 0.35, output: 0.05, authority: 0.35, peer: 0.2, wealth: 0.05 },
    question: "스스로 고른 과제에서 막힌 지점을 고쳐 가며 결과물을 완성하려고 하나요?",
    activity: "아이가 고른 작은 프로젝트를 며칠에 걸쳐 이어 가게 하고, 중간에 방법을 바꾸거나 도움을 구하는 과정도 살펴보세요." },
] as const;

/** 렌줄리의 세 관점에 명리의 설명 재료를 연결한다. 영재 판정은 하지 않는다. */
export function buildRenzulliReading(pillars: FourPillarsInput) {
  const day = parseGanji(pillars.day);
  if (!day) return null;
  const dayStem = day.stem.ko as Stem;
  const positions = (Object.keys(POSITION) as Array<keyof typeof POSITION>).flatMap(slot => {
    const parsed = pillars[slot] ? parseGanji(pillars[slot]!) : null;
    if (!parsed) return [];
    const label = { year: "년", month: "월", day: "일", hour: "시" }[slot];
    return [
      ...(slot === "day" ? [] : [{ god: tenGod(dayStem, parsed.stem.ko as Stem), label: `${label}간 ${parsed.stem.ko}`, weight: POSITION[slot] }]),
      { god: branchTenGod(dayStem, parsed.branch.ko as Branch), label: `${label}지 ${parsed.branch.ko} 본기`, weight: POSITION[slot] },
    ].map(item => ({ ...item, group: GROUP[item.god as keyof typeof GROUP] }));
  });
  const totals: Record<Group, number> = { resource: 0, output: 0, authority: 0, peer: 0, wealth: 0 };
  for (const item of positions) totals[item.group] += item.weight;
  const total = Object.values(totals).reduce((a, b) => a + b, 0);
  const groups = Object.entries(totals).map(([key, value]) => ({ key: key as Group, label: GROUP_NAMES[key as Group], share: value / total }));
  const dimensions = AXES.map(axis => {
    const contributions = groups.map(group => ({ ...group, contribution: group.share * axis.weights[group.key] }));
    // 0~100은 해당 관점에 연결한 명리 근거의 비중. 균등 분포는 각 축 20.
    const index = Math.round(contributions.reduce((sum, item) => sum + item.contribution, 0) * 100);
    const basis = positions.filter(item => axis.weights[item.group] >= 0.2).map(item => `${item.label} ${item.god}`);
    return { id: axis.id, label: axis.label, ring: axis.ring, index, basis,
      weights: axis.weights, question: axis.question, activity: axis.activity };
  });
  const resource = positions.filter(p => p.group === "resource");
  const output = positions.filter(p => p.group === "output");
  return {
    version: RENZULLI_VERSION,
    framework: "렌줄리의 세 고리 모형을 참고한 사주 해석",
    source: RENZULLI_SOURCE,
    scope: "세 고리의 상호작용을 관찰하는 설명 틀입니다. 숫자는 서비스 자체의 명리 근거 비중이며, 렌줄리 검사 점수·지능·영재 확률이 아닙니다. 평균 이상의 능력 여부는 실제 수행 자료로 확인해야 합니다.",
    method: "일간 자신은 제외. 년 0.8·월 1.5·일 1.2·시 0.8의 자리 가중치로 천간과 지지 본기의 십성을 집계한 뒤, 십성 비중 × 각 축의 연결 가중치의 합 × 100. 지장간을 중복 합산하지 않습니다.",
    dimensions, groups, positions,
    unknownHour: !pillars.hour,
    learningStyle: resource.length >= 2 ? "원리를 이해하고 연결하는 탐구형" : output.length >= 2 ? "직접 만들고 설명하며 익히는 표현형" : "목표와 과정을 나누어 익히는 경험형",
    synthesis: resource.length >= 2 && output.length
      ? "이해하고 쌓는 인성과 밖으로 꺼내는 식상이 함께 있습니다. 배운 원리를 새 문제에 적용하는 방식으로 학습과 창의성을 연결해 읽습니다."
      : output.length >= 2
        ? "밖으로 표현하는 식상이 여러 자리에 있습니다. 먼저 만들고 설명한 뒤 부족한 지식을 보충하는 과정에서 세 고리를 연결해 읽습니다."
        : "하나의 기운으로 재능을 판정하기보다, 익히는 과정·다르게 시도하는 과정·끝맺는 과정을 나누어 살펴봅니다.",
  };
}
export type RenzulliReading = NonNullable<ReturnType<typeof buildRenzulliReading>>;
