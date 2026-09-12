import "server-only";

import type { BirthProfile, StoredSazu, StoredSazuTopic } from "@/lib/db/types";
import type { ReportProduct } from "@/lib/reports/catalog";
import { getSazuClient } from "./client";
import type { SazuRequest, SazuResponse, SazuTopic } from "./schemas";

function toSazuBirth(profile: BirthProfile) {
  const { name: _name, ...birth } = profile;
  return { ...birth, birthMinute: birth.birthMinute ?? 0 };
}

function toStored(response: SazuResponse): StoredSazuTopic {
  const { data, meta } = response;
  return {
    modules: data.modules,
    guide: { purpose: data.guide.purpose, howToUse: data.guide.howToUse },
    glossary: data.glossary,
    reference: data.reference,
    partners: data.partners,
    sample: Boolean(meta.sample),
  };
}

/** 신년운세 기준 연도: 10월부터는 다음 해를 본다 */
export function yearlyTargetYear(now = new Date()) {
  return now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear();
}

function buildInput(topic: SazuTopic, subject: BirthProfile, partner: BirthProfile | null) {
  const base = toSazuBirth(subject);
  switch (topic) {
    case "compatibility":
    case "love":
      return partner ? { ...base, partners: [{ ...toSazuBirth(partner), label: partner.name }], metrics: true } : base;
    case "yearly":
      return { ...base, year: yearlyTargetYear() };
    default:
      return base;
  }
}

/**
 * 리포트에 필요한 sazu 토픽을 병렬 호출해 저장 가능한 형태로 모은다.
 * 차트(원국·오행·대운)를 위해 manse 는 항상 함께 부른다.
 */
export async function fetchSazuForProfiles(
  topics: readonly SazuTopic[],
  subject: BirthProfile,
  partner: BirthProfile | null,
): Promise<StoredSazu> {
  const client = getSazuClient();
  const uniqueTopics = Array.from(new Set<SazuTopic>(["manse", ...topics]));

  const entries = await Promise.all(
    uniqueTopics.map(async (topic) => {
      const input = buildInput(topic, subject, partner) as SazuRequest<typeof topic>;
      return [topic, toStored(await client.request(topic, input))] as const;
    }),
  );
  return Object.fromEntries(entries);
}

export function fetchSazuForReport(report: ReportProduct, subject: BirthProfile, partner: BirthProfile | null) {
  return fetchSazuForProfiles(report.topics, subject, partner);
}

/** 차트용 modules: manse 를 바탕으로 토픽 응답의 모듈을 덧씌운다 */
export function mergedModules(sazu: StoredSazu): Record<string, unknown> {
  const merged: Record<string, unknown> = {};
  for (const topic of Object.values(sazu)) Object.assign(merged, topic?.modules);
  return { ...merged, ...sazu.manse?.modules };
}

export function mergedGlossary(sazu: StoredSazu): Record<string, string> {
  return Object.assign({}, ...Object.values(sazu).map((topic) => topic?.glossary ?? {}));
}

export const isSampleReading = (sazu: StoredSazu) => Object.values(sazu).some((topic) => topic?.sample);
