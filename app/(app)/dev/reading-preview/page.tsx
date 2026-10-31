import { notFound } from "next/navigation";
import { ReadingExperience } from "@/components/story/ReadingExperience";
import { productAccent } from "@/lib/reports/accents";
import { getReport } from "@/lib/reports/catalog";
import { buildManseTopics } from "@/lib/manse";
import { buildBasisFacts } from "@/lib/saju/basis";
import {
  findCurrentDecadeIndex,
  parseDecadeFortune,
  parseElementCounts,
  parseFourPillars,
  parseYearRun,
  resolveCurrentAge,
} from "@/lib/saju/modules";
import { mergedGlossary, mergedModules } from "@/lib/sazu/readings";
import { buildTemplateReport } from "@/lib/story/report-template";
import type { BirthProfile, Reading } from "@/lib/db";

// 개발 환경 전용: 완성된 풀이 화면을 템플릿 보고서로 확인한다. (?slug=... 로 상품을 바꾼다)
export const dynamic = "force-dynamic";

const SUBJECT: BirthProfile = {
  name: "서하",
  birthYear: 1998,
  birthMonth: 5,
  birthDay: 19,
  birthHour: 9,
  birthMinute: 30,
  isFemale: true,
  isLunar: false,
  birthCity: "서울",
};

export default function ReadingPreviewPage({ searchParams }: { searchParams: { slug?: string } }) {
  if (process.env.NODE_ENV === "production") notFound();

  const report = getReport(searchParams.slug ?? "destiny-full");
  if (!report || report.kind !== "report") notFound();

  const now = new Date();
  const sazu = buildManseTopics(report.topics, SUBJECT, null, now);
  const reading = {
    id: "preview",
    userId: "preview",
    reportSlug: report.slug,
    subject: SUBJECT,
    partner: null,
    answers: {},
    status: "ready",
    sazu,
    script: null,
    error: null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    generatedAt: now.toISOString(),
    notifyPhone: null,
    notifyConsentAt: null,
    notifiedKind: null,
    pdfPath: null,
  } as Reading;

  const modules = mergedModules(sazu);
  const decade = parseDecadeFortune(modules);
  const yearRun = parseYearRun(modules);
  const age = resolveCurrentAge(
    modules,
    { year: SUBJECT.birthYear, month: SUBJECT.birthMonth, day: SUBJECT.birthDay },
    { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() },
  );

  return (
    <ReadingExperience
      readingId={reading.id}
      accent={productAccent(report.slug)}
      guideId={report.guide}
      categoryLabel={report.categoryLabel}
      title={report.title}
      chapters={report.chapters}
      subjectName={SUBJECT.name}
      partnerName={null}
      issuedAt="2026년 10월 24일"
      initialStatus="ready"
      initialReport={buildTemplateReport(report, reading, sazu, now)}
      initialError={null}
      panels={{
        pillars: parseFourPillars(modules),
        counts: parseElementCounts(modules),
        decade: decade ? { ...decade, currentIndex: findCurrentDecadeIndex(decade.items, age) } : null,
        years: yearRun ? { items: yearRun, currentYear: now.getFullYear() } : null,
      }}
      basisFacts={buildBasisFacts(modules)}
      glossary={mergedGlossary(sazu)}
      disclaimer={report.disclaimer}
      sample={false}
      templateMode
    />
  );
}
