import { describe, expect, it } from "vitest";
import { voidBranches } from "../sinsal";
import { HIDDEN_STEMS, branchTenGod, tenGod, twelveStage, type Branch, type Stem } from "../tables";
import { parseGanji } from "../../saju/ganji";

/**
 * 원국 판이 적는 값.
 *
 * 결과 화면의 판(FourPillarsChart)은 서버에서 받아 오지 않고 여덟 글자만 가지고
 * 브라우저에서 센다. 그래서 표가 틀리면 조용히 틀린다 — 화면에는 그럴듯한 한자가
 * 그대로 깔려 있기 때문이다. 손으로 따져 둔 표본 하나를 박아 두고, 표가 바뀌면
 * 여기서 먼저 깨지게 한다.
 *
 * 표본: 1998-05-19 09:30 서울 → 무인(년) 정사(월) 병인(일) 임진(시)
 */
describe("원국 판 — 손으로 따진 값과 맞춰 보기", () => {
  const pillars = { day: "병인" };
  const dayStem = parseGanji(pillars.day)!.stem.ko as Stem;
  const dayBranch = parseGanji(pillars.day)!.branch.ko as Branch;

  it("일간은 병이다", () => {
    expect(dayStem).toBe("병");
  });

  it("천간 십성 — 시 임은 편관, 월 정은 겁재, 년 무는 식신", () => {
    expect(tenGod(dayStem, "임")).toBe("편관");
    expect(tenGod(dayStem, "정")).toBe("겁재");
    expect(tenGod(dayStem, "무")).toBe("식신");
  });

  it("지지 십성 — 진은 식신, 인은 편인, 사는 겁재", () => {
    expect(branchTenGod(dayStem, "진")).toBe("식신");
    expect(branchTenGod(dayStem, "인")).toBe("편인");
    expect(branchTenGod(dayStem, "사")).toBe("겁재");
  });

  it("십이운성 — 병의 장생은 인, 사는 건록, 진은 관대", () => {
    expect(twelveStage(dayStem, "인")).toBe("장생");
    expect(twelveStage(dayStem, "사")).toBe("건록");
    expect(twelveStage(dayStem, "진")).toBe("관대");
  });

  it("지장간 — 사는 무·경·병, 인은 무·병·갑", () => {
    expect(HIDDEN_STEMS["사"]).toEqual(["무", "경", "병"]);
    expect(HIDDEN_STEMS["인"]).toEqual(["무", "병", "갑"]);
  });

  it("병인일주는 갑자순(갑자~계유)에 들어 술·해가 공망이다", () => {
    expect(voidBranches(dayStem, dayBranch)).toEqual(["술", "해"]);
  });
});
