export { CardReportReader as ReportDocument } from "./CardReportReader";
import type { BasisFact } from "@/lib/saju/basis";
import type { CharacterPanel, DecadeItem, ElementCounts, FourPillarsInput, YearItem } from "@/lib/saju/modules";
import type { Guide } from "@/lib/story/guides";
import type { StoryReport } from "@/lib/story/report";
import type { ReadingCardWindows } from "@/lib/story/cards";

export interface ReportPanels {
  outlook?: import("@/lib/manse/outlook").ActionableOutlook;
  /** 읽기 전에 보여 주는 계산된 성격 */
  character?: CharacterPanel | null;
  birthLabel?: string;
  pillars: FourPillarsInput | null;
  counts: ElementCounts | null;
  decade: { items: DecadeItem[]; direction?: string; currentIndex: number } | null;
  years: { items: YearItem[]; currentYear: number } | null;
}

export interface ReportDocumentProps {
  readingId?: string;
  report: StoryReport;
  guide: Guide;
  categoryLabel: string;
  title: string;
  subjectName: string;
  partnerName: string | null;
  issuedAt: string;
  panels: ReportPanels;
  basisFacts: BasisFact[];
  glossary: Record<string, string>;
  disclaimer?: string;
  timingWindows?: ReadingCardWindows;
}
