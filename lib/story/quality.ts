import type { ReportProduct } from "@/lib/reports/catalog";
import type { StoryReport } from "./report";

/** 이미 지난 날짜를 앞으로 할 일로 제안하는 항목은 최종 목록에서 제외한다. */
export function removePastActions(report: StoryReport, today: string): StoryReport {
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7));
  const current = (action: string) => {
    for (const match of Array.from(action.matchAll(/(\d{4})(?:\s*[~–-]\s*(\d{4}))?\s*년/g))) {
      const endYear = Number(match[2] ?? match[1]);
      if (endYear < year) return false;
      if (endYear === year) {
        const rest = action.slice(match.index! + match[0].length);
        const datedMonth = rest.match(/^\s*(\d{1,2})(?:\s*[~–-]\s*(\d{1,2}))?월/);
        if (datedMonth && Number(datedMonth[2] ?? datedMonth[1]) < month) return false;
      }
    }
    return true;
  };
  return { ...report, actions: { do: report.actions.do.filter(current), avoid: report.actions.avoid.filter(current) } };
}

/** JSON 모양이 맞아도 목차나 설명·근거가 비어 있으면 구매한 보고서로 저장하지 않는다. */
export function assertReportContent(report: StoryReport, product: Pick<ReportProduct, "chapters">): void {
  const errors: string[] = [];
  const filled = (text: string) => text.trim().length > 0;
  if (!filled(report.headline) || !filled(report.summary) || !filled(report.closing)) errors.push("요약 누락");
  if (report.briefing.length < 3 || report.briefing.some((beat) => !filled(beat.text))) errors.push("브리핑 누락");
  if (report.sections.length !== product.chapters.length) errors.push("목차 개수 불일치");
  report.sections.forEach((section, index) => {
    if (section.title !== product.chapters[index]) errors.push(`목차 ${index + 1} 불일치`);
    if (!filled(section.lead) || section.body.filter(filled).length < 2) errors.push(`설명 ${index + 1} 누락`);
    if (!section.evidence.length || section.evidence.some((item) => !filled(item.label) || !filled(item.detail))) {
      errors.push(`근거 ${index + 1} 누락`);
    }
  });
  for (const key of ["do", "avoid"] as const) {
    const items = report.actions[key].map((item) => item.trim()).filter(Boolean);
    if (new Set(items).size < 3) errors.push(`실행 항목 ${key} 부족`);
  }
  if (errors.length) throw new Error(`[report-quality] ${errors.join(", ")}`);
}

/** 저장 직전 편집 검사. 분량을 반복 문장으로 채우거나 임시 문구를 남긴 결과는 재검수한다. */
export function assertReportEditorialQuality(report: StoryReport): void {
  const errors: string[] = [];
  const punctuation = new RegExp("[\\s\\p{P}\\p{S}]", "gu");
  const normalize = (value: string) => value.normalize("NFKC").replace(punctuation, "");
  const leads = new Set<string>();
  report.sections.forEach((section, index) => {
    const label = `설명 ${index + 1}`;
    const paragraphs = section.body.map(normalize).filter(Boolean);
    if (paragraphs.join("").length < 180) errors.push(`${label} 깊이 부족: 근거와 생활 예시를 구체적으로 설명`);
    const meaningful = paragraphs.filter(text => text.length >= 40);
    if (new Set(meaningful).size !== meaningful.length) errors.push(`${label} 문단 반복`);
    const lead = normalize(section.lead);
    if (lead.length >= 15 && leads.has(lead)) errors.push(`${label} 다른 장과 결론 중복`);
    leads.add(lead);
    if (/\[(?:TODO|TBD|작성\s*예정|내용\s*추가)\]|<\/?(?:draft|chapter_plan|sazu|modules)>/i.test([section.lead, ...section.body].join("\n"))) errors.push(`${label} 미완성 문구`);
  });
  if (errors.length) throw new Error(`[report-quality] ${errors.join(", ")}`);
}
