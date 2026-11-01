import KoreanLunarCalendar from "korean-lunar-calendar";

export const KOREAN_CALENDAR_VERSION = "korean-v1";

/** 한국 음력 기준. 중국 음력과 날짜·윤달이 다른 해가 있으므로 변환을 분리한다. */
export function koreanLunarToSolar(year: number, month: number, day: number, leap = false) {
  const calendar = new KoreanLunarCalendar();
  if (!calendar.setLunarDate(year, month, day, leap)) return null;
  const checked = calendar.getLunarCalendar();
  if (checked.year !== year || checked.month !== month || checked.day !== day || Boolean(checked.intercalation) !== leap) return null;
  const solar = calendar.getSolarCalendar();
  return { year: solar.year, month: solar.month, day: solar.day };
}
