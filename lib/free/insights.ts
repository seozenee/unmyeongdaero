import "server-only";

// 무료 콘텐츠(오늘의 운세·도화살·성향 유형). sazu 응답의 판정 문장만 엮고, AI·결제 없이 즉시 보여준다.
import type { StoredSazu } from "@/lib/db/types";
import { ELEMENT_LABEL, FIVE_ELEMENTS, parseGanji } from "@/lib/saju/ganji";
import { parseElementCounts, parseFourPillars, type ElementCounts, type FourPillarsInput } from "@/lib/saju/modules";
import { mergedModules } from "@/lib/sazu/readings";

export const FREE_KINDS = ["today", "dohwa", "mbti"] as const;
export type FreeKind = (typeof FREE_KINDS)[number];

export interface FreeInsight {
  title: string;
  headline: string;
  highlights: Array<{ label: string; text: string }>;
  pillars: FourPillarsInput | null;
  counts: ElementCounts | null;
  sample: boolean;
}

type Json = unknown;
const at = (value: Json, path: string): Json =>
  path.split(".").reduce<Json>((current, key) => (current && typeof current === "object" ? (current as Record<string, Json>)[key] : undefined), value);
const str = (value: Json) => (typeof value === "string" && value.trim() ? value.trim().replace(/\s*\(?\d+점\)?/g, "") : null);
const list = (value: Json): Json[] => (Array.isArray(value) ? value : []);
/** 문자열이거나, 문장 필드를 가진 객체에서 첫 문장을 꺼낸다 */
const textFrom = (value: Json): string | null =>
  str(value) ?? ["note", "prose", "summary", "text", "headline", "meaning"].map((key) => str(at(value, key))).find(Boolean) ?? null;

const PERSONALITY: Record<string, string> = {
  wood: "곧게 자라려는 나무처럼 성장과 배움에서 힘을 얻어요.",
  fire: "불처럼 드러내고 표현할 때 가장 빛나요.",
  earth: "땅처럼 사람과 일을 품고 중심을 잡아요.",
  metal: "쇠처럼 기준이 분명하고 정리하는 힘이 강해요.",
  water: "물처럼 깊이 생각하고 흐름을 읽어요.",
};

export function buildFreeInsight(kind: FreeKind, sazu: StoredSazu): FreeInsight {
  const modules = mergedModules(sazu);
  const pillars = parseFourPillars(modules);
  const counts = parseElementCounts(modules);
  const sample = Object.values(sazu).some((topic) => topic?.sample);
  const dayStem = pillars ? parseGanji(pillars.day)?.stem : null;

  if (kind === "today") {
    const today = sazu.today?.modules ?? {};
    const daily = at(today, "dailyInteraction");
    const highlights = [
      { label: "오늘의 일진", text: textFrom(at(daily, "summary")) ?? `오늘은 ${str(at(daily, "ilju.ganji")) ?? "새로운"} 일진이 들어오는 날이에요.` },
      str(at(daily, "toDayMaster.stemSipseong"))
        ? { label: "나에게 드는 기운", text: `천간은 ${str(at(daily, "toDayMaster.stemSipseong"))}, 지지는 ${str(at(daily, "toDayMaster.branchSipseong")) ?? "-"}의 작용이에요.` }
        : null,
      ...list(at(daily, "relations")).slice(0, 2).map((relation) => ({ label: `원국과의 ${str(at(relation, "type")) ?? "관계"}`, text: textFrom(relation) ?? "" })),
      str(at(today, "weolun.currentWeolun.interpretation")) ? { label: "이번 달", text: str(at(today, "weolun.currentWeolun.interpretation"))! } : null,
      str(at(today, "seun.currentSeun.interpretation")) ? { label: "올해", text: str(at(today, "seun.currentSeun.interpretation"))! } : null,
    ].filter((item): item is { label: string; text: string } => Boolean(item?.text));
    return { title: "오늘의 운세 & 나의 만세력", headline: highlights[0]?.text ?? "오늘의 흐름을 읽었어요.", highlights, pillars, counts, sample };
  }

  if (kind === "dohwa") {
    const all = [...list(at(modules, "sinsal.angels")), ...list(at(modules, "sinsal.devils")), ...list(at(modules, "sinsal.twelve"))];
    const charm = all.filter((item) => /도화|홍염|화개|함지/.test(str(at(item, "name")) ?? ""));
    const highlights = charm.map((item) => ({ label: str(at(item, "name"))!, text: textFrom(at(item, "description")) ?? textFrom(item) ?? "" }));
    const dayMeaning = str(at(modules, "fourPillars.day.twelveFortuneInterpretation.positionMeaning"));
    if (dayMeaning) highlights.push({ label: "배우자 자리(일지)의 결", text: dayMeaning });
    return {
      title: "도화살 테스트 : 내 타고난 매력의 결",
      headline: charm.length
        ? `${charm.map((item) => str(at(item, "name"))).join("·")}의 기운이 머물러 있어요. 사람을 끌어당기는 힘이지, 그 자체로 나쁜 것이 아니에요.`
        : "원국에 도화 계열 신살은 드러나지 않아요. 대신 은근하고 오래가는 매력의 결이에요.",
      highlights,
      pillars,
      counts,
      sample,
    };
  }

  // mbti — 재미로 보는 성향 유형
  const max = counts ? Math.max(...FIVE_ELEMENTS.map((element) => counts[element])) : 0;
  const dominant = counts ? FIVE_ELEMENTS.filter((element) => counts[element] === max) : [];
  const strong = /신강/.test(str(at(modules, "sinStrength.strength")) ?? "");
  const type = [
    strong ? "E" : "I",
    dominant.some((element) => element === "wood" || element === "water") ? "N" : "S",
    dominant.some((element) => element === "metal" || element === "earth") ? "T" : "F",
    dayStem?.yinYang === "yang" ? "J" : "P",
  ].join("");
  return {
    title: "사주로 보는 성격 유형",
    headline: `재미로 보는 사주 성향은 ${type} 쪽에 가까워요.`,
    highlights: [
      dayStem ? { label: `일간 ${dayStem.ko}(${dayStem.han}) · ${ELEMENT_LABEL[dayStem.element].ko}`, text: PERSONALITY[dayStem.element]! } : null,
      str(at(modules, "sinStrength.analysis")) ? { label: `신강약 · ${str(at(modules, "sinStrength.strength"))}`, text: str(at(modules, "sinStrength.analysis"))! } : null,
      dominant.length ? { label: `두드러진 오행 · ${dominant.map((element) => ELEMENT_LABEL[element].ko).join("·")}`, text: dominant.map((element) => PERSONALITY[element]).join(" ") } : null,
      { label: "안내", text: "MBTI 와 명리는 서로 다른 체계예요. 오행·음양·신강약을 성향 축에 대응시킨 재미용 해석이에요." },
    ].filter((item): item is { label: string; text: string } => Boolean(item)),
    pillars,
    counts,
    sample,
  };
}
