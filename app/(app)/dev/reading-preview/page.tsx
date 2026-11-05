import { outlookSchema } from "@/lib/manse/outlook";
import { notFound } from "next/navigation";
import { ReadingExperience } from "@/components/story/ReadingExperience";
import { productAccent, productThemeStyle } from "@/lib/reports/accents";
import { getReport } from "@/lib/reports/catalog";
import { buildManseTopics } from "@/lib/manse";
import { buildBasisFacts } from "@/lib/saju/basis";
import {
  findCurrentDecadeIndex,
  parseDecadeFortune,
  parseElementCounts,
  parseCharacter,
  parseFourPillars,
  parseYearRun,
  resolveCurrentAge,
} from "@/lib/saju/modules";
import { mergedGlossary, mergedModules } from "@/lib/sazu/readings";
import { buildTemplateReport } from "@/lib/story/report-template";
import type { BirthProfile, Reading } from "@/lib/db";
import { readingCardWindows } from "@/lib/story/cards";
import { storyReportSchema } from "@/lib/story/report";
import factbombBookPreview from "@/lib/story/__fixtures__/factbomb-book-preview.json";
import destinyBookPreview from "@/lib/story/__fixtures__/destiny-book-preview.json";

// 개발 환경 전용: 완성된 풀이 화면을 템플릿 보고서로 확인한다. (?slug=... 로 상품을 바꾼다)
export const dynamic = "force-dynamic";

const DEFAULT_SUBJECT: BirthProfile = {
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

export default function ReadingPreviewPage({ searchParams }: { searchParams: { slug?: string; reference?: string } }) {
  if (process.env.NODE_ENV === "production") notFound();

  const report = getReport(searchParams.slug ?? "destiny-full");
  if (!report || report.kind !== "report") notFound();

  const sample = report.slug === "factbomb" ? factbombBookPreview : report.slug === "destiny-full" ? destinyBookPreview : null;
  const subject: BirthProfile = searchParams.reference === "sarang" ? {
    name: "김사랑", birthYear: 2015, birthMonth: 6, birthDay: 26, birthHour: 16, birthMinute: 10,
    isFemale: true, isLunar: false, birthCity: "서울",
  } : sample?.subject ?? DEFAULT_SUBJECT;
  const now = sample ? new Date(sample.referenceDate) : new Date();
  const sazu = buildManseTopics(report.topics, subject, null, now);
  const reading = {
    id: "preview",
    userId: "preview",
    reportSlug: report.slug,
    subject,
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
    { year: subject.birthYear, month: subject.birthMonth, day: subject.birthDay },
    { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() },
  );

  return (
    <div className="product-theme w-full" style={productThemeStyle(report.slug)}><p className="mb-3 text-xs text-on-surface-variant">{searchParams.reference === "sarang" ? "사용자 제공 사례 · 양력·서울·여성 가정 · 16:10 기준" : "가상 인물로 만든 미리보기예요."}</p><ReadingExperience
      key={report.slug}
      readingId={`preview-${report.slug}-${searchParams.reference ?? "default"}`}
      accent={productAccent(report.slug)}
      guideId={report.guide}
      categoryLabel={report.categoryLabel}
      title={report.title}
      chapters={report.chapters}
      subjectName={subject.name}
      partnerName={null}
      issuedAt={new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric" }).format(now)}
      initialStatus="ready"
      initialReport={sample ? storyReportSchema.parse(sample.report) : buildTemplateReport(report, reading, sazu, now)}
      initialError={null}
      timingWindows={readingCardWindows(modules, new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(now), report)}
      panels={{
        birthLabel: `${subject.birthYear}.${String(subject.birthMonth).padStart(2, "0")}.${String(subject.birthDay).padStart(2, "0")} ${subject.birthHour === null ? "시각 모름" : `${String(subject.birthHour).padStart(2, "0")}:${String(subject.birthMinute ?? 0).padStart(2, "0")}`}`,
        outlook: outlookSchema.safeParse(modules.actionableOutlook).data,
        character: parseCharacter(modules),
        pillars: parseFourPillars(modules),
        counts: parseElementCounts(modules),
        decade: decade ? { ...decade, currentIndex: findCurrentDecadeIndex(decade.items, age) } : null,
        years: yearRun ? { items: yearRun, currentYear: now.getFullYear() } : null,
      }}
      basisFacts={buildBasisFacts(modules)}
      glossary={mergedGlossary(sazu)}
      disclaimer={report.disclaimer}
      sample={false}
      templateMode={!sample}
    /></div>
  );
}
