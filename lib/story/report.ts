// 결제 후 결과물 구조: ① 안내자의 대화형 브리핑 ② 근거가 달린 보고서.
// Claude 구조화 출력 스키마이자 저장 형식(readings.script). 필드 순서 = 생성·스트리밍 순서(브리핑이 먼저 흘러나온다).
import { z } from "zod";

export const STORY_PANELS = ["pillars", "elements", "decade"] as const;
export type StoryPanel = (typeof STORY_PANELS)[number];

export const briefingBeatSchema = z.object({
  speaker: z.enum(["guide", "narration"]),
  text: z.string(),
});

export const evidenceSchema = z.object({
  /** 데이터에 실제 있는 명칭 (예: "2026 병오 세운 · 인오 삼합") */
  label: z.string(),
  /** 그 근거가 결론으로 이어지는 이유 */
  detail: z.string(),
});

export const reportSectionSchema = z.object({
  title: z.string(),
  lead: z.string(),
  body: z.array(z.string()),
  evidence: z.array(evidenceSchema),
  panel: z.enum(STORY_PANELS).nullable(),
});

export const timelineItemSchema = z.object({
  period: z.string(),
  tone: z.enum(["good", "neutral", "caution"]),
  title: z.string(),
  note: z.string(),
});

export const storyReportSchema = z.object({
  briefing: z.array(briefingBeatSchema),
  headline: z.string(),
  summary: z.string(),
  keywords: z.array(z.string()),
  sections: z.array(reportSectionSchema),
  timeline: z.array(timelineItemSchema),
  actions: z.object({ do: z.array(z.string()), avoid: z.array(z.string()) }),
  closing: z.string(),
});

export type BriefingBeat = z.infer<typeof briefingBeatSchema>;
export type ReportSection = z.infer<typeof reportSectionSchema>;
export type TimelineItem = z.infer<typeof timelineItemSchema>;
export type StoryReport = z.infer<typeof storyReportSchema>;

type DeepPartial<T> = T extends Array<infer U>
  ? Array<DeepPartial<U> | undefined>
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

export type PartialStoryReport = DeepPartial<StoryReport>;

export function isCompleteReport(value: unknown): value is StoryReport {
  return storyReportSchema.safeParse(value).success;
}
