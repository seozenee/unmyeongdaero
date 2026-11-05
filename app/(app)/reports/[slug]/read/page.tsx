import { outlookSchema } from "@/lib/manse/outlook";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ReadingExperience } from "@/components/story/ReadingExperience";
import { getCurrentUser, loginUrl } from "@/lib/auth/session";
import { getRepository } from "@/lib/db";
import { modes } from "@/lib/env";
import { productAccent, productThemeStyle } from "@/lib/reports/accents";
import { loadReport } from "@/lib/reports/store";
import { buildBasisFacts } from "@/lib/saju/basis";
import {
  findCurrentDecadeIndex,
  parseCharacter,
  parseDecadeFortune,
  parseElementCounts,
  parseFourPillars,
  parseYearRun,
  resolveCurrentAge,
} from "@/lib/saju/modules";
import { isSampleReading, mergedGlossary, mergedModules } from "@/lib/sazu/readings";
import { isCompleteReport } from "@/lib/story/report";
import { needsCalendarRepair, needsScopeRepair } from "@/lib/readings/calculation";
import { buildManseTopics } from "@/lib/manse";
import { readingCardWindows } from "@/lib/story/cards";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false } };

const dateFormat = new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric" });

export default async function ReportReadPage({ params }: { params: { slug: string } }) {
  const report = await loadReport(params.slug);
  if (!report || report.kind !== "report") notFound();

  const user = await getCurrentUser();
  if (!user) redirect(loginUrl(`/reports/${report.slug}/read`));

  const repo = getRepository();
  const purchase = await repo.getPurchase(user.id, report.slug);
  const reading = purchase?.readingId ? await repo.getReading(purchase.readingId) : null;
  if (!purchase || !reading) redirect(`/reports/${report.slug}`);
  if (reading.reportSlug !== report.slug) redirect(`/reports/${reading.reportSlug}/read`);

  const calendarRepair = needsCalendarRepair(reading);
  const scopeRepair = needsScopeRepair(reading);
  const sazu = calendarRepair || scopeRepair ? buildManseTopics(report.topics, reading.subject, reading.partner) : reading.sazu ?? {};
  const modules = mergedModules(sazu);
  const decade = parseDecadeFortune(modules);
  const yearRun = parseYearRun(modules);
  const now = new Date();
  const age = resolveCurrentAge(
    modules,
    { year: reading.subject.birthYear, month: reading.subject.birthMonth, day: reading.subject.birthDay },
    { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() },
  );
  const readyReport = !calendarRepair && !scopeRepair && reading.status === "ready" && isCompleteReport(reading.script) ? reading.script : null;

  return (
    <div className="product-theme w-full" style={productThemeStyle(report.slug)}><ReadingExperience
      key={reading.id}
      readingId={reading.id}
      accent={productAccent(report.slug)}
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
      hasNotifyPhone={Boolean(reading.notifyPhone)}
      calendarRepair={calendarRepair}
      scopeRepair={scopeRepair}
      timingWindows={readingCardWindows(modules, new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(now), report)}
      panels={{
        birthLabel: `${reading.subject.isLunar ? "음력 " : ""}${reading.subject.birthYear}.${String(reading.subject.birthMonth).padStart(2, "0")}.${String(reading.subject.birthDay).padStart(2, "0")} ${reading.subject.birthHour === null ? "시각 모름" : `${String(reading.subject.birthHour).padStart(2, "0")}:${String(reading.subject.birthMinute ?? 0).padStart(2, "0")}`}`,
        /*
          연도별·평생 흐름은 모든 상품에 넣는다.

          전에는 평생·종합·팩폭 세 상품만 받았다. 그런데 "올해 재물운은 어떤지, 뭘 조심할지"
          는 어느 상품을 산 사람이든 가장 먼저 찾는 자리다. 계산은 이미 모든 명식에서 하고
          있었으니(actionableOutlook), 읽을 기회를 세 상품으로 막아 둘 이유가 없다.
        */
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
      sample={isSampleReading(sazu)}
      templateMode={modes.ai() === "template"}
    /></div>
  );
}
