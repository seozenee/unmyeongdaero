// 건강 — 어느 자리가 먼저 지치는가.
//
// 건강사주도 재물운 사주와 같은 처지였다. 몸에 대한 계산 없이 원국 한 벌만 넘어갔다.
//
// 명리에서 몸을 보는 길은 둘이다.
//   · 치우침   오행마다 맡은 장부가 있다. 한쪽이 넘치면 과열로, 비면 부족으로 신호가 온다.
//   · 부딪힘   지지끼리 충·형이 걸린 자리는 무리가 쌓일 때 가장 먼저 반응한다.
//
// 병명을 적지 않는다. 우리는 의사가 아니고 명식으로 병을 진단할 수도 없다.
// "어디가 먼저 지치는지" 와 "무엇을 줄이면 되는지" 까지만 말한다.
import type { FourPillars } from "./pillars";
import { computeNatalRelations } from "./relations";
import { countElementsWithHidden, type Strength } from "./strength";
import { HIDDEN_STEMS, STEM_ELEMENT, type Branch, type Element, type Stem } from "./tables";

/** 오행이 맡은 자리. 병명이 아니라 "어디가 먼저 반응하는가" 다 */
const ORGAN: Record<Element, { 자리: string; 넘칠때: string; 빌때: string; 돌봄: string }> = {
  목: {
    자리: "간과 쓸개, 그리고 눈과 근육",
    넘칠때: "쉬어야 할 때 못 쉬고 밀어붙여서, 눈이 먼저 뻑뻑해지고 어깨와 목이 굳어요",
    빌때: "결정을 미루다 피로가 쌓이고, 아침에 몸이 무겁게 시작돼요",
    돌봄: "자는 시간을 일정하게 두고, 저녁에 눈을 쓰는 일을 줄이세요",
  },
  화: {
    자리: "심장과 작은창자, 그리고 잠과 마음",
    넘칠때: "생각이 꺼지지 않아 잠자리에 누워도 머리가 돌고, 가슴이 답답해져요",
    빌때: "의욕이 먼저 식고 손발이 차며, 사람 만나는 일이 버거워져요",
    돌봄: "잠들기 두 시간 전에 화면을 끄고, 낮에 햇빛을 보는 시간을 만드세요",
  },
  토: {
    자리: "비위와 소화, 그리고 살과 생각의 무게",
    넘칠때: "고민을 끌어안고 있다가 속이 먼저 더부룩해지고, 끼니가 불규칙해져요",
    빌때: "먹는 것에서 힘이 안 나고, 체중과 기력이 함께 흔들려요",
    돌봄: "끼니 시간을 정해 두고, 생각이 길어질 때 자리에서 일어나 걸으세요",
  },
  금: {
    자리: "폐와 대장, 그리고 피부와 호흡",
    넘칠때: "긴장을 안으로 눌러 두어 숨이 얕아지고, 환절기마다 목과 피부가 먼저 상해요",
    빌때: "숨이 짧고 쉽게 지치며, 찬 기운에 유난히 약해져요",
    돌봄: "하루 한 번 깊게 숨 쉬는 시간을 두고, 건조한 곳을 오래 피하세요",
  },
  수: {
    자리: "신장과 방광, 그리고 허리와 기본 체력",
    넘칠때: "쉬지 않고 돌리다 허리와 무릎이 먼저 신호를 보내고, 밤에 자주 깨요",
    빌때: "바탕 체력이 얇아 무리한 다음 날 회복이 더뎌요",
    돌봄: "물을 자주 나눠 마시고, 허리를 쓰는 일 사이에 쉬는 틈을 넣으세요",
  },
};

export interface HealthReading {
  balance: { note: string };
  dayMasterFoundation: { note: string };
  organs: Array<{ element: Element; 자리: string; signalNote: string }>;
  vulnerabilities: Array<{
    element: Element;
    mechanism: string;
    note: string;
    natalPresence: { note: string };
  }>;
  branchTensions: Array<{ pair: string; note: string }>;
}

const FOUNDATION: Record<Strength, string> = {
  신강: "바탕 체력은 넉넉한 편이에요. 탈이 나는 건 약해서가 아니라, 버틸 수 있으니 계속 버티다가 한 번에 무너지기 때문이에요.",
  중화: "크게 치우치지 않은 바탕이에요. 무리한 만큼 돌아오고, 쉰 만큼 회복됩니다 — 리듬만 지키면 됩니다.",
  신약: "바탕이 얇은 편이라 환경과 사람에 많이 좌우돼요. 혼자 다 떠안는 방식이 몸에서 가장 먼저 값을 치릅니다.",
};

export function readHealth(pillars: FourPillars, strength: Strength): HealthReading {
  const counts = countElementsWithHidden(pillars);
  const total = counts.reduce((sum, row) => sum + row.total, 0) || 1;

  const heavy = counts.filter((row) => row.total / total >= 0.32);
  const thin = counts.filter((row) => row.total === 0 || row.total / total <= 0.08);

  const vulnerabilities = [
    ...heavy.map((row) => ({
      element: row.element,
      mechanism: `${ORGAN[row.element].자리} 쪽으로 기운이 몰려 있어요`,
      note: ORGAN[row.element].넘칠때,
      natalPresence: { note: `여덟 글자 가운데 ${row.total}자리가 이 기운이에요.` },
    })),
    ...thin.map((row) => ({
      element: row.element,
      mechanism: `${ORGAN[row.element].자리} 쪽이 얇아요`,
      note: ORGAN[row.element].빌때,
      natalPresence: { note: row.total === 0 ? "이 기운이 비어 있어요." : "이 기운이 거의 없어요." },
    })),
  ];

  // 지지끼리 부딪히는 자리 — 무리가 쌓일 때 먼저 신호가 온다
  const natal = computeNatalRelations(pillars);
  const clashes = natal.relations.filter((relation) => ["충", "형", "자형", "파", "해"].includes(relation.type));
  const branchTensions = clashes.slice(0, 3).map((relation) => {
    const element = STEM_ELEMENT[HIDDEN_STEMS[relation.source as Branch]?.at(-1) ?? ("무" as Stem)];
    return {
      pair: `${relation.sourcePosition}·${relation.targetPosition}`,
      note: `${ORGAN[element].자리} 쪽에 무리가 쌓이기 쉬워요. ${ORGAN[element].돌봄}`,
    };
  });

  return {
    balance: {
      note:
        heavy.length > 0
          ? `${heavy.map((row) => row.element).join("·")} 쪽으로 몰려 있고${
              thin.length > 0 ? `, ${thin.map((row) => row.element).join("·")} 쪽이 얇아요` : ""
            }. 몰린 쪽은 알아서 굴러가고, 얇은 쪽은 일부러 채워야 굴러가요.`
          : "크게 치우친 쪽이 없어요. 몸의 신호는 타고난 기울기보다 생활 습관에서 먼저 옵니다.",
    },
    dayMasterFoundation: { note: FOUNDATION[strength] },
    organs: counts.map((row) => ({
      element: row.element,
      자리: ORGAN[row.element].자리,
      signalNote:
        row.total / total >= 0.32
          ? ORGAN[row.element].넘칠때
          : row.total === 0
            ? ORGAN[row.element].빌때
            : "지금은 특별히 먼저 신호가 오는 자리는 아니에요.",
    })),
    vulnerabilities,
    branchTensions,
  };
}
