// '해석 근거 보기' 영역에 들어갈 사실 목록. 값은 모두 sazu modules 에서 그대로 옮긴다(재계산·점수화 금지).
import { z } from "zod";
import { ELEMENT_LABEL, FIVE_ELEMENTS, parseGanji } from "./ganji";
import { parseElementCounts, parseFourPillars, type SazuModules } from "./modules";

export interface BasisFact {
  label: string;
  value: string;
}

const sinStrengthSchema = z.object({ strength: z.string() }).passthrough();
const namedTermSchema = z.object({ ko: z.string() }).passthrough();
const yongsinSchema = z
  .object({ yongsin: namedTermSchema, huisin: namedTermSchema.optional(), gisin: namedTermSchema.optional() })
  .passthrough();
const sinsalSchema = z
  .object({
    angels: z.array(z.object({ name: z.string() }).passthrough()).optional(),
    devils: z.array(z.object({ name: z.string() }).passthrough()).optional(),
  })
  .passthrough();

export function buildBasisFacts(modules: SazuModules): BasisFact[] {
  const facts: BasisFact[] = [];

  const pillars = parseFourPillars(modules);
  if (pillars) {
    facts.push({
      label: "원국",
      value: [pillars.year, pillars.month, pillars.day, pillars.hour ?? "시주 모름"].join(" · "),
    });
    const dayMaster = parseGanji(pillars.day)?.stem;
    if (dayMaster) {
      facts.push({
        label: "일간",
        value: `${dayMaster.han}(${dayMaster.ko}) · ${ELEMENT_LABEL[dayMaster.element].ko}`,
      });
    }
  }

  const counts = parseElementCounts(modules);
  if (counts) {
    facts.push({
      label: "오행",
      value: FIVE_ELEMENTS.map((element) => `${ELEMENT_LABEL[element].ko} ${counts[element]}`).join(" · "),
    });
  }

  const sinStrength = sinStrengthSchema.safeParse(modules.sinStrength);
  if (sinStrength.success) facts.push({ label: "신강약", value: sinStrength.data.strength });

  const yongsin = yongsinSchema.safeParse(modules.yongsin);
  if (yongsin.success) {
    const { yongsin: main, huisin, gisin } = yongsin.data;
    facts.push({
      label: "용신",
      value: [`용신 ${main.ko}`, huisin && `희신 ${huisin.ko}`, gisin && `기신 ${gisin.ko}`].filter(Boolean).join(" · "),
    });
  }

  const sinsal = sinsalSchema.safeParse(modules.sinsal);
  if (sinsal.success) {
    const names = [...(sinsal.data.angels ?? []), ...(sinsal.data.devils ?? [])].map((item) => item.name);
    if (names.length > 0) facts.push({ label: "신살", value: names.join(", ") });
  }

  return facts;
}

/** 본문에 실제로 등장한 용어만 고른다. 하나도 없으면 앞에서부터 fallbackLimit 개 */
export function pickGlossary(glossary: Record<string, string>, texts: string[], fallbackLimit = 6) {
  const body = texts.join("\n");
  const used = Object.entries(glossary).filter(([term]) => body.includes(term));
  return Object.fromEntries(used.length > 0 ? used : Object.entries(glossary).slice(0, fallbackLimit));
}
