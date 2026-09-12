import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ReadingExperience } from "@/components/story/ReadingExperience";
import { getCurrentUser, loginUrl } from "@/lib/auth/session";
import { getRepository } from "@/lib/db";
import { modes } from "@/lib/env";
import { getReport } from "@/lib/reports/catalog";
import { buildBasisFacts } from "@/lib/saju/basis";
import {
  findCurrentDecadeIndex,
  parseDecadeFortune,
  parseElementCounts,
  parseFourPillars,
  resolveCurrentAge,
} from "@/lib/saju/modules";
import { isSampleReading, mergedGlossary, mergedModules } from "@/lib/sazu/readings";
import { isCompleteReport } from "@/lib/story/report";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false } };

const dateFormat = new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric" });

export default async function ReportReadPage({ params }: { params: { slug: string } }) {
  const report = getReport(params.slug);
  if (!report || report.kind !== "report") notFound();

  const user = await getCurrentUser();
  if (!user) redirect(loginUrl(`/reports/${report.slug}/read`));

  const repo = getRepository();
  const purchase = await repo.getPurchase(user.id, report.slug);
  const reading = purchase?.readingId ? await repo.getReading(purchase.readingId) : null;
  if (!purchase || !reading) redirect(`/reports/${report.slug}`);

  const sazu = reading.sazu ?? {};
  const modules = mergedModules(sazu);
  const decade = parseDecadeFortune(modules);
  const now = new Date();
  const age = resolveCurrentAge(
    modules,
    { year: reading.subject.birthYear, month: reading.subject.birthMonth, day: reading.subject.birthDay },
    { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() },
  );
  const readyReport = reading.status === "ready" && isCompleteReport(reading.script) ? reading.script : null;

  return (
    <ReadingExperience
      readingId={reading.id}
      guideId={report.guide}
      categoryLabel={report.categoryLabel}
      title={report.title}
      chapters={report.chapters}
      subjectName={reading.subject.name}
      partnerName={reading.partner?.name ?? null}
      issuedAt={dateFormat.format(new Date(reading.generatedAt ?? reading.createdAt))}
      initialStatus={readyReport ? "ready" : reading.status === "ready" ? "draft" : reading.status}
      initialReport={readyReport}
      initialError={reading.error}
      panels={{
        pillars: parseFourPillars(modules),
        counts: parseElementCounts(modules),
        decade: decade ? { ...decade, currentIndex: findCurrentDecadeIndex(decade.items, age) } : null,
      }}
      basisFacts={buildBasisFacts(modules)}
      glossary={mergedGlossary(sazu)}
      disclaimer={report.disclaimer}
      sample={isSampleReading(sazu)}
      templateMode={modes.ai() === "template"}
    />
  );
}
