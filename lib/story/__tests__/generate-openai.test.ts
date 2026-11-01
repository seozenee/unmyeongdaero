import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildManseTopics } from "../../manse";
import { getReport } from "../../reports/catalog";
import { SAZU_SAMPLE_PROFILES } from "../../sazu/sample-profiles";
import { buildTemplateReport } from "../report-template";
import { generateOpenAiReport } from "../generate-openai";
import type { Reading } from "../../db/types";

const { call } = vi.hoisted(() => ({ call: vi.fn() }));
vi.mock("../../ai/openai", () => ({
  callOpenAi: call,
  openAiText: (response: { text: string }) => response.text,
}));
const product = getReport("career")!;
const reading = { subject: SAZU_SAMPLE_PROFILES[0]!.profile, partner: null, answers: {} } as Reading;
const sazu = buildManseTopics(product.topics, reading.subject, null, new Date("2026-11-01"));
const draft = buildTemplateReport(product, reading, sazu);

describe("풀이 생성 후 검수", () => {
  beforeEach(() => call.mockReset());

  it("초안 대신 검수를 마친 문장을 반환한다", async () => {
    const reviewed = { ...draft, headline: "생활비를 지키며, 준비할 역할부터 좁혀 보세요." };
    call.mockResolvedValueOnce({ text: JSON.stringify(draft) }).mockResolvedValueOnce({ text: JSON.stringify(reviewed) });
    const result = await generateOpenAiReport(product, reading, sazu, "2026-11-01");
    expect(result.headline).toBe(reviewed.headline);
    expect(draft.headline).not.toBe(result.headline);
  });

  it("검수가 실패하면 검수 전 초안을 완성본으로 반환하지 않는다", async () => {
    call.mockResolvedValueOnce({ text: JSON.stringify(draft) }).mockRejectedValueOnce(new Error("검수 연결 실패"));
    await expect(generateOpenAiReport(product, reading, sazu, "2026-11-01")).rejects.toThrow("검수 연결 실패");
  });

  it("검수 응답이 목차를 빠뜨려도 완성 처리하지 않는다", async () => {
    call.mockResolvedValueOnce({ text: JSON.stringify(draft) })
      .mockResolvedValueOnce({ text: JSON.stringify({ ...draft, sections: [] }) });
    await expect(generateOpenAiReport(product, reading, sazu, "2026-11-01")).rejects.toThrow("목차 개수 불일치");
  });
});
