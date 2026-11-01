import { writeFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { buildManseTopics } from "@/lib/manse";
import { getReport } from "@/lib/reports/catalog";
import { generateOpenAiReport } from "@/lib/story/generate-openai";
import { assertReportContent } from "@/lib/story/quality";
import { withCalculatedPeopleTiming } from "@/lib/story/report-timing";

// 수동 출시 검증. 기본 테스트에서는 외부 API를 호출하거나 비용을 쓰지 않는다.
describe.skipIf(process.env.LIVE_REPORT_QA !== "1")("실제 제공자 출시 검증", () => {
  it("가상 고객의 팩폭 풀이를 생성·검수하고 고정 목차로 완성한다", async () => {
    const product = getReport("factbomb")!;
    const subject = { name: "가상검증", birthYear: 1995, birthMonth: 5, birthDay: 19,
      birthHour: null, birthMinute: 0, isFemale: true, isLunar: false, birthCity: "서울" };
    const now = new Date("2026-11-02T03:00:00Z");
    const sazu = buildManseTopics(product.topics, subject, null, now);
    const generated = await generateOpenAiReport(product, { subject, partner: null,
      answers: { detail: "말로 설명하고 설득하는 일과 개인 사업 중 무엇이 더 맞는지, 귀인과 오래 만날 인연은 언제 살펴보면 좋을지 궁금해요." } }, sazu, "2026-11-02");
    const report = withCalculatedPeopleTiming(generated, product, sazu, "귀인과 인연", "2026-11-02");
    assertReportContent(report, product);
    expect(report.sections.map(s => s.title)).toEqual(product.chapters);
    expect(JSON.stringify(report)).not.toContain("chapterId");
    expect(report.sections.every(s => s.body.length >= 2 && s.evidence.length >= 1)).toBe(true);
    await writeFile(process.env.LIVE_REPORT_QA_PATH ?? "/tmp/unmyeong-live-report-qa.json", JSON.stringify({ subject, report_slug: product.slug, sazu, script: report, generated_at: now.toISOString() }), { mode: 0o600 });
  }, 240_000);
});
