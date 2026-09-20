// 격국과 용신 — 사주의 틀과, 그 틀에 필요한 기운.
//
// 격국은 "이 사람이 무엇을 중심으로 돌아가는가"를 월지에서 읽는다. 월지는 태어난 계절이라
// 원국에서 가장 힘이 센 자리이기 때문이다.
//
// 용신은 "그래서 무엇이 필요한가"다. 여기서는 억부(신강하면 덜고, 신약하면 채운다)를
// 기본으로 삼고, 조후(추우면 불, 더우면 물)를 함께 본 뒤 둘이 갈리면 억부를 택한다.
// 용신이 정해지면 나머지 넷(희신·기신·구신·한신)은 오행의 생극에서 자동으로 따라 나온다.
import {
  GENERATES,
  HIDDEN_STEMS,
  OVERCOMES,
  STEM_ELEMENT,
  branchTenGod,
  tenGod,
  twelveStage,
  type Branch,
  type Element,
  type Stem,
  type TenGod,
} from "./tables";
import type { FourPillars } from "./pillars";
import type { Strength } from "./strength";

const ELEMENTS: readonly Element[] = ["목", "화", "토", "금", "수"];

const generatorOf = (element: Element) => ELEMENTS.find((candidate) => GENERATES[candidate] === element)!;
const overcomerOf = (element: Element) => ELEMENTS.find((candidate) => OVERCOMES[candidate] === element)!;

// ─── 격국 ────────────────────────────────────────────────────────────────────

export interface Gyeokguk {
  name: string;
  /** 격을 정한 근거 한 문장 */
  reasoning: string;
  /** 격을 이루는 십성. 건록격·양인격은 십성으로 부르지 않으므로 null */
  tenGod: TenGod | null;
  /** 월지 지장간이 천간에 드러났는지 */
  transparency: { stem: Stem; position: string; tenGod: TenGod } | null;
}

/** 월지의 지장간 가운데 천간(년·월·시)에 드러난 것을 찾는다. 정기부터 본다 */
function findTransparency(pillars: FourPillars): { stem: Stem; position: string } | null {
  const monthBranch = pillars.month.branch as Branch;
  const visible: { stem: Stem; position: string }[] = [
    { stem: pillars.month.stem as Stem, position: "월간" },
    { stem: pillars.year.stem as Stem, position: "년간" },
    ...(pillars.hour ? [{ stem: pillars.hour.stem as Stem, position: "시간" }] : []),
  ];
  // 지장간은 여기·중기·정기 순으로 들어 있다 — 정기(마지막)부터 찾는다
  for (const hidden of [...HIDDEN_STEMS[monthBranch]].reverse()) {
    const found = visible.find((entry) => entry.stem === hidden);
    if (found) return found;
  }
  return null;
}

export function computeGyeokguk(pillars: FourPillars): Gyeokguk {
  const dayStem = pillars.day.stem as Stem;
  const monthBranch = pillars.month.branch as Branch;
  const stage = twelveStage(dayStem, monthBranch);

  // 월지가 일간의 건록·제왕 자리면 격을 십성으로 부르지 않는다.
  // 제 계절에 태어나 스스로 서 있는 구조이기 때문이다.
  if (stage === "건록") {
    return {
      name: "건록격",
      reasoning: `월지 ${monthBranch}는 일간 ${dayStem}의 건록 자리라, 남의 힘을 빌리지 않고 제 몫을 하는 틀이다`,
      tenGod: null,
      transparency: null,
    };
  }
  if (stage === "제왕") {
    return {
      name: "양인격",
      reasoning: `월지 ${monthBranch}는 일간 ${dayStem}의 제왕 자리라, 힘이 가장 센 대신 한쪽으로 치우치기도 쉬운 틀이다`,
      tenGod: null,
      transparency: null,
    };
  }

  const transparent = findTransparency(pillars);
  if (transparent) {
    const god = tenGod(dayStem, transparent.stem);
    // 비겁이 투간했다면 격으로 세우지 않고 월지 정기로 돌아간다
    if (god !== "비견" && god !== "겁재") {
      return {
        name: `${god}격`,
        reasoning: `월지 ${monthBranch}에 숨은 ${transparent.stem}이 ${transparent.position}에 드러나 ${god}으로 격을 이룬다`,
        tenGod: god,
        transparency: { stem: transparent.stem, position: transparent.position, tenGod: god },
      };
    }
  }

  const god = branchTenGod(dayStem, monthBranch);
  if (god === "비견" || god === "겁재") {
    return {
      name: "월겁격",
      reasoning: `월지 ${monthBranch}가 일간과 같은 기운이라, 제 힘으로 버티는 틀이다`,
      tenGod: null,
      transparency: null,
    };
  }
  return {
    name: `${god}격`,
    reasoning: `천간에 드러난 글자가 없어 월지 ${monthBranch}의 정기로 ${god}격을 삼는다`,
    tenGod: god,
    transparency: null,
  };
}

// ─── 용신 ────────────────────────────────────────────────────────────────────

export interface Yongsin {
  /** 가장 필요한 기운 */
  yongsin: { ko: Element };
  /** 용신을 생해 주는 기운 */
  huisin: { ko: Element };
  /** 용신을 극하는 기운 — 흐름이 꼬이기 쉬운 쪽 */
  gisin: { ko: Element };
  /** 기신을 생하는 기운 */
  gusin: { ko: Element };
  /** 어느 쪽도 아닌 기운 */
  hansin: { ko: Element };
  /** 억부로 본 기운 */
  eokbu: { ko: Element; method: string };
  /** 조후로 본 기운. 계절이 치우치지 않으면 null */
  johu: { ko: Element } | null;
  /** 용신을 어느 쪽으로 정했는지 */
  method: "억부";
  reasoning: string;
}

/** 조후 — 추운 계절에 태어났으면 불이, 더운 계절이면 물이 필요하다 */
function johuElement(monthBranch: Branch): { element: Element; season: string } | null {
  if (["해", "자", "축"].includes(monthBranch)) return { element: "화", season: "겨울" };
  if (["사", "오", "미"].includes(monthBranch)) return { element: "수", season: "여름" };
  return null;
}

export function computeYongsin(pillars: FourPillars, strength: Strength): Yongsin {
  const me = STEM_ELEMENT[pillars.day.stem as Stem];
  const monthBranch = pillars.month.branch as Branch;

  const output = GENERATES[me]; // 식상 — 내가 내보내는 것
  const resource = generatorOf(me); // 인성 — 나를 돕는 것
  const officer = overcomerOf(me); // 관성 — 나를 누르는 것

  // 억부 — 넘치면 덜어 내고, 모자라면 채운다
  const eokbu =
    strength === "신강"
      ? { element: output, method: "설기", note: `힘이 넉넉하니 ${me}이 생하는 ${output}으로 덜어 낸다` }
      : strength === "신약"
        ? { element: resource, method: "생조", note: `힘이 모자라니 ${me}을 생하는 ${resource}으로 채운다` }
        : { element: output, method: "설기", note: `치우침이 크지 않아 ${output}으로 흐름을 트는 쪽을 본다` };

  const johu = johuElement(monthBranch);

  // 둘이 같으면 이견이 없고, 갈리면 억부를 택한다 — 타고난 균형이 계절보다 먼저다
  const agreed = johu !== null && johu.element === eokbu.element;
  const chosen = eokbu.element;
  const reasoning = `${strength} → ${eokbu.note}.${
    johu
      ? agreed
        ? ` ${johu.season}에 태어나 필요한 ${johu.element}과도 같은 방향이다.`
        : ` ${johu.season}생이라 조후로는 ${johu.element}이 필요하지만, 억부를 앞세워 ${chosen}으로 잡는다.`
      : ""
  }`;

  const gisin = overcomerOf(chosen);
  return {
    yongsin: { ko: chosen },
    huisin: { ko: generatorOf(chosen) },
    gisin: { ko: gisin },
    gusin: { ko: generatorOf(gisin) },
    hansin: { ko: ELEMENTS.find((element) => ![chosen, generatorOf(chosen), gisin, generatorOf(gisin)].includes(element))! },
    eokbu: { ko: eokbu.element, method: eokbu.method },
    johu: johu ? { ko: johu.element } : null,
    // 조후와 갈릴 때도 억부를 앞세우므로 채택 방식은 늘 억부다.
    // 조후가 무엇을 가리켰는지는 johu 와 reasoning 에 남겨 둔다.
    method: "억부",
    reasoning,
  };
}

/** 오행이 생활에서 어떤 결로 쓰이는지 — 용신을 행동으로 옮길 때 쓴다 */
export const ELEMENT_USAGE: Record<Element, string> = {
  목: "새로 배우기, 계획 세우기, 몸을 쓰는 운동, 초록이 있는 곳",
  화: "사람을 만나 이야기하기, 드러내 보이기, 햇빛 아래 걷기",
  토: "정리하고 쌓아 두기, 한자리를 지키기, 꾸준한 습관 만들기",
  금: "매듭짓기, 규칙을 정하기, 필요 없는 것을 덜어 내기",
  수: "혼자 생각을 정리하기, 읽고 쓰기, 충분히 자고 쉬기",
};
