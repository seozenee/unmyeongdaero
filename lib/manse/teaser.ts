import type { SazuModules } from "../saju/modules";
import { ELEMENT_SCENE, MISSING_SCENE, STRENGTH_SCENE } from "./scenes";
import { FIVE_ELEMENTS, toFiveElement, ELEMENT_LABEL } from "../saju/ganji";
import { parseElementCounts } from "../saju/modules";

/**
 * 결제 전에 보여 줄 거리를 명식에서 뽑는다.
 *
 * 돈을 받기 전에 읽을 것이 있어야 한다. 그렇다고 없는 말을 지어내면 그건 파는 게 아니라
 * 속이는 것이다. 여기서 나오는 값은 전부 계산 결과다 — 가장 힘이 실리는 달은 월운에서,
 * 조심할 때는 충이 드는 자리에서, 인연의 결은 일지 십성에서 나온다.
 *
 * 점수(매력 86점, 상위 3%)처럼 우리가 계산하지 않는 숫자는 만들지 않는다.
 */

const at = (value: unknown, path: string): unknown =>
  path.split(".").reduce<unknown>((current, key) => {
    if (current === null || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[key];
  }, value);
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
const num = (v: unknown) => (typeof v === "number" ? v : null);
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

export interface TeaserMonth {
  label: string;
  ganji: string;
  note: string;
  /** 힘이 실리는 달인가, 쉬어 갈 달인가 */
  tone: "good" | "caution" | "neutral";
}

export interface ReadingTeaser {
  /** 한 줄 단언. 가장 구체적인 사실 하나를 앞세운다 */
  headline: string;
  /** 지금 알아맞히는 것들 — 신강약·오행에서 바로 나온다 */
  scenes: string[];
  /** 가장 힘이 실리는 달 */
  best: TeaserMonth | null;
  /** 조심할 달 */
  risk: TeaserMonth | null;
  /** 앞으로 열두 달 전부 */
  months: TeaserMonth[];
  /** 지금 지나는 열 해 */
  decade: { label: string; phase: string | null } | null;
  /** 타고난 결 — 일부만 열고 나머지는 잠근다 */
  traits: Array<{ label: string; value: string }>;
  /** 결제해야 보이는 것들 */
  locked: Array<{ label: string; teaser: string }>;
}

const toneOf = (level: number | null): TeaserMonth["tone"] =>
  level === null ? "neutral" : level >= 8 ? "good" : level <= 4 ? "caution" : "neutral";

function monthsFrom(modules: SazuModules): TeaserMonth[] {
  const raw = [...list(at(modules, "weolun.upcomingWeoluns"))] as Record<string, unknown>[];
  return raw
    .map((m) => ({
      label: str(m.monthLabel) ?? "",
      ganji: str(m.ganji) ?? "",
      note: str(m.interpretation) ?? "",
      tone: toneOf(num(at(m, "twelveFortune.level"))),
    }))
    .filter((m) => m.label);
}

export function buildReadingTeaser(modules: SazuModules, name: string): ReadingTeaser {
  const months = monthsFrom(modules);
  const best = months.find((m) => m.tone === "good") ?? null;
  const risk = months.find((m) => m.tone === "caution") ?? null;

  const counts = parseElementCounts(modules);
  const strongest = counts ? [...FIVE_ELEMENTS].sort((a, b) => counts[b] - counts[a])[0] : null;
  const empty = counts ? FIVE_ELEMENTS.find((e) => counts[e] === 0) : undefined;
  const strength = str(at(modules, "sinStrength.strength"));

  const scenes = [
    strength ? STRENGTH_SCENE[strength] : null,
    strongest ? ELEMENT_SCENE[strongest] : null,
    empty ? MISSING_SCENE[empty] : null,
  ].filter((s): s is string => Boolean(s));

  // 지금 지나는 열 해
  const decadeList = list(at(modules, "decadeFortune.list")) as Record<string, unknown>[];
  const currentDecade = decadeList.length > 0 ? decadeList[Math.max(0, decadeList.length - 1)] : null;

  const daySipseong = str(at(modules, "fourPillars.day.earthSippiSeong"));
  const yong = str(at(modules, "yongsin.yongsin.ko"));
  const gi = str(at(modules, "yongsin.gisin.ko"));
  const gyeokguk = str(at(modules, "gyeokguk.name"));

  const traits = [
    daySipseong ? { label: "가까운 사이에서 나오는 결", value: daySipseong } : null,
    yong ? { label: "나를 살리는 기운", value: yong } : null,
    gyeokguk ? { label: "타고난 틀", value: gyeokguk } : null,
    strongest ? { label: "가장 두꺼운 기운", value: ELEMENT_LABEL[strongest].ko } : null,
  ].filter((t): t is { label: string; value: string } => Boolean(t));

  // 결제해야 열리는 것 — 무엇이 들었는지는 밝히되 내용은 잠근다
  const locked = [
    { label: "이 결이 관계에서 어떻게 나오는지", teaser: "같은 자리에서 반복되는 장면이 있어요." },
    { label: "힘이 실리는 달에 무엇을 하면 되는지", teaser: "날짜만 알고 쓰지 못하면 그냥 지나갑니다." },
    gi ? { label: `${gi} 기운이 들 때 벌어지는 일`, teaser: "흐름이 꼬이는 자리는 늘 같은 모양이에요." } : null,
    { label: "앞으로 열 해의 배경이 바뀌는 자리", teaser: "큰 결정은 이 자리를 보고 잡아야 합니다." },
  ].filter((l): l is { label: string; teaser: string } => Boolean(l));

  const headline = best
    ? `${name}님, ${best.label}에 문이 열립니다`
    : strength
      ? `${name}님은 ${strength}의 그릇입니다`
      : `${name}님의 여덟 글자를 펼쳤습니다`;

  return {
    headline,
    scenes,
    best,
    risk,
    months,
    decade: currentDecade
      ? {
          label: `${num(currentDecade.startAge) ?? ""}세~ ${str(currentDecade.full) ?? ""}`,
          phase: str(at(currentDecade, "twelveFortune.phase")),
        }
      : null,
    traits,
    locked,
  };
}

export { toFiveElement };
