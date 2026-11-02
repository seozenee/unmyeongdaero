import type { Reading } from "../db/types";
import { getReport } from "../reports/catalog";
import { KOREAN_CALENDAR_VERSION } from "../manse/calendar";
import { REPORT_CONTENT_VERSION } from "../story/version";

/** 예전 음력 자료는 양력 변환 전 날짜로 대운을 세었다. 완성본도 새 기준으로 한 번 보완한다. */
export function needsCalendarRepair(reading: Pick<Reading, "subject" | "partner" | "sazu">): boolean {
  if (!reading.subject.isLunar && !reading.partner?.isLunar) return false;
  const basis = reading.sazu?.manse?.modules.basis as { calendarVersion?: string } | undefined;
  return basis?.calendarVersion !== KOREAN_CALENDAR_VERSION;
}

/** 옛 직업 중심 목차로 완성된 종합·팩폭은 같은 열람권으로 새 전반 풀이를 한 번 보완한다. */
export function needsScopeRepair(reading: Pick<Reading, "status" | "reportSlug"> & { script: unknown }): boolean {
  if (reading.status !== "ready" || !["factbomb", "destiny-full"].includes(reading.reportSlug)) return false;
  const product = getReport(reading.reportSlug);
  const saved = reading.script as { contentVersion?: string; sections?: Array<{ title?: string }> } | null;
  const sections = saved?.sections;
  return Boolean(product && (saved?.contentVersion !== REPORT_CONTENT_VERSION || !sections || sections.length !== product.chapters.length || sections.some((section, index) => section.title !== product.chapters[index])));
}

export function needsReadingRepair(reading: Pick<Reading, "subject" | "partner" | "sazu" | "status" | "reportSlug" | "script">): boolean {
  return needsCalendarRepair(reading) || needsScopeRepair(reading);
}
