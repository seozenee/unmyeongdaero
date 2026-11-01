import type { SazuModules } from "../saju/modules";
import { GLOSSARY } from "./glossary";

const record = (value: unknown): Record<string, unknown> => value && typeof value === "object" ? value as Record<string, unknown> : {};

/** 실제 원국의 위치와 용어의 뜻을 함께 제공한다. 설명을 위해 새 글자를 만들어 넣지 않는다. */
export function buildManseExplanation(modules: SazuModules) {
  const four = record(modules.fourPillars);
  const day = record(four.day);
  const positions = [["year", "태어난 해"], ["month", "태어난 달"], ["day", "태어난 날"], ["hour", "태어난 시각"]] as const;
  const placements = positions.flatMap(([slot, label]) => {
    const cell = record(four[slot]);
    return [["sippiSeong", "sky", "윗글자"], ["earthSippiSeong", "earth", "아랫글자"]].flatMap(([relation, glyph, location]) => {
      const term = cell[relation!];
      const character = cell[glyph!];
      if (typeof term !== "string" || typeof character !== "string" || !GLOSSARY[term]) return [];
      return [{ position: `${label}의 ${location}`, character, term, meaning: GLOSSARY[term]! }];
    });
  });
  const top = record(record(modules.character).드러나는쪽).이름;
  return {
    dayMaster: typeof day.sky === "string" ? { character: day.sky, element: day.skyElement, meaning: GLOSSARY.일간 } : null,
    prominent: typeof top === "string" ? { term: top, meaning: GLOSSARY[top], interpretation: record(record(modules.character).드러나는쪽).모습 } : null,
    placements,
  };
}
