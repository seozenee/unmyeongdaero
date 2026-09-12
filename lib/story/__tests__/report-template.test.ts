import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { BirthProfile, Reading, StoredSazu, StoredSazuTopic } from "../../db/types";
import { listReports } from "../../reports/catalog";
import { SAZU_SAMPLE_PROFILES } from "../../sazu/sample-profiles";
import { storyReportSchema } from "../report";
import { buildTemplateReport } from "../report-template";

const FIXTURES = path.join(__dirname, "../../sazu/__fixtures__");

function loadTopic(file: string): StoredSazuTopic {
  const { data, meta } = JSON.parse(readFileSync(path.join(FIXTURES, file), "utf8"));
  return { modules: data.modules, guide: data.guide, glossary: data.glossary, reference: data.reference, partners: data.partners, sample: Boolean(meta.sample) };
}

const subject: BirthProfile = SAZU_SAMPLE_PROFILES[0]!.profile;
const partner: BirthProfile = { ...SAZU_SAMPLE_PROFILES[1]!.profile, name: "서윤" };

function readingFor(slug: string, withPartner: boolean): Reading {
  return {
    id: "test",
    userId: "user",
    reportSlug: slug,
    subject,
    partner: withPartner ? partner : null,
    answers: {
      breakupPeriod: "6개월 이내",
      whoEnded: "그 사람이 먼저",
      contactStatus: "차단됐어요",
      wish: "다시 만나고 싶어요",
      concern: "자주 싸워요",
      condition: "잠이 부족해요",
      word: "정리",
      income: "직장 월급",
      goal: "공무원·임용",
      struggle: "꾸준히 못 해요",
      grade: "중학생",
      childConcern: "진로 선택",
      childStyle: "잘하다가 금방 지쳐요",
      conflict: "휴대폰·게임",
      detail: "작년 여름 소개로 만나 올해 2월에 헤어졌어요.",
    },
    status: "generating",
    sazu: null,
    script: null,
    error: null,
    createdAt: "2026-09-11T00:00:00.000Z",
    updatedAt: "2026-09-11T00:00:00.000Z",
    generatedAt: null,
  };
}

describe("buildTemplateReport · 실제 sazu 샌드박스 응답", () => {
  const dump: Record<string, unknown> = {};

  for (const report of listReports("report")) {
    it(`${report.slug}: 스키마·목차·근거·점수 비노출`, () => {
      const sazu: StoredSazu = { manse: loadTopic("manse.strong-male.json") };
      for (const topic of report.topics) sazu[topic] = loadTopic(`${topic}.strong-male.json`);
      const result = buildTemplateReport(report, readingFor(report.slug, report.partner !== "none"), sazu, new Date("2026-09-11"));
      dump[report.slug] = result;

      expect(() => storyReportSchema.parse(result)).not.toThrow();
      expect(result.sections.map((section) => section.title)).toEqual([...report.chapters]);
      for (const section of result.sections) {
        expect(section.body.length).toBeGreaterThanOrEqual(2);
        expect(section.evidence.length).toBeGreaterThanOrEqual(1);
      }
      expect(result.briefing.length).toBeGreaterThanOrEqual(6);
      expect(result.timeline.length).toBeGreaterThanOrEqual(3);
      expect(result.actions.do.length).toBeGreaterThanOrEqual(3);

      const text = JSON.stringify(result);
      expect(text).not.toMatch(/\d+점/);
      expect(text).not.toMatch(/형사사건|수술|재앙|undefined|null세|NaN/);
    });
  }

  it("검토용 덤프", () => {
    if (!process.env.REPORT_DUMP) return;
    mkdirSync(path.dirname(process.env.REPORT_DUMP), { recursive: true });
    writeFileSync(process.env.REPORT_DUMP, JSON.stringify(dump, null, 2));
  });
});
