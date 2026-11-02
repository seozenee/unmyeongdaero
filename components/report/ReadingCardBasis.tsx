import { DecadeTimeline } from "@/components/saju/DecadeTimeline";
import { FiveElementsRadar } from "@/components/saju/FiveElementsRadar";
import { FourPillarsChart } from "@/components/saju/FourPillarsChart";
import { YearFlowTable } from "@/components/saju/YearFlowTable";
import type { ReportSection } from "@/lib/story/report";
import { GlossaryText } from "./GlossaryText";
import type { ReportPanels } from "./ReportDocument";

export function ReadingCardBasis({ section, panels, glossary }: { section: ReportSection; panels: ReportPanels; glossary: Record<string, string> }) {
  return <>
    {section.panel === "pillars" && panels.pillars && <FourPillarsChart pillars={panels.pillars} />}
    {section.panel === "elements" && panels.counts && <FiveElementsRadar counts={panels.counts} />}
    {section.panel === "decade" && panels.decade && <DecadeTimeline {...panels.decade} />}
    {section.panel === "years" && panels.years && <YearFlowTable {...panels.years} />}
    <ul className="flex flex-col gap-5">{section.evidence.map(item => <li key={item.label} className="flex flex-col gap-2"><GlossaryText text={item.label} glossary={glossary} className="text-base font-semibold text-on-surface" /><p className="text-sm leading-[1.9] text-on-surface-variant">{item.detail}</p></li>)}</ul>
  </>;
}
