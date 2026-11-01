import "server-only";

import type { ReportProduct } from "./catalog";
import { buildManseTopics } from "../manse";
import { buildFallbackPreview, buildPreviewContext } from "../manse/preview";

export interface WritingSample { title: string; lead: string; paragraphs: string[]; caption: string }

/** 실고객 정보가 아닌 고정 가상 명식으로 문체를 보여 준다. AI 호출·고객 데이터 조회는 하지 않는다. */
export function buildDetailWritingSample(product: ReportProduct): WritingSample | null {
  const profile = { name: "예시", birthYear: product.roles?.subject === "child" || product.category === "study" ? 2014 : 1995,
    birthMonth: 5, birthDay: 19, birthHour: 12, birthMinute: 30, isFemale: true, isLunar: false, birthCity: "서울" };
  const now = new Date("2026-11-01T03:00:00Z");
  const modules = buildManseTopics([], profile, null, now).manse!.modules;
  const context = buildPreviewContext(modules, profile, product, now);
  const block = buildFallbackPreview(context).personality;
  return { title: "풀이의 시작을 먼저 읽어 보세요", lead: block.lead, paragraphs: block.body,
    caption: "가상 명식으로 작성한 문체 예시입니다. 실제 풀이는 입력하신 생년월일시와 질문에 맞춰 달라집니다." };
}
