import { afterEach, describe, expect, it, vi } from "vitest";
import { createSazuClient } from "../client";
import { fieldLabel, SazuApiError } from "../errors";

const BIRTH = {
  birthYear: 1995,
  birthMonth: 3,
  birthDay: 14,
  birthHour: 9,
  birthMinute: 30,
  isFemale: true,
  isLunar: false,
  birthCity: "서울",
};

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function successBody(topic: string, modules: Record<string, unknown>) {
  return {
    success: true,
    data: {
      topic,
      input: BIRTH,
      guide: { purpose: "원국 표시용 응답입니다.", howToUse: ["fourPillars 부터 읽으세요."] },
      glossary: { 일간: "본인을 나타내는 글자" },
      modules,
      reference: { year: 2026, month: 9, day: 11 },
    },
    meta: { responseMs: 42, topic, modules: Object.keys(modules), cached: false, tier: "pro" },
  };
}

function errorBody(code: string, issues?: unknown[]) {
  return { success: false, error: { code, message: "upstream message", ...(issues ? { issues } : {}) } };
}

function setup(respond: () => Response | Promise<Response>) {
  const fetchMock = vi.fn<typeof fetch>(async () => respond());
  const client = createSazuClient({ apiKey: "sazu_pro_test", fetch: fetchMock });
  return { client, fetchMock };
}

async function captureError(promise: Promise<unknown>): Promise<SazuApiError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof SazuApiError) return error;
    throw error;
  }
  throw new Error("SazuApiError 가 발생해야 합니다.");
}

function sentRequest(fetchMock: ReturnType<typeof setup>["fetchMock"]) {
  const [url, init] = fetchMock.mock.calls[0]!;
  return {
    url: String(url),
    method: init?.method,
    headers: init?.headers as Record<string, string>,
    body: JSON.parse(String(init?.body)),
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("sazu client · manse", () => {
  it("x-api-key 헤더와 함께 /v2/sazu/manse 로 POST 하고 응답을 파싱한다", async () => {
    const modules = { fourPillars: { year: { full: "乙亥" } }, elements: {}, decadeFortune: { list: [] } };
    const { client, fetchMock } = setup(() => jsonResponse(200, successBody("manse", modules)));

    const result = await client.manse(BIRTH);

    const sent = sentRequest(fetchMock);
    expect(sent.url).toBe("https://api.sazu.app/v2/sazu/manse");
    expect(sent.method).toBe("POST");
    expect(sent.headers["x-api-key"]).toBe("sazu_pro_test");
    expect(sent.body).toEqual(BIRTH);
    expect(result.data.topic).toBe("manse");
    expect(result.data.modules).toEqual(modules);
    expect(result.data.glossary["일간"]).toBe("본인을 나타내는 글자");
    expect(result.meta.tier).toBe("pro");
  });

  it("스키마에 없는 필드는 upstream 으로 보내지 않는다", async () => {
    const { client, fetchMock } = setup(() => jsonResponse(200, successBody("manse", {})));

    await client.manse({ ...BIRTH, injected: "x" } as typeof BIRTH);

    expect(sentRequest(fetchMock).body).not.toHaveProperty("injected");
  });

  it("잘못된 입력은 upstream 호출 없이 한글 필드 에러로 거절한다", async () => {
    const { client, fetchMock } = setup(() => jsonResponse(200, successBody("manse", {})));

    const error = await captureError(client.manse({ ...BIRTH, birthMonth: 13 }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.clientStatus).toBe(400);
    expect(error.fieldErrors).toEqual([
      { field: "birthMonth", label: "태어난 달", message: "태어난 달 항목을 확인해 주세요." },
    ]);
  });

  it("upstream 400 VALIDATION_ERROR 의 issues 를 한글 메시지로 매핑한다", async () => {
    const { client } = setup(() =>
      jsonResponse(400, errorBody("VALIDATION_ERROR", [{ field: "birthCity", code: "invalid_enum_value" }])),
    );

    const error = await captureError(client.manse(BIRTH));

    expect(error.upstreamStatus).toBe(400);
    expect(error.clientStatus).toBe(400);
    expect(error.userMessage).toBe("입력하신 정보의 형식이 올바르지 않아요. 생년월일시를 다시 확인해 주세요.");
    expect(error.fieldErrors[0]?.label).toBe("태어난 지역");
  });

  it.each([
    ["INVALID_DATE", "존재하지 않는 날짜예요. 생년월일을 다시 확인해 주세요."],
    ["LEAP_MONTH_NOT_FOUND", "입력하신 해에는 해당 윤달이 없어요. 음력·윤달 여부를 다시 확인해 주세요."],
  ])("upstream 400 %s 를 한글 메시지로 매핑한다", async (code, message) => {
    const { client } = setup(() => jsonResponse(400, errorBody(code)));

    const error = await captureError(client.manse(BIRTH));

    expect(error.code).toBe(code);
    expect(error.clientStatus).toBe(400);
    expect(error.userMessage).toBe(message);
  });

  it("API 키 문제(401)는 내부 사정을 숨기고 502 로 내려보낸다", async () => {
    const { client } = setup(() => jsonResponse(401, errorBody("INVALID_API_KEY")));

    const error = await captureError(client.manse(BIRTH));

    expect(error.clientStatus).toBe(502);
    expect(error.toClientJSON()).toMatchObject({ code: "SAZU_UNAVAILABLE", retryable: false });
  });

  it("쿼터 소진(402)은 '리포트 미구매' 402 와 섞이지 않도록 503 으로 바꾼다", async () => {
    const { client } = setup(() => jsonResponse(402, errorBody("QUOTA_EXHAUSTED")));

    const error = await captureError(client.manse(BIRTH));

    expect(error.clientStatus).toBe(503);
    expect(error.retryable).toBe(true);
  });

  it("성공 응답의 봉투 구조가 어긋나면 INVALID_RESPONSE", async () => {
    const body = successBody("manse", {});
    const { guide: _omitted, ...dataWithoutGuide } = body.data;
    const { client } = setup(() => jsonResponse(200, { ...body, data: dataWithoutGuide }));

    const error = await captureError(client.manse(BIRTH));

    expect(error.code).toBe("INVALID_RESPONSE");
    expect(error.clientStatus).toBe(502);
  });

  it("SAZU_API_KEY 가 없으면 호출하지 않는다", async () => {
    vi.stubEnv("SAZU_API_KEY", "");
    const fetchMock = vi.fn<typeof fetch>();
    const client = createSazuClient({ fetch: fetchMock });

    const error = await captureError(client.manse(BIRTH));

    expect(error.code).toBe("MISSING_API_KEY");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("sazu client · today", () => {
  it("기준 날짜(date)를 포함해 /v2/sazu/today 로 요청한다", async () => {
    const modules = { fourPillars: {}, dailyInteraction: {}, seun: {} };
    const { client, fetchMock } = setup(() => jsonResponse(200, successBody("today", modules)));

    const result = await client.today({ ...BIRTH, date: "2026-09-11" });

    const sent = sentRequest(fetchMock);
    expect(sent.url).toBe("https://api.sazu.app/v2/sazu/today");
    expect(sent.body).toEqual({ ...BIRTH, date: "2026-09-11" });
    expect(result.data.reference).toEqual({ year: 2026, month: 9, day: 11 });
  });

  it("태어난 시각을 모르면 birthHour: null 을 허용한다", async () => {
    const { client, fetchMock } = setup(() => jsonResponse(200, successBody("today", {})));

    await client.today({ ...BIRTH, birthHour: null, birthMinute: undefined });

    expect(sentRequest(fetchMock).body.birthHour).toBeNull();
  });

  it("date 형식이 YYYY-MM-DD 가 아니면 upstream 호출 없이 거절한다", async () => {
    const { client, fetchMock } = setup(() => jsonResponse(200, successBody("today", {})));

    const error = await captureError(client.today({ ...BIRTH, date: "2026/09/11" }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(error.fieldErrors[0]?.label).toBe("기준 날짜");
  });

  it("429 RATE_LIMITED 는 재시도 가능한 429 로 매핑한다", async () => {
    const { client } = setup(() => jsonResponse(429, errorBody("RATE_LIMITED")));

    const error = await captureError(client.today(BIRTH));

    expect(error.clientStatus).toBe(429);
    expect(error.retryable).toBe(true);
    expect(error.userMessage).toBe("요청이 너무 잦아요. 잠시 후 다시 시도해 주세요.");
  });

  it("네트워크 오류는 NETWORK_ERROR(502)", async () => {
    const { client } = setup(() => Promise.reject(new TypeError("fetch failed")));

    const error = await captureError(client.today(BIRTH));

    expect(error.code).toBe("NETWORK_ERROR");
    expect(error.clientStatus).toBe(502);
  });

  it("JSON 이 아닌 에러 응답도 INVALID_RESPONSE 로 처리한다", async () => {
    const { client } = setup(() => new Response("<html>Bad Gateway</html>", { status: 502 }));

    const error = await captureError(client.today(BIRTH));

    expect(error.code).toBe("INVALID_RESPONSE");
    expect(error.upstreamStatus).toBe(502);
  });
});

describe("fieldLabel", () => {
  it("상대방 배열 경로를 사람이 읽는 라벨로 바꾼다", () => {
    expect(fieldLabel("partners.0.birthYear")).toBe("상대방 1 · 태어난 해");
    expect(fieldLabel("birthHour")).toBe("태어난 시");
  });
});
