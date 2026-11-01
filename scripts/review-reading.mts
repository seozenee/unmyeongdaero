/** 가상 고객의 풀이 품질 확인. DB·결제·알림을 건드리지 않는다.
 * node --env-file=.env.local --conditions=react-server --import tsx scripts/review-reading.mts career
 */
import { writeFile } from "node:fs/promises";
import { buildManseTopics } from "../lib/manse";
import { getReport } from "../lib/reports/catalog";
import { generateOpenAiReport } from "../lib/story/generate-openai";
import { assertReportContent } from "../lib/story/quality";
import { auditReport } from "../lib/story/sanitize";
import type { Reading } from "../lib/db/types";

const slug = process.argv[2] ?? "career";
const product = getReport(slug);
if (!product || product.kind !== "report") throw new Error("보고서 상품 slug를 입력하세요.");
const subject = { name: "가상고객", birthYear: 1990, birthMonth: 3, birthDay: 14,
  birthHour: product.partner === "none" ? 7 : null, birthMinute: 20,
  isFemale: false, isLunar: false, birthCity: "서울" };
const partner = product.partner === "none" ? null : { ...subject, name: "가상상대", birthYear: 1992, birthMonth: 8, birthDay: 5 };
const detail = partner
  ? "상대가 두 달 전에 헤어지자고 했고 지금은 차단한 상태입니다. 다시 만날 수 있는지와 제가 무엇을 해야 할지 궁금해요."
  : "5년째 같은 회사에서 일하고 있습니다. 맡은 일은 늘었는데 보상은 그대로라 이직을 고민해요. 생활비 때문에 바로 그만둘 수는 없고 주말에 한두 시간 정도 준비할 수 있어요.";
const now = new Date("2026-11-01T03:00:00Z");
const reading: Pick<Reading, "subject" | "partner" | "answers"> = { subject, partner, answers: { detail } };
const sazu = buildManseTopics(product.topics, subject, partner, now);
const started = Date.now();
const report = await generateOpenAiReport(product, reading, sazu, "2026-11-01");
assertReportContent(report, product);
const leaks = auditReport(report, slug);
const output = `/tmp/unmyeongdaero-review-${slug}.json`;
await writeFile(output, JSON.stringify({ detail, report }, null, 2));
console.log(JSON.stringify({ output, seconds: Math.round((Date.now() - started) / 1000),
  headline: report.headline, paragraphs: report.sections.map((section) => section.body.length),
  evidence: report.sections.map((section) => section.evidence.length), leaks,
  summary: report.summary, actions: report.actions }, null, 2));
