// 재물 — 돈이 어느 자리로 들어오고 어디로 새는가.
//
// 재물운 사주를 팔면서 재물에 대한 계산을 따로 하지 않고 있었다. 모델에게 넘어가는
// 것은 다른 상품과 똑같은 원국 한 벌이었고, 그래서 재물운 사주의 글이 평생사주와
// 비슷해졌다. 상품만 다르고 재료가 같으면 글도 같아진다.
//
// 명리에서 돈을 보는 자리는 정해져 있다.
//   · 재성   일간이 극하는 오행. 내가 다루어 손에 쥐는 것.
//   · 비겁   나와 같은 오행. 같은 것을 노리는 쪽이라, 재성보다 많으면 돈이 샌다(탈재).
//   · 식상   내가 내보내는 오행. 재성을 낳으므로, 있으면 만들어서 번다(식상생재).
//   · 그릇   신강이면 들어온 것을 감당하고, 신약이면 들어와도 흘린다.
//   · 재고   진술축미 가운데 재성이 묻히는 자리. 모아 두는 창고로 본다.
import type { FourPillars } from "./pillars";
import type { Strength } from "./strength";
import {
  GENERATES,
  HIDDEN_STEMS,
  OVERCOMES,
  STEM_ELEMENT,
  type Branch,
  type Element,
  type Stem,
} from "./tables";

/** 오행이 묻히는 자리(묘고). 재성의 묘고가 원국에 있으면 모아 두는 힘으로 본다 */
const GRAVE: Record<Element, Branch> = { 목: "미", 화: "술", 토: "진", 금: "축", 수: "진" };

export interface WealthLayer {
  /** 열 해 흐름 · 그해 흐름 · 그달 흐름 */
  label: string;
  ganji: string;
  /** 재성이 들어오는 때인가 */
  favorable: boolean;
  priority: number;
  note: string;
}

export interface WealthReading {
  /** 재물을 뜻하는 기운 */
  element: Element;
  natalWealth: {
    /** 원국에 재성이 몇 자리인가 (지장간은 절반으로 센다) */
    count: number;
    /** 비겁이 재성보다 많은가 — 사람을 통해 새기 쉬운 구조 */
    talJaeRisk: boolean;
    bigyeop: number;
    /** 식상이 받쳐 주는가 — 만들어서 버는 구조 */
    siksangSupport: boolean;
    /** 모아 두는 창고가 있는가 */
    hasVault: boolean;
    note: string;
  };
  carryCapacity: {
    canCarry: boolean;
    note: string;
  };
  fortuneLayers: WealthLayer[];
  prose: string;
}

/** 지장간까지 포함해 그 오행이 원국에 몇 자리인지 센다 */
function countElement(pillars: FourPillars, target: Element) {
  const slots = [pillars.year, pillars.month, pillars.day, pillars.hour].filter(Boolean) as FourPillars["year"][];
  let count = 0;
  for (const pillar of slots) {
    if (STEM_ELEMENT[pillar.stem as Stem] === target) count += 1;
    const hidden = HIDDEN_STEMS[pillar.branch as Branch];
    // 본기는 온전히, 나머지 숨은 글자는 절반으로
    if (STEM_ELEMENT[hidden.at(-1)!] === target) count += 1;
    for (const other of hidden.slice(0, -1)) {
      if (STEM_ELEMENT[other] === target) count += 0.5;
    }
  }
  return count;
}

export interface WealthInput {
  pillars: FourPillars;
  strength: Strength;
  /** 들어오는 운 — 열 해 · 그해 · 그달 순서대로 */
  incoming: ReadonlyArray<{ label: string; ganji: string }>;
}

export function readWealth(input: WealthInput): WealthReading {
  const me = STEM_ELEMENT[input.pillars.day.stem as Stem];
  const element = OVERCOMES[me]; // 내가 극하는 것이 재물이다
  const output = GENERATES[me]; // 내가 내보내는 것 — 재물을 낳는다

  const wealth = countElement(input.pillars, element);
  const bigyeop = countElement(input.pillars, me);
  const siksang = countElement(input.pillars, output);

  const branches = [input.pillars.year, input.pillars.month, input.pillars.day, input.pillars.hour]
    .filter(Boolean)
    .map((pillar) => pillar!.branch as Branch);
  const hasVault = branches.includes(GRAVE[element]);

  const talJaeRisk = bigyeop > wealth;
  const canCarry = input.strength === "신강";

  const fortuneLayers = input.incoming.map((item, index) => {
    const stem = item.ganji[0] as Stem;
    const branch = item.ganji[1] as Branch;
    const favorable =
      STEM_ELEMENT[stem] === element || STEM_ELEMENT[HIDDEN_STEMS[branch].at(-1)!] === element;
    return {
      label: item.label,
      ganji: item.ganji,
      favorable,
      priority: index + 1,
      note: favorable
        ? "재물과 거래를 뜻하는 글자가 들어와요. 보상·거래 조건을 살펴보는 시기로 읽어요. 실제 수익이 생긴다는 보장은 아니에요."
        : "재물별이 직접 드는 시기는 아니에요. 이것만으로 수입이 줄거나 새 일을 피해야 한다고 판정하지 않아요.",
    };
  });

  return {
    element,
    natalWealth: {
      count: wealth,
      talJaeRisk,
      bigyeop,
      siksangSupport: siksang >= 1,
      hasVault,
      note: [
        wealth === 0
          ? "타고난 재물 자리가 드러나지 않아요. 돈이 없다는 뜻이 아니라, 들어오는 길을 스스로 만들어야 한다는 뜻이에요."
          : `재물 자리가 ${wealth}곳이에요.`,
        talJaeRisk
          ? "자기 몫·동료를 뜻하는 자리가 재물 자리보다 두터워요. 함께 일할 때 몫과 책임을 어떻게 나누는지가 해석의 초점이에요. 실제 손실 이력을 뜻하지는 않아요."
          : "재물 자리가 비교적 드러나 있어요. 얻는 몫과 거래 조건에 관심을 두는 구조로 읽되, 실제 저축액을 알 수는 없어요.",
        siksang >= 1
          ? "표현·제작을 뜻하는 자리도 있어요. 만든 것을 제공하고 거래로 잇는 방식과 연결해서 읽어요."
          : "겉으로 드러난 표현·제작의 자리가 적어요. 수익 구조를 볼 때 다른 사람과의 역할 분담도 함께 살펴야 해요.",
        hasVault ? "전통적으로 재물의 창고로 보는 지지가 있어요. 실제로 돈을 잘 모은다고 단정하는 근거는 아니에요." : null,
      ]
        .filter(Boolean)
        .join(" "),
    },
    carryCapacity: {
      canCarry,
      note: canCarry
        ? "자기 기운을 받치는 자리가 갖춰져 있어요. 주도권을 갖는 해석에 힘이 실리지만, 실제 자금 규모나 위험 감당 능력을 뜻하지는 않아요."
        : "신강의 기준을 모두 충족한 명식은 아니에요. 지원과 맡는 범위를 함께 읽어야 하며, 재산의 한계나 돈을 잃는다는 뜻은 아니에요.",
    },
    fortuneLayers,
    prose: `${talJaeRisk ? "동료·자기 몫과 재물의 균형을 함께 보는" : "재물과 거래의 자리가 드러나는"} 구조이고, ${
      canCarry ? "일의 주도권을 어떻게 쓸지 함께 살펴요" : "주변 지원과 역할 분담도 함께 살펴요"
    }.`,
  };
}
