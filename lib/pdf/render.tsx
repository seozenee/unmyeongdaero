import "server-only";

import { renderToBuffer } from "@react-pdf/renderer";
import { GLOSSARY } from "@/lib/manse/glossary";
import { voidBranches } from "@/lib/manse/sinsal";
import {
  HIDDEN_STEMS,
  branchTenGod,
  tenGod,
  twelveStage,
  type Branch,
  type Stem,
} from "@/lib/manse/tables";
import type { BirthProfile } from "@/lib/db/types";
import type { StoredSazu } from "@/lib/db/types";
import type { ReportProduct } from "@/lib/reports/catalog";
import { parseElementCounts, parseFourPillars } from "@/lib/saju/modules";
import { mergedModules } from "@/lib/sazu/readings";
import type { StoryReport } from "@/lib/story/report";
import { registerFonts } from "./fonts";
import { ReportDocument } from "./ReportDocument";
import type { PillarCell } from "./parts";
import { ELEMENT_COLOR, palette } from "./theme";

const SLOT_LABEL = { year: "년주", month: "월주", day: "일주", hour: "시주" } as const;
const ELEMENT_OF_KEY = { wood: "목", fire: "화", earth: "토", metal: "금", water: "수" } as const;

type Json = unknown;
const at = (value: Json, path: string): Json =>
  path.split(".").reduce<Json>(
    (current, key) => (current && typeof current === "object" ? (current as Record<string, Json>)[key] : undefined),
    value,
  );
const str = (value: Json) => (typeof value === "string" ? value : null);

/**
 * 원국 네 칸. 시주를 모르면 세 칸만 낸다.
 *
 * 십성·십이운성·지장간·공망은 받아 온 값을 읽지 않고 여덟 글자에서 직접 센다.
 * 화면 판(components/saju/FourPillarsChart)도 같은 표를 쓰므로, 종이와 화면이
 * 서로 다른 말을 할 일이 없다. 받아 온 값에 빈 칸이 있어도 판은 채워진다.
 *
 * 명리 관습대로 오른쪽에서 왼쪽으로 년·월·일·시를 읽으니, 지면에는 시주를 가장
 * 왼쪽에 둔다.
 */
function pillarCells(modules: Record<string, unknown>): PillarCell[] {
  const ganjiOf = (slot: string) => str(at(modules, `fourPillars.${slot}.full`));
  const dayGanji = ganjiOf("day");
  const dayStem = dayGanji ? (dayGanji[0] as Stem) : null;
  const dayBranch = dayGanji ? (dayGanji[1] as Branch) : null;
  const voids = dayStem && dayBranch ? voidBranches(dayStem, dayBranch) : [];

  const cells: PillarCell[] = [];
  for (const slot of ["hour", "day", "month", "year"] as const) {
    const ganji = ganjiOf(slot);
    if (!ganji) continue;
    const stem = ganji[0] as Stem;
    const branch = ganji[1] as Branch;
    const mine = slot === "day";

    cells.push({
      slot: SLOT_LABEL[slot],
      stem,
      branch,
      // 일주의 천간은 일간 자신이다. 자기와의 관계를 "비견"이라 적으면 읽는 사람이 헷갈린다.
      stemGod: mine ? "일간" : dayStem ? tenGod(dayStem, stem) : "-",
      branchGod: dayStem ? branchTenGod(dayStem, branch) : "-",
      stage: dayStem ? twelveStage(dayStem, branch) : "-",
      hidden: HIDDEN_STEMS[branch]?.join("·") ?? "",
      empty: voids.includes(branch),
      stemColor: ELEMENT_COLOR[elementOfStem(stem)] ?? palette.ink,
      branchColor: ELEMENT_COLOR[elementOfBranch(branch)] ?? palette.ink,
      mine,
    });
  }
  return cells;
}

const STEM_ELEMENT_KO: Record<string, string> = {
  갑: "목", 을: "목", 병: "화", 정: "화", 무: "토",
  기: "토", 경: "금", 신: "금", 임: "수", 계: "수",
};
const elementOfStem = (stem: string) => STEM_ELEMENT_KO[stem] ?? "토";

const BRANCH_ELEMENT_KO: Record<string, string> = {
  자: "수", 축: "토", 인: "목", 묘: "목", 진: "토", 사: "화",
  오: "화", 미: "토", 신: "금", 유: "금", 술: "토", 해: "수",
};
const elementOfBranch = (branch: string) => BRANCH_ELEMENT_KO[branch] ?? "토";

function elementRows(modules: Record<string, unknown>) {
  const counts = parseElementCounts(modules);
  if (!counts) return [];
  return (Object.keys(ELEMENT_OF_KEY) as Array<keyof typeof ELEMENT_OF_KEY>).map((key) => ({
    element: ELEMENT_OF_KEY[key],
    count: counts[key] ?? 0,
  }));
}

/**
 * 보고서에 실제로 나온 용어만 골라 싣는다.
 *
 * 본문 검색은 두 글자 이상만 한다. 십이운성의 '사·절·태·양' 같은 한 글자 용어는
 * "사주"·"사람"·"태어난" 처럼 아무 말에나 걸려, 쓰지도 않은 뜻풀이가 줄줄이 올라온다.
 * 대신 원국표에 실제로 찍힌 한 글자 용어는 chartTerms 로 따로 받아 반드시 싣는다.
 */
function usedGlossary(report: StoryReport, chartTerms: readonly string[]) {
  const body = [
    report.headline,
    report.summary,
    ...report.keywords,
    ...report.sections.flatMap((section) => [section.lead, ...section.body, ...section.evidence.map((item) => `${item.label} ${item.detail}`)]),
    ...report.timeline.map((item) => `${item.period} ${item.title} ${item.note}`),
    report.closing,
  ].join("\n");

  const used = new Set(chartTerms);
  for (const term of Object.keys(GLOSSARY)) {
    if (term.length >= 2 && body.includes(term)) used.add(term);
  }

  // 용어집에 적힌 차례대로 낸다 — 뼈대 → 오행 → 십성 → 운성 순이라 읽기 좋다
  return Object.entries(GLOSSARY)
    .filter(([term]) => used.has(term))
    .map(([term, meaning]) => ({ term, meaning }));
}

/** 원국표에 찍힌 십성·십이운성 — 한 글자여도 뜻을 실어야 하는 용어들 */
const chartTerms = (cells: PillarCell[]) =>
  cells
    .flatMap((cell) => [cell.stemGod, cell.branchGod, cell.stage, cell.empty ? "공망" : ""])
    .filter((term) => term !== "-" && term !== "");

const ISSUED = new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Seoul" });

export interface RenderReportPdfInput {
  product: ReportProduct;
  report: StoryReport;
  subject: BirthProfile;
  sazu: StoredSazu;
  issuedAt?: Date;
}

/** 보고서 한 건을 PDF 로 굽는다 */
export async function renderReportPdf(input: RenderReportPdfInput): Promise<Buffer> {
  registerFonts();

  const modules = mergedModules(input.sazu);
  const cells = pillarCells(modules);
  const parsed = parseFourPillars(modules);
  const chartLine = parsed
    ? [parsed.year, parsed.month, parsed.day, parsed.hour].filter(Boolean).join(" ")
    : "";

  return renderToBuffer(
    <ReportDocument
      report={input.report}
      productTitle={input.product.title}
      categoryLabel={input.product.categoryLabel}
      subject={input.subject}
      pillars={cells}
      chartLine={chartLine}
      elements={elementRows(modules)}
      glossary={usedGlossary(input.report, chartTerms(cells))}
      issuedAt={ISSUED.format(input.issuedAt ?? new Date())}
      disclaimer={input.product.disclaimer}
    />,
  );
}

/** 파일 이름 — 카톡·다운로드에서 그대로 보인다 */
export function reportPdfFilename(product: ReportProduct, subject: BirthProfile) {
  // 한글·영문·숫자만 남긴다. 유니코드 속성 이스케이프는 이 프로젝트의 컴파일 대상보다 나중 문법이라 쓰지 않는다.
  const safe = (value: string) => value.replace(/[^가-힣a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `운명대로_${safe(product.title)}_${safe(subject.name)}.pdf`;
}
