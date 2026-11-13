import { describe, expect, it } from "vitest";
import { isPrivatePath, isTrustedMutation } from "../request";

const request = (headers: HeadersInit = {}, path = "/api/readings", method = "POST") =>
  new Request(`https://www.unmyeongdaero.com${path}`, { method, headers });

describe("mutation origin protection", () => {
  it("accepts same-origin JSON and login forms", () => {
    expect(isTrustedMutation(request({ origin: "https://www.unmyeongdaero.com" }))).toBe(true);
    expect(isTrustedMutation(request({ referer: "https://www.unmyeongdaero.com/login" }, "/auth/email"))).toBe(true);
  });
  it("uses the incoming Host when Next normalizes the internal URL", () => {
    const req = new Request("http://localhost:3101/api/readings", { method: "POST", headers: { host: "127.0.0.1:3101", origin: "http://127.0.0.1:3101" } });
    expect(isTrustedMutation(req)).toBe(true);
  });
  it("rejects foreign, sibling, null and missing origins", () => {
    for (const origin of ["https://evil.example", "https://unmyeongdaero.com", "null", "https://www.unmyeongdaero.com.evil.example"]) {
      expect(isTrustedMutation(request({ origin }))).toBe(false);
    }
    expect(isTrustedMutation(request())).toBe(false);
    expect(isTrustedMutation(request({ "sec-fetch-site": "cross-site", origin: "https://www.unmyeongdaero.com" }))).toBe(false);
  });
  it("allows OAuth GET callbacks and independently verified payment notifications", () => {
    expect(isTrustedMutation(request({}, "/auth/callback", "GET"))).toBe(true);
    expect(isTrustedMutation(request({}, "/api/payments/webhook"))).toBe(true);
    expect(isTrustedMutation(request({}, "/api/payments/webhook/other"))).toBe(false);
  });
});

describe("private response policy", () => {
  it("covers account, reports, payments, admin and bearer links", () => {
    for (const path of ["/consult/session-123", "/api/readings/123", "/auth/callback", "/library", "/admin/products", "/checkout/a", "/reports/a/read", "/r/secret", "/v/secret"]) {
      expect(isPrivatePath(path)).toBe(true);
    }
    for (const path of ["/", "/consult", "/reports/a", "/opengraph-image", "/naver.html"]) expect(isPrivatePath(path)).toBe(false);
  });
});
