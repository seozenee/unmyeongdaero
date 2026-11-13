import "server-only";

import { getReport } from "@/lib/reports/catalog";
import { buildManseTopics } from "@/lib/manse";
import type { BirthProfile, Reading } from "@/lib/db";
import { buildTemplateReport } from "@/lib/story/report-template";
import { storyReportSchema } from "@/lib/story/report";
import factbombBookPreview from "@/lib/story/__fixtures__/factbomb-book-preview.json";
import destinyBookPreview from "@/lib/story/__fixtures__/destiny-book-preview.json";

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

export function getReadingPreview(slug?: string, reference?: string) {
  const report = getReport(slug ?? "destiny-full");
  if (!report || report.kind !== "report") return null;

  const sample = report.slug === "factbomb" ? factbombBookPreview : report.slug === "destiny-full" ? destinyBookPreview : null;
  const subject: BirthProfile = reference === "sarang" ? {
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

  return { report, subject, sazu, now, templateMode: !sample,
    script: sample ? storyReportSchema.parse(sample.report) : buildTemplateReport(report, reading, sazu, now) };
}
