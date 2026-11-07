import type { Reading } from "../db/types";
import { getReport } from "../reports/catalog";
import { KOREAN_CALENDAR_VERSION } from "../manse/calendar";
import { READABLE_CONTENT_VERSIONS } from "../story/version";

/** 예전 음력 자료는 양력 변환 전 날짜로 대운을 세었다. 완성본도 새 기준으로 한 번 보완한다. */
export function needsCalendarRepair(reading: Pick<Reading, "subject" | "partner" | "sazu">): boolean {
  if (!reading.subject.isLunar && !reading.partner?.isLunar) return false;
  const basis = reading.sazu?.manse?.modules.basis as { calendarVersion?: string } | undefined;
  return basis?.calendarVersion !== KOREAN_CALENDAR_VERSION;
}

/** 모든 기존 상품을 같은 열람권으로 공통 설명 밀도·목차 기준에 맞춰 한 번 보완한다. */
export function needsScopeRepair(reading: Pick<Reading, "status" | "reportSlug"> & { script: unknown }): boolean {
  if (reading.status !== "ready") return false;
  const product = getReport(reading.reportSlug);
  const saved = reading.script as { contentVersion?: string; sections?: Array<{ title?: string }> } | null;
  const sections = saved?.sections;
  // 판이 올라갔다는 이유만으로 다시 쓰지 않는다(story/version.ts 주석). 목차가 실제로
  // 어긋났을 때만 다시 쓴다 — 장 개수가 다르거나, 제목이 상품 목차와 맞지 않을 때다.
  return Boolean(product?.kind === "report" && (
    !saved?.contentVersion || !READABLE_CONTENT_VERSIONS.includes(saved.contentVersion)
    || !sections || sections.length !== product.chapters.length
    || sections.some((section, index) => section.title !== product.chapters[index])
  ));
}

export function needsReadingRepair(reading: Pick<Reading, "subject" | "partner" | "sazu" | "status" | "reportSlug" | "script">): boolean {
  return needsCalendarRepair(reading) || needsScopeRepair(reading);
}
