import type { Reading } from "../db/types";
import { KOREAN_CALENDAR_VERSION } from "../manse/calendar";

/** 예전 음력 자료는 양력 변환 전 날짜로 대운을 세었다. 완성본도 새 기준으로 한 번 보완한다. */
export function needsCalendarRepair(reading: Pick<Reading, "subject" | "partner" | "sazu">): boolean {
  if (!reading.subject.isLunar && !reading.partner?.isLunar) return false;
  const basis = reading.sazu?.manse?.modules.basis as { calendarVersion?: string } | undefined;
  return basis?.calendarVersion !== KOREAN_CALENDAR_VERSION;
}
