import "server-only";

import { getAnthropic, claudeBaseParams, finalText } from "@/lib/ai/anthropic";
import type { SazuModules } from "../saju/modules";
import { parseElementCounts } from "../saju/modules";
import { ELEMENT_LABEL, FIVE_ELEMENTS } from "../saju/ganji";
import { findJargon } from "../story/sanitize";

/**
 * 결제 전 화면의 "맞혀 보이는" 문장을 AI 가 쓴다.
 *
 * 전에는 표에서 골랐다. 신강약 셋 × 넘치는 기운 다섯 × 비는 기운 다섯 = 일흔다섯 가지.
 * 계산은 진짜였지만 문장은 고정이라, 같은 조합인 사람은 토씨 하나까지 같은 글을 봤다.
 * 친구끼리 비교하면 바로 들킨다 — 맞혀 보이는 자리에서 들키면 그 뒤는 아무 소용이 없다.
 *
 * 여기서 쓰는 재료는 전부 생년월일시에서 셈한 값이다. 모델은 그 값을 사람의 장면으로
 * 옮기는 일만 한다. 없는 사실을 지어내지 않는다.
 */

const str = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : null);
const at = (value: unknown, path: string): unknown =>
  path.split(".").reduce<unknown>((current, key) => {
    if (current === null || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[key];
  }, value);

/** 모델에게 넘길 계산 결과. 사람마다 달라지는 값만 모은다 */
export function teaserFacts(modules: SazuModules, name: string) {
  const counts = parseElementCounts(modules);
  const pillar = (slot: string) => str(at(modules, `fourPillars.${slot}.full`));

  return {
    이름: name,
    네기둥: { 년: pillar("year"), 월: pillar("month"), 일: pillar("day"), 시: pillar("hour") },
    태어난날의글자: str(at(modules, "fourPillars.day.sky")),
    기운의세기: str(at(modules, "sinStrength.strength")),
    기운분포: counts
      ? Object.fromEntries(FIVE_ELEMENTS.map((key) => [ELEMENT_LABEL[key].ko, counts[key]]))
      : null,
    비는기운: counts ? FIVE_ELEMENTS.filter((key) => counts[key] === 0).map((key) => ELEMENT_LABEL[key].ko) : [],
    가까운사이의결: str(at(modules, "fourPillars.day.earthSippiSeong")),
    타고난틀: str(at(modules, "gyeokguk.name")),
    나를살리는기운: str(at(modules, "yongsin.yongsin.ko")),
    지금자리: str(at(modules, "fourPillars.day.twelveStage")),
  };
}

const SYSTEM = `너는 한국 명리를 오래 본 사람이다. 지금 하는 일은 하나뿐이다.

계산된 값을 보고, 이 사람이 **살면서 실제로 겪었을 장면** 세 개를 쓴다.
읽는 사람이 "어? 이거 완전 난데?" 하고 멈칫해야 한다.

규칙:
- 사주 용어와 한자를 한 글자도 쓰지 않는다. 오행(목화토금수), 십성, 신강·신약, 용신,
  격국, 일간, 대운, "명식" — 전부 금지다. 그 글자가 삶에서 어떤 모습으로 나오는지만 쓴다.
- 문장은 반드시 되묻는 말로 맺는다. "~한 적 있으시죠?", "~했을 거예요",
  "~하지 않으셨어요?" 중 하나.
- 사람·자리·시간이 보이게 구체적으로 쓴다.
  (나쁨: "감정 기복이 있는 편이에요" / 좋음: "회의에서 하고 싶은 말을 삼켰다가
   집에 와서 이불을 걷어찬 적 있으시죠?")
- 세 장면은 서로 다른 자리를 짚는다. 하나는 사람 사이에서, 하나는 일이나 돈에서,
  하나는 혼자 있을 때로 나눠 보면 겹치지 않는다.
- 각 장면은 1~2문장, 40~90자.
- 주어진 값에 없는 사실(직업, 가족 관계, 구체적 사건)을 지어내지 않는다.
- 점수나 등수("상위 몇 퍼센트", "몇 점")를 만들지 않는다.
- 겁주지 않는다. 맞히되 불안을 팔지 않는다.

답은 JSON 배열 하나로만 한다. 설명을 붙이지 않는다.
["장면1", "장면2", "장면3"]`;

/**
 * 장면 세 개를 받아 온다.
 *
 * 실패하거나 늦으면 null 을 돌려준다 — 부르는 쪽이 원래 쓰던 표로 돌아간다.
 * 결제 전 화면이 AI 때문에 비거나 멈추는 일은 없어야 한다.
 */
export async function writeTeaserScenes(
  facts: ReturnType<typeof teaserFacts>,
  options: { timeoutMs?: number } = {},
): Promise<string[] | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 12_000);

  try {
    const message = await getAnthropic().messages.create(
      {
        ...claudeBaseParams(),
        max_tokens: 1200,
        // 짧은 글 세 줄이다. 깊이 생각할 일이 아닌데 기본값으로 두면 열 몇 초가 걸린다 —
        // 그동안 손님은 표에 있는 문장을 보고 있고, 늦게 바뀌면 바뀐 줄도 모른다.
        output_config: { effort: "low" as const },
        system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: JSON.stringify(facts) }],
      },
      { signal: controller.signal },
    );

    const text = finalText(message.content).trim();
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    if (start === -1 || end === -1) return null;

    const parsed: unknown = JSON.parse(text.slice(start, end + 1));
    if (!Array.isArray(parsed)) return null;

    const scenes = parsed
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter((item) => item.length >= 10 && item.length <= 200)
      // 용어가 섞여 나온 문장은 버린다 — 맞혀 보이는 자리에서 "일지 편인"은 역효과다
      .filter((item) => findJargon(item).length === 0);

    return scenes.length >= 2 ? scenes.slice(0, 3) : null;
  } catch {
    // 늦어도, 막혀도, 모양이 달라도 — 부르는 쪽이 표로 돌아간다
    return null;
  } finally {
    clearTimeout(timer);
  }
}
