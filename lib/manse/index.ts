// 만세력 엔진의 바깥 창구.
//
// 계산 결과를 앱이 이미 쓰고 있는 모양(StoredSazuTopic)으로 내보낸다.
// 덕분에 원국표·오행 차트·대운 타임라인·프롬프트·대체 보고서가 그대로 동작한다.
//
// 뜻풀이 '판정'은 담되 '점수'는 담지 않는다. 몇 점인지는 화면에도 문장에도 쓰지 않기로
// 정했으므로, 애초에 만들지 않는다.
import type { BirthProfile, StoredSazu, StoredSazuTopic } from "@/lib/db/types";
import type { SazuTopic } from "@/lib/sazu/schemas";
import { computeDecadeFortune } from "./decade";
import { GLOSSARY } from "./glossary";
import { computeGyeokguk, computeYongsin, ELEMENT_USAGE } from "./gyeokguk";
import { computeLuck, computeSeun } from "./luck";
import { computeFourPillars, type PillarsResult } from "./pillars";
import { readCharacter } from "./character";
import { buildLifeTimeline } from "./life";
import { computeCrossRelations, computeNatalRelations } from "./relations";
import { computeSinsal } from "./sinsal";
import { countElements, judgeStrength } from "./strength";
import {
  branchTenGod, BRANCH_HANJA, HIDDEN_STEMS, naeum, STEM_HANJA, tenGod, twelveStage,
  type Branch, type Stem,
} from "./tables";

export { computeFourPillars } from "./pillars";
export type { BirthInput, FourPillars, Pillar, PillarsResult } from "./pillars";

const ELEMENT_KEY = { 목: "wood", 화: "fire", 토: "earth", 금: "metal", 수: "water" } as const;

/** 네 기둥이 각각 삶의 어느 자리를 맡는가 */
const SLOT_MEANING = {
  year: "어린 시절과 뿌리",
  month: "부모와 사회로 나서는 자리",
  day: "배우자와 가장 가까운 관계",
  hour: "자녀와 말년",
} as const;

/** 십이운성을 한 문장으로 — 무료 콘텐츠와 대체 보고서가 이 문장을 그대로 인용한다 */
const STAGE_NOTE: Record<string, string> = {
  장생: "시작과 배움에 힘이 붙는 결",
  목욕: "시행착오를 겪으며 자리를 찾는 결",
  관대: "내놓을 것이 갖춰지는 결",
  건록: "일한 만큼 돌아오는 결",
  제왕: "힘이 가장 찬 결",
  쇠: "벌이기보다 지키는 편이 나은 결",
  병: "몸과 마음을 먼저 챙기게 되는 결",
  사: "오래 끌던 것을 매듭짓는 결",
  묘: "드러내기보다 안으로 쌓는 결",
  절: "끊기고 이어지며 자리를 옮기는 결",
  태: "아직 보이지 않는 것이 자리를 잡는 결",
  양: "서두르지 않을수록 단단해지는 결",
};

function pillarDetail(
  pillar: { stem: string; branch: string; full: string },
  dayStem: Stem,
  slot: keyof typeof SLOT_MEANING,
) {
  const stem = pillar.stem as Stem;
  const branch = pillar.branch as Branch;
  const hidden = HIDDEN_STEMS[branch];

  return {
    full: pillar.full,
    sky: stem,
    earth: branch,
    skyFull: STEM_HANJA[stem],
    earthFull: BRANCH_HANJA[branch],
    sippiSeong: tenGod(dayStem, stem),
    earthSippiSeong: branchTenGod(dayStem, branch),
    twelveStage: twelveStage(dayStem, branch),
    naeeum: naeum(stem, branch),
    twelveFortuneInterpretation: {
      phase: STAGE_NOTE[twelveStage(dayStem, branch)],
      positionMeaning: `${SLOT_MEANING[slot]}에서 ${STAGE_NOTE[twelveStage(dayStem, branch)]}`,
    },
    jiJangGan: {
      residue: hidden.length === 3 ? { stem: hidden[0] } : null,
      middle: hidden.length === 3 ? { stem: hidden[1] } : null,
      main: { stem: hidden.at(-1) },
    },
  };
}

/** 한 사람의 명식 전체 — 계산된 사실만 담는다 */
export function computeManse(profile: BirthProfile, now = new Date()) {
  const pillars: PillarsResult = computeFourPillars({
    year: profile.birthYear,
    month: profile.birthMonth,
    day: profile.birthDay,
    hour: profile.birthHour,
    minute: profile.birthMinute,
    isLunar: profile.isLunar,
    isLeapMonth: profile.isLeapMonth,
    city: profile.birthCity,
  });

  const dayStem = pillars.day.stem as Stem;
  const strength = judgeStrength(pillars);
  const elements = countElements(pillars);
  const decade = computeDecadeFortune({
    pillars,
    birth: {
      year: profile.birthYear,
      month: profile.birthMonth,
      day: profile.birthDay,
      hour: profile.birthHour,
      minute: profile.birthMinute,
    },
    isFemale: profile.isFemale,
  });
  const sinsal = computeSinsal(pillars);
  const gyeokguk = computeGyeokguk(pillars);
  const yongsin = computeYongsin(pillars, strength.strength);
  const natal = computeNatalRelations(pillars);
  const luck = computeLuck(pillars, profile.birthYear, now);

  /*
    나이가 박힌 연표.

    대운 목록은 전부터 있었지만 간지와 시작 나이만 적힌 표였다. 그걸로는 "몇 살에
    무엇이" 를 쓸 수 없어, 풀이가 늘 성격 이야기로 돌아갔다 — 누구에게나 조금씩
    맞는 글이다. 사람이 사주를 보러 오는 이유는 언제 무엇이 오는지다.

    올해부터 열두 해를 미리 세워 둔다. 한 해씩 그때 가서 계산하면 모델은 "앞으로"
    라고밖에 못 쓴다.
  */
  const years = Array.from({ length: 12 }, (_, offset) => {
    const year = now.getFullYear() + offset;
    return { year, full: computeSeun(pillars, profile.birthYear, year).ganji };
  });
  const life = buildLifeTimeline({
    pillars,
    decades: decade.items,
    years,
    birthYear: profile.birthYear,
    yongsin: yongsin.yongsin?.ko ?? null,
    gisin: yongsin.gisin?.ko ?? null,
    strength: strength.strength,
    now,
  });

  const fourPillars: Record<string, unknown> = {
    year: pillarDetail(pillars.year, dayStem, "year"),
    month: pillarDetail(pillars.month, dayStem, "month"),
    day: pillarDetail(pillars.day, dayStem, "day"),
  };
  if (pillars.hour) fourPillars.hour = pillarDetail(pillars.hour, dayStem, "hour");

  const elementModule: Record<string, unknown> = {};
  for (const row of elements) {
    elementModule[ELEMENT_KEY[row.element]] = {
      name: row.element,
      total: { count: row.total, percentage: row.percentage },
      skyOnly: { count: row.sky },
      earthOnly: { count: row.earth },
    };
  }

  return {
    pillars,
    strength,
    elements,
    decade,
    sinsal,
    gyeokguk,
    yongsin,
    natal,
    luck,
    /** 앱이 이미 읽고 있는 modules 모양 */
    modules: {
      fourPillars,
      elements: elementModule,
      sinStrength: {
        strength: strength.strength,
        isStrong: strength.strength === "신강",
        deukryeong: strength.deukryeong,
        deukji: strength.deukji,
        deukse: strength.deukse,
        supporting: strength.supporting,
        draining: strength.draining,
        analysis: [
          `득령 ${strength.deukryeong ? "○" : "×"} · 득지 ${strength.deukji ? "○" : "×"} · 득세 ${strength.deukse ? "○" : "×"}`,
          strength.strength === "신강"
            ? "세 기준을 모두 얻어 일간의 힘이 넉넉하다. 밀고 나가는 힘이 있는 대신, 덜어 낼 곳을 찾아야 흐름이 순해진다."
            : strength.strength === "신약"
              ? "세 기준을 모두 얻지 못해 일간의 힘이 모자라다. 기댈 곳을 찾아 채우면 제 결이 산다."
              : "얻은 기준과 얻지 못한 기준이 섞여 한쪽으로 치우치지 않는다. 때에 따라 결이 달라진다.",
        ].join(" — "),
      },
      gyeokguk: {
        name: gyeokguk.name,
        reasoning: gyeokguk.reasoning,
        sipsin: gyeokguk.tenGod,
        transparency: gyeokguk.transparency,
      },
      yongsin: {
        yongsin: yongsin.yongsin,
        huisin: yongsin.huisin,
        gisin: yongsin.gisin,
        gusin: yongsin.gusin,
        hansin: yongsin.hansin,
        eokbu: yongsin.eokbu,
        johu: yongsin.johu,
        method: yongsin.method,
        reasoning: yongsin.reasoning,
        // 용신을 생활로 옮길 때 쓰는 결 — 보고서의 '실천' 문단이 여기서 나온다
        usage: ELEMENT_USAGE[yongsin.yongsin.ko],
        huiUsage: ELEMENT_USAGE[yongsin.huisin.ko],
      },
      wongukInteraction: { relations: natal.relations, summary: natal.summary },
      sinsal: {
        items: sinsal.map(toSinsalEntry),
        angels: sinsal.filter((hit) => hit.group === "길신").map(toSinsalEntry),
        devils: sinsal.filter((hit) => hit.group === "흉살").map(toSinsalEntry),
        twelve: sinsal.filter((hit) => hit.group === "십이신살").map(toSinsalEntry),
      },
      decadeFortune: {
        direction: decade.direction,
        startAge: decade.startAge,
        basisTermsName: decade.basisTerm,
        basisDays: decade.basisDays,
        list: decade.items,
      },
      // 성격은 풀이에서 가장 먼저 읽히는 자리인데, 그걸 바로 가리키는 값이 없었다.
      // 원국만 던져 주면 "성실하시네요" 로 돌아간다.
      character: readCharacter(pillars, strength.strength),
      lifeTimeline: life,
      seun: luck.seun,
      weolun: luck.weolun,
      dailyInteraction: {
        ilju: luck.iljin.ilju,
        toDayMaster: luck.iljin.toDayMaster,
        relations: luck.iljin.hapChungRelations,
        summary: luck.iljin.summary,
      },
      basis: pillars.basis,
    } satisfies Record<string, unknown>,
  };
}

const toSinsalEntry = (hit: { name: string; group: string; positions: string[]; description: string }) => ({
  name: hit.name,
  group: hit.group,
  pillars: hit.positions,
  description: hit.description,
});

export type ManseResult = ReturnType<typeof computeManse>;

// ─── 토픽별로 담아 내기 ──────────────────────────────────────────────────────

/** 토픽마다 AI 에게 "이 자료로 무엇을 보라"고 일러 주는 안내 */
const TOPIC_GUIDE: Record<SazuTopic, string> = {
  manse: "생년월일시로 계산한 명식 한 벌 — 원국 네 기둥, 오행 분포, 신강약, 격국, 용신, 합충형파해, 신살, 대운, 세운·월운.",
  today: "오늘과 이번 달의 흐름 — 세운·월운이 원국과 맺는 관계를 중심으로 본다.",
  yearly: "한 해의 흐름 — 세운을 중심에 두고 열두 달의 월운으로 시기를 좁힌다.",
  decade: "십 년 단위의 큰 흐름 — 대운의 방향과 시작 나이, 지금 지나는 자리를 본다.",
  life: "삶 전체의 결 — 원국의 틀(격국)과 필요한 기운(용신), 기둥끼리의 관계를 본다.",
  compatibility: "두 사람의 궁합 — 각자의 명식과, 둘 사이의 합충 관계·오행 보완을 함께 본다.",
  love: "인연의 결 — 일지(배우자 자리)와 관성·재성, 그리고 지금의 세운·월운을 본다.",
  money: "재물의 결 — 재성의 자리와 신강약(재물을 감당할 힘), 대운·세운의 시기를 본다.",
  health: "몸의 결 — 오행의 치우침과 용신을 생활 습관으로 옮겨 본다.",
  consult: "상담용 명식 한 벌 — 질문에 답할 때 근거로 삼는 계산 결과 전부.",
};

const HOW_TO_USE = [
  "modules 는 계산된 사실입니다 — 여기에 없는 사실을 지어내지 마세요.",
  "reasoning·meaning·interpretation·phase 는 판정을 말로 옮긴 문장입니다. 요약과 어조 변환만으로 풀이를 쓸 수 있습니다.",
  "glossary 는 이 자료에 나온 용어의 뜻입니다 — 이 뜻을 기준으로 삼고 다르게 정의하지 마세요.",
  "신살과 형충의 전통적 표현은 이미 생활 언어로 옮겨 두었습니다. 겁주는 말로 되돌리지 마세요.",
];

/** 이 토픽이 시기(세운·월운)를 다루는가 */
const NEEDS_LUCK: readonly SazuTopic[] = ["today", "yearly", "decade", "love", "money", "health", "consult"];
/** 이 토픽이 두 사람을 다루는가 */
const NEEDS_PARTNER: readonly SazuTopic[] = ["compatibility", "love"];

/*
  토픽마다 재료를 가려 내보내고 있었다. 세운·월운이 일부 토픽에만 실려, 평생사주와
  재물운 사주에는 "올해·이번 달" 을 쓸 재료가 아예 없었다. 시기를 묻는 상품인데
  시기를 쓸 자료가 없으니 글이 성격 이야기로 돌아간다.

  가려서 아낄 것이 없다. 전부 같은 계산에서 나오고, 토큰 몇 백 자 차이다.
  모든 토픽에 같은 재료를 싣는다 — 무엇을 앞세울지는 상품의 목차가 정한다.
*/
function topicModules(_topic: SazuTopic, me: ManseResult): Record<string, unknown> {
  return me.modules;
}

/**
 * 리포트가 요구하는 토픽들을 한 벌로 계산한다.
 * sazu 를 부르던 자리를 그대로 대신하므로, 반환 모양은 StoredSazu 그대로다.
 */
export function buildManseTopics(
  topics: readonly SazuTopic[],
  subject: BirthProfile,
  partner: BirthProfile | null,
  now = new Date(),
): StoredSazu {
  const me = computeManse(subject, now);
  const other = partner ? computeManse(partner, now) : null;

  // 차트가 늘 manse 를 먼저 읽으므로 빠뜨리지 않는다
  const wanted = Array.from(new Set<SazuTopic>(["manse", ...topics]));
  const stored: StoredSazu = {};

  for (const topic of wanted) {
    const modules = topicModules(topic, me);
    const withPartner = other && partner && NEEDS_PARTNER.includes(topic);
    const cross = withPartner
      ? computeCrossRelations(me.pillars, other.pillars, { mine: subject.name, theirs: partner.name })
      : null;

    const entry: StoredSazuTopic = {
      modules: cross
        ? { ...modules, crossRelations: cross.relations, elementComplement: cross.elementComplement, crossSummary: cross.summary }
        : modules,
      guide: { purpose: TOPIC_GUIDE[topic], howToUse: HOW_TO_USE },
      glossary: GLOSSARY,
      sample: false,
    };
    if (other && partner) {
      entry.partners = [{ name: partner.name, modules: topicModules(topic, other) }];
    }
    stored[topic] = entry;
  }
  return stored;
}
