import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildManseTopics } from "../../manse";
import { getReport, type ReportProduct } from "../../reports/catalog";
import { SAZU_SAMPLE_PROFILES } from "../../sazu/sample-profiles";
import { buildTemplateReport } from "../report-template";
import { generateOpenAiReport } from "../generate-openai";
import type { Reading } from "../../db/types";

const { call } = vi.hoisted(() => ({ call: vi.fn() }));
vi.mock("../../ai/openai", () => ({ callOpenAi: call, openAiText: (response: { text: string }) => response.text }));
const product = getReport("career")!;
const reading = { subject: SAZU_SAMPLE_PROFILES[0]!.profile, partner: null, answers: {} } as Reading;
const sazu = buildManseTopics(product.topics, reading.subject, null, new Date("2026-11-01"));
const draft = buildTemplateReport(product, reading, sazu);
type Call = { instructions: string; schema: { properties: { sections?: { items: { properties: { chapterId: { enum?: string[]; const?: string } } } } } }; signal: AbortSignal };
const reply = (value: unknown) => ({ text: JSON.stringify(value) });

function responder(report = draft) {
  return (input: Call) => {
    const batch = input.schema.properties.sections;
    if (!batch) {
      const { sections: _, ...summary } = report;
      return reply({ ...summary, corrections: [] });
    }
    const schema = batch.items.properties.chapterId;
    const ids = schema.enum ?? [schema.const!];
    return reply({ sections: ids.map(id => {
      const { title: _, ...content } = report.sections[Number(id.split("_")[1]) - 1]!;
      return { ...content, chapterId: id };
    }).reverse() });
  };
}

async function generate(target: ReportProduct = product) {
  return generateOpenAiReport(target, reading, sazu, "2026-11-01");
}

describe("분할 작성 후 전체 검수", () => {
  beforeEach(() => { call.mockReset(); });

  it("검수한 문단만 바꾸고 나머지 본문과 서버 목차는 유지한다", async () => {
    const respond = responder();
    call.mockImplementation((input: Call) => {
      const response = respond(input);
      if (input.schema.properties.sections) return response;
      return reply({ ...JSON.parse(response.text), headline: "생활비를 지키며, 준비할 역할부터 좁혀 보세요.", corrections: [
        { chapterId: "chapter_1", lead: "검수한 결론", body: [{ index: 1, text: "원자료와 대조하여 교정한 문단이에요." }], evidence: null },
      ] });
    });
    const result = await generate();
    expect(result.headline).toContain("생활비를 지키며");
    expect(result.sections.map(section => section.title)).toEqual(product.chapters);
    expect(result.sections[0]!.lead).toBe("검수한 결론");
    expect(result.sections[0]!.body[1]).toBe("원자료와 대조하여 교정한 문단이에요.");
    expect(result.sections[0]!.body[0]).toBe(draft.sections[0]!.body[0]);
    expect(JSON.stringify(result)).not.toMatch(/chapterId|corrections/);
  });

  it("긴 종합 풀이도 최대 세 요청으로 본문을 동시에 쓰고 모두 모인 뒤 검수한다", async () => {
    const full = getReport("destiny-full")!;
    const fullDraft = buildTemplateReport(full, reading, buildManseTopics(full.topics, reading.subject, null));
    const respond = responder(fullDraft);
    let active = 0;
    let peak = 0;
    let completed = 0;
    call.mockImplementation(async (input: Call) => {
      if (!input.schema.properties.sections) {
        expect(completed).toBe(3);
        return respond(input);
      }
      active++;
      peak = Math.max(peak, active);
      await new Promise(resolve => setTimeout(resolve, 10));
      active--;
      completed++;
      return respond(input);
    });
    const result = await generate(full);
    expect(peak).toBe(3);
    expect(call).toHaveBeenCalledTimes(4);
    expect(result.sections.map(section => section.title)).toEqual(full.chapters);
    expect(result.sections.every(section => section.body.length >= 2 && section.evidence.length > 0)).toBe(true);
  });

  it("검수가 실패하면 초안을 완성본으로 반환하지 않는다", async () => {
    const respond = responder();
    call.mockImplementation((input: Call) => {
      if (!input.schema.properties.sections) throw new Error("검수 연결 실패");
      return respond(input);
    });
    await expect(generate()).rejects.toThrow("검수 연결 실패");
  });

  it("중복·누락된 장이 있으면 검수나 완성 처리로 넘어가지 않는다", async () => {
    const full = getReport("destiny-full")!;
    const respond = responder(buildTemplateReport(full, reading, buildManseTopics(full.topics, reading.subject, null)));
    call.mockImplementation((input: Call) => {
      const result = respond(input);
      const body = JSON.parse(result.text);
      if (body.sections?.length > 1) body.sections[1] = body.sections[0];
      return reply(body);
    });
    await expect(generate(full)).rejects.toThrow("중복 또는 누락");
    expect(call.mock.calls.every(([input]) => (input as Call).schema.properties.sections)).toBe(true);
    expect(call.mock.calls.every(([input]) => (input as Call).signal.aborted)).toBe(true);
  });

  it.each([999, -1])("없는 문단 위치 %s의 교정은 무시하지 않고 실패시킨다", async index => {
    const respond = responder();
    call.mockImplementation((input: Call) => {
      const result = respond(input);
      if (input.schema.properties.sections) return result;
      return reply({ ...JSON.parse(result.text), corrections: [{ chapterId: "chapter_1", lead: null,
        body: [{ index, text: "잘못된 위치" }], evidence: null }] });
    });
    await expect(generate()).rejects.toThrow();
  });

  it("일시적인 공급자 오류만 실패한 묶음 안에서 한 번 복구한다", async () => {
    const respond = responder();
    let failed = false;
    call.mockImplementation((input: Call) => {
      if (!failed) { failed = true; throw Object.assign(new Error("busy"), { status: 503 }); }
      return respond(input);
    });
    const result = await generate();
    expect(call).toHaveBeenCalledTimes(5);
    expect(result.sections).toHaveLength(product.chapters.length);
  });

  it("인증 실패는 같은 호출을 자동 반복하지 않는다", async () => {
    call.mockRejectedValue(Object.assign(new Error("invalid key"), { status: 401 }));
    await expect(generate()).rejects.toThrow("invalid key");
    expect(call).toHaveBeenCalledTimes(3);
  });
});
