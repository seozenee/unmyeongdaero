import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Reading } from "@/lib/db";
import { ensureReadingPdf } from "../store";
import { SAMPLE_REPORT } from "./sample";

// 조판은 느리고 서체를 통째로 읽는다. 여기서 보려는 것은 "몇 번 굽는가" 이므로 가짜로 둔다.
// vi.mock 은 import 보다 먼저 끌어올려지므로, 가짜들도 vi.hoisted 로 함께 올려 둔다.
const mocks = vi.hoisted(() => ({
  render: vi.fn(async () => Buffer.from("%PDF-")),
  upload: vi.fn(async (_path: string, _body: Buffer, _options?: unknown) => ({ error: null })),
  updateReading: vi.fn(async () => undefined),
  getReading: vi.fn(async (_id: string) => null as unknown),
  dataMode: vi.fn(() => "supabase"),
}));
const { render, upload, updateReading, getReading, dataMode } = mocks;

vi.mock("../render", () => ({
  renderReportPdf: () => mocks.render(),
  reportPdfFilename: () => "운명대로.pdf",
}));
vi.mock("@/lib/env", () => ({
  env: { siteUrl: "https://example.test" },
  modes: { data: () => mocks.dataMode() },
}));
vi.mock("@/lib/db", () => ({
  getRepository: () => ({ updateReading: mocks.updateReading, getReading: mocks.getReading }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdmin: () => ({ storage: { from: () => ({ upload: mocks.upload }) } }),
}));

const reading = (overrides: Partial<Reading> = {}) =>
  ({
    id: "r-1",
    userId: "u-1",
    reportSlug: "life",
    subject: { name: "서진" },
    script: SAMPLE_REPORT,
    ...overrides,
  }) as unknown as Reading;

describe("PDF 보관", () => {
  beforeEach(() => {
    render.mockClear();
    upload.mockClear();
    updateReading.mockClear();
    getReading.mockReset();
    getReading.mockResolvedValue(null);
    dataMode.mockReturnValue("supabase");
  });

  it("한 번 구운 풀이는 다시 굽지 않는다", async () => {
    const stored = reading({ pdfToken: "tok", pdfPath: "u-1/r-1.pdf" } as Partial<Reading>);
    const result = await ensureReadingPdf(stored);

    expect(result).toEqual({ token: "tok", path: "u-1/r-1.pdf" });
    expect(render).not.toHaveBeenCalled();
    expect(upload).not.toHaveBeenCalled();
  });

  it("손에 든 사본이 낡았어도 저장된 행에 있으면 그대로 쓴다", async () => {
    // 완성 직후에 굽고 곧이어 알림이 또 부르는 길 — 두 번 구우면 카톡에 넣은 코드가 바뀐다
    getReading.mockResolvedValue(reading({ pdfToken: "tok", pdfPath: "u-1/r-1.pdf" } as Partial<Reading>));

    const result = await ensureReadingPdf(reading());

    expect(result).toEqual({ token: "tok", path: "u-1/r-1.pdf" });
    expect(render).not.toHaveBeenCalled();
    expect(upload).not.toHaveBeenCalled();
  });

  it("처음이면 구워서 올리고 코드를 남긴다", async () => {
    const result = await ensureReadingPdf(reading());

    expect(render).toHaveBeenCalledTimes(1);
    expect(upload).toHaveBeenCalledTimes(1);
    expect(upload.mock.calls[0]?.[0]).toBe("u-1/r-1.pdf");
    expect(result?.path).toBe("u-1/r-1.pdf");
    expect(updateReading).toHaveBeenCalledWith(
      "r-1",
      expect.objectContaining({ pdfPath: "u-1/r-1.pdf", pdfToken: result?.token }),
    );
  });

  it("스토리지가 없는 환경에서는 굽지 않는다", async () => {
    dataMode.mockReturnValue("local");

    expect(await ensureReadingPdf(reading())).toBeNull();
    expect(render).not.toHaveBeenCalled();
  });

  it("아직 다 쓰이지 않은 풀이는 굽지 않는다", async () => {
    expect(await ensureReadingPdf(reading({ script: null } as Partial<Reading>))).toBeNull();
    expect(render).not.toHaveBeenCalled();
  });
});
