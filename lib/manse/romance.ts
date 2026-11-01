// 연애와 인연 — 누구에게 끌리고, 어디서 어긋나는가.
//
// 연애사주·궁합사주·재회사주가 전부 같은 원국 한 벌만 받고 있었다. 연애를 보는
// 자리가 따로 있는데도 쓰지 않았다.
//
//   · 배우자 자리(일지)  가장 가까운 사이에서 드러나는 내 모습이자, 곁에 오는 사람의 결.
//   · 짝별              남자는 재성, 여자는 관성을 배우자 쪽 별로 본다.
//   · 도화·홍염          사람이 모이고 눈에 띄는 결.
//   · 일지의 합충        그 자리가 묶이는지 흔들리는지 — 관계가 오래가는 결인지 자주 바뀌는 결인지.
import type { FourPillars } from "./pillars";
import { computeNatalRelations } from "./relations";
import {
  HIDDEN_STEMS,
  OVERCOMES,
  SIX_HARMONY,
  STEM_ELEMENT,
  THREE_HARMONY,
  branchTenGod,
  tenGod,
  type Branch,
  type Element,
  type Stem,
  type TenGod,
} from "./tables";

/** 일지에 앉은 십성이 가리키는, 가까운 사이에서의 모습 */
const SEAT: Record<string, { 나: string; 상대: string }> = {
  비견: { 나: "곁에 있어도 각자의 몫을 분명히 나누려 해요", 상대: "기대기보다 나란히 서는 사람이 맞아요" },
  겁재: { 나: "가까운 사람에게 쓰는 마음과 돈을 아끼지 못해요", 상대: "주고받는 셈이 분명한 사람이라야 오래가요" },
  식신: { 나: "편한 사람 앞에서 잘 웃고 잘 먹고 말이 많아져요", 상대: "같이 먹고 노는 결이 맞는 사람에게 끌려요" },
  상관: { 나: "아니라고 느끼면 가까운 사이에도 그대로 말해요", 상대: "말을 받아 줄 줄 아는 사람이라야 부딪히지 않아요" },
  편재: { 나: "크게 베풀고 넓게 만나요", 상대: "활동 범위가 넓은 사람에게 끌리지만, 그만큼 불안도 따라와요" },
  정재: { 나: "약속과 살림을 꼼꼼히 지켜요", 상대: "성실하고 예측되는 사람에게서 안정을 느껴요" },
  편관: { 나: "가까운 사이에서도 긴장을 놓지 못해요", 상대: "끌어주는 힘이 센 사람에게 끌리고, 그 힘에 눌리기도 해요" },
  정관: { 나: "역할과 도리를 먼저 생각해요", 상대: "반듯하고 자리가 분명한 사람과 맞아요" },
  편인: { 나: "혼자 있는 시간이 있어야 숨이 쉬어져요", 상대: "거리를 존중해 주는 사람이라야 숨이 트여요" },
  정인: { 나: "기대고 또 기대게 해요", 상대: "품어 주는 사람에게 끌리지만, 어느새 보호자 노릇을 하게 돼요" },
};

/** 들어오는 글자가 가리키는, 그 해에 닿는 사람의 결 */
const COMER: Record<TenGod, string> = {
  비견: "나와 비슷한 처지의 사람 — 또래거나 같은 일을 하는 쪽",
  겁재: "주고받는 셈이 얽히는 사람 — 돈이나 일이 함께 걸린 쪽",
  식신: "같이 먹고 노는 것이 편한 사람 — 분위기를 풀어 주는 쪽",
  상관: "말이 통하고 재능이 보이는 사람 — 자극을 주지만 부딪히기도 하는 쪽",
  편재: "활동 범위가 넓은 사람 — 밖에서 바쁘고 씀씀이가 큰 쪽",
  정재: "성실하고 예측되는 사람 — 살림과 약속을 지키는 쪽",
  편관: "끌어주는 힘이 센 사람 — 나이나 지위 차가 있을 수 있는 쪽",
  정관: "자리와 이름이 분명한 사람 — 반듯하고 책임지는 쪽",
  편인: "속을 잘 안 보이는 사람 — 혼자만의 세계가 있는 쪽",
  정인: "품어 주고 가르쳐 주는 사람 — 기대게 되는 쪽",
};

export interface Meeting {
  age: number;
  year: number;
  /** 왜 그 해인가 — 근거를 그대로 적어 둔다 */
  reasons: string[];
  /** 어떤 결의 사람이 닿는가 */
  comer: string;
  /** 근거가 몇 겹인가. 겹칠수록 그 해가 분명하다 */
  weight: number;
}

export interface RomanceReading {
  /** 가장 가까운 사이가 드러나는 자리 */
  spouseSeat: { sipseong: string; 나: string; 상대: string };
  /** 짝을 뜻하는 기운이 원국에 얼마나 드러나 있는가 */
  partnerStar: { element: Element; count: number; note: string };
  /** 사람이 모이는 결 */
  charm: { has: boolean; note: string };
  /** 그 자리가 묶이는가 흔들리는가 */
  seatRelations: Array<{ type: string; with: string; note: string }>;
  /**
   * 인연이 닿는 해.
   *
   * "언제 누구를 만나는가" 는 사람이 가장 듣고 싶어 하는 말인데, 그동안 이걸
   * 계산하지 않고 모델에게 맡겼다. 맡기면 지어낸다.
   *
   * 세 가지가 겹치는 해를 센다.
   *   · 짝을 뜻하는 기운이 그 해에 들어오는가
   *   · 가장 가까운 사이의 자리(일지)가 그 해 글자와 묶이는가
   *   · 사람이 모이는 글자가 그 해에 들어오는가
   * 겹칠수록 분명한 해다. 얼굴·이름·직업은 계산하지 않으므로 적지 않는다.
   */
  meetings: Meeting[];
}

function countElement(pillars: FourPillars, target: Element) {
  const slots = [pillars.year, pillars.month, pillars.day, pillars.hour].filter(Boolean) as FourPillars["year"][];
  let count = 0;
  for (const pillar of slots) {
    if (STEM_ELEMENT[pillar.stem as Stem] === target) count += 1;
    if (STEM_ELEMENT[HIDDEN_STEMS[pillar.branch as Branch].at(-1)!] === target) count += 1;
  }
  return count;
}

/** 도화가 서는 지지 — 년지나 일지의 삼합국에서 정해진다 */
const FLOWER: Record<string, Branch> = {
  인: "묘", 오: "묘", 술: "묘",
  사: "오", 유: "오", 축: "오",
  신: "유", 자: "유", 진: "유",
  해: "자", 묘: "자", 미: "자",
};

/** 두 지지가 묶이는가 — 육합과 삼합만 본다 */
function binds(a: Branch, b: Branch) {
  if (SIX_HARMONY.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) return "육합";
  if (THREE_HARMONY.some((set) => set.branches.includes(a) && set.branches.includes(b))) return "삼합";
  return null;
}

export function readRomance(
  pillars: FourPillars,
  isFemale: boolean,
  upcoming: ReadonlyArray<{ year: number; age: number; ganji: string }> = [],
): RomanceReading {
  const dayStem = pillars.day.stem as Stem;
  const dayBranch = pillars.day.branch as Branch;
  const me = STEM_ELEMENT[dayStem];

  const seatGod = branchTenGod(dayStem, dayBranch);
  const seat = SEAT[seatGod] ?? { 나: "가까운 사이에서 드러나는 모습이 따로 있어요", 상대: "" };

  // 남자는 재성(내가 극하는 것), 여자는 관성(나를 극하는 것)을 짝 쪽으로 본다
  const partnerElement = isFemale
    ? (Object.keys(OVERCOMES) as Element[]).find((element) => OVERCOMES[element] === me)!
    : OVERCOMES[me];
  const partnerCount = countElement(pillars, partnerElement);

  const branches = [pillars.year, pillars.month, pillars.day, pillars.hour]
    .filter(Boolean)
    .map((pillar) => pillar!.branch as Branch);
  const flowerBranch = FLOWER[pillars.year.branch as Branch] ?? FLOWER[dayBranch];
  const hasFlower = Boolean(flowerBranch && branches.includes(flowerBranch));

  const seatRelations = computeNatalRelations(pillars)
    .relations.filter((relation) => relation.sourcePosition.startsWith("일") || relation.targetPosition.startsWith("일"))
    .slice(0, 3)
    .map((relation) => ({
      type: relation.type,
      with: relation.sourcePosition.startsWith("일") ? relation.targetPosition : relation.sourcePosition,
      note: relation.type.includes("합")
        ? "가장 가까운 사이가 다른 자리와 묶여 있어요. 둘만의 일로 끝나지 않고 집안이나 일이 함께 걸립니다."
        : "가장 가까운 사이가 흔들리는 자리예요. 같은 일로 반복해서 부딪히기 쉬워요.",
    }));

  const meetings: Meeting[] = [];
  for (const item of upcoming) {
    const stem = item.ganji[0] as Stem;
    const branch = item.ganji[1] as Branch;
    const reasons: string[] = [];

    if (STEM_ELEMENT[stem] === partnerElement || STEM_ELEMENT[HIDDEN_STEMS[branch].at(-1)!] === partnerElement) {
      reasons.push("짝을 뜻하는 기운이 그 해에 들어와요");
    }
    const bind = binds(branch, dayBranch);
    if (bind) reasons.push("가장 가까운 사이의 자리가 그 해 글자와 묶여요");
    if (flowerBranch && branch === flowerBranch) reasons.push("사람이 모이고 눈에 띄는 글자가 드는 해예요");

    if (reasons.length === 0) continue;
    meetings.push({
      age: item.age,
      year: item.year,
      reasons,
      comer: COMER[tenGod(dayStem, stem)],
      weight: reasons.length,
    });
  }
  // 겹치는 해가 먼저, 같으면 이른 해가 먼저
  meetings.sort((a, b) => b.weight - a.weight || a.year - b.year);

  return {
    spouseSeat: { sipseong: seatGod, ...seat },
    partnerStar: {
      element: partnerElement,
      count: partnerCount,
      note:
        partnerCount === 0
          ? "짝을 뜻하는 기운이 겉으로 드러나지 않아요. 인연이 없다는 뜻이 아니라, 가만히 기다려서는 오지 않고 움직여야 만난다는 뜻이에요."
          : partnerCount >= 3
            ? "짝을 뜻하는 기운이 여럿이에요. 만남은 많은데 그만큼 고르는 일이 어려워요."
            : "짝을 뜻하는 기운이 적당히 자리 잡고 있어요.",
    },
    charm: {
      has: hasFlower,
      note: hasFlower
        ? "사람이 모이고 눈에 띄는 결이 있어요. 먼저 다가오는 쪽이 많은 대신, 오래 두고 보는 눈이 필요해요."
        : "눈에 띄기보다 겪어 보고 알아주는 쪽이에요. 첫인상보다 두 번째 세 번째에서 점수가 올라갑니다.",
    },
    seatRelations,
    meetings: meetings.slice(0, 5),
  };
}
