import type { ReportSection } from "@/lib/story/report";
import { GlossaryText } from "./GlossaryText";

export function ReadingCardBasis({ section, glossary }: { section: ReportSection; glossary: Record<string, string> }) {
  return <>
    <ul className="flex flex-col gap-5">{section.evidence.map(item => <li key={item.label} className="flex flex-col gap-2"><GlossaryText text={item.label} glossary={glossary} className="text-base font-semibold text-on-surface" /><p className="text-sm leading-[1.9] text-on-surface-variant">{item.detail}</p></li>)}</ul>
  </>;
}
