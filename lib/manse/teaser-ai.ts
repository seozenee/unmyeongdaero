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

/**
 * 누구 이야기를 누구에게 하는가.
 *
 * 아이 사주를 보는 사람은 아이가 아니라 부모다. 그런데 "~하신 적 있으시죠?" 하고
 * 당사자에게 말하면, 부모는 자기 얘기인 줄 알고 읽다가 어긋난다. 아이 사주는
 * 부모가 **옆에서 본 장면**으로 써야 맞는다.
 */
type Voice = "self" | "parent-of-child";

const CONCRETE = `**특성을 말하지 말고, 그 특성이 만드는 장면을 보여 준다.**

이게 전부다. "완벽주의예요", "집착이 강해요", "감수성이 풍부해요" 같은 말은
아무것도 맞히지 않는다. 누구에게나 조금씩 해당되기 때문이다.

반드시 이 사슬로 내려간다.
  타고난 결 → 그게 일상에서 어떻게 비틀리는가 → 눈으로 본 장면 하나

  (나쁨) "과제 집착력이 높고 완벽주의 성향이 있어요."
  (좋음) "문제집을 풀다 한 문제가 막히면 다음 장으로 못 넘어가고 그 자리에 붙들려
          있거나, 글씨가 마음에 안 든다고 종이가 찢어질 때까지 지우고 있는 걸
          보신 적 있으시죠?"

장면에는 눈에 보이는 것이 있어야 한다 — 종이, 지우개, 시계, 문 앞, 휴대폰 화면,
식탁, 현관. 추상명사("성향", "경향", "에너지")로 끝나는 문장은 실패다.`;

const VOICE: Record<Voice, string> = {
  self: `읽는 사람이 곧 그 사람이다. "~하신 적 있으시죠?", "~했을 거예요",
"~하지 않으셨어요?" 로 맺는다.`,
  "parent-of-child": `읽는 사람은 **부모**이고, 글의 주인공은 **아이**다.
아이에게 말하지 말고, 부모가 옆에서 본 장면으로 쓴다.
"~하는 걸 보신 적 있으시죠?", "~해서 속상하셨을 거예요", "~하지 않던가요?" 로 맺는다.
(나쁨: "아이는 혼자 있는 시간이 필요하세요"
 좋음: "학교 다녀와서 가방도 안 벗고 방에 들어가 한참 안 나오는 걸 보신 적 있으시죠?")`,
};

const buildSystem = (voice: Voice) => `너는 한국 명리를 오래 본 사람이다. 지금 하는 일은 하나뿐이다.

계산된 값을 보고, **살면서 실제로 겪었을 장면** 세 개를 쓴다.
읽는 사람이 "어? 이거 완전 우리 애(나)인데?" 하고 멈칫해야 한다.

${VOICE[voice]}

${CONCRETE}

규칙:
- 사주 용어와 한자를 한 글자도 쓰지 않는다. 오행(목화토금수), 십성, 신강·신약, 용신,
  격국, 일간, 대운, "명식" — 전부 금지다.
- 세 장면은 서로 다른 자리를 짚는다. 사람 사이에서 하나, 일(또는 공부)에서 하나,
  혼자 있을 때 하나로 나누면 겹치지 않는다.
- 각 장면은 1~2문장, 50~110자.
- 주어진 값에 없는 사실(직업, 형제, 사는 곳, 구체적 사건)을 지어내지 않는다.
  보이는 장면은 그 결에서 나올 법한 것이어야 하고, 없는 사연을 만들어 붙이는 것이 아니다.
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
  options: { timeoutMs?: number; voice?: Voice } = {},
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
        system: [
          { type: "text", text: buildSystem(options.voice ?? "self"), cache_control: { type: "ephemeral" } },
        ],
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
