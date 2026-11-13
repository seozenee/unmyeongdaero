import { outlookSchema } from "@/lib/manse/outlook";
import { notFound } from "next/navigation";
import { ReadingExperience } from "@/components/story/ReadingExperience";
import { productAccent, productThemeStyle } from "@/lib/reports/accents";
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
import { getReadingPreview } from "@/lib/story/reading-preview";
import { readingCardWindows } from "@/lib/story/cards";

// 개발 환경 전용: 완성된 풀이 화면을 템플릿 보고서로 확인한다. (?slug=... 로 상품을 바꾼다)
export const dynamic = "force-dynamic";

export default async function ReadingPreviewPage({ searchParams: searchParamsPromise }: { searchParams: Promise<{ slug?: string; reference?: string }> }) {
  const searchParams = await searchParamsPromise;
  if (process.env.NODE_ENV === "production") notFound();

  const preview = getReadingPreview(searchParams.slug, searchParams.reference);
  if (!preview) notFound();
  const { report, subject, sazu, now, script, templateMode } = preview;
  const pdfQuery = new URLSearchParams({ slug: report.slug });
  if (searchParams.reference) pdfQuery.set("reference", searchParams.reference);

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
      initialReport={script}
      pdfUrl={`/dev/reading-preview/pdf?${pdfQuery}`}
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
      templateMode={templateMode}
    /></div>
  );
}
