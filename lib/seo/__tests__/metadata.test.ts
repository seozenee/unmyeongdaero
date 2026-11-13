import { describe, expect, it } from "vitest";
import { publicPageMetadata, serializeJsonLd } from "../metadata";

describe("public search metadata", () => {
  it("keeps canonical and sharing URLs consistent per page", () => {
    const metadata = publicPageMetadata("궁합 | 운명대로", "두 사람의 사주 풀이", "/reports/compatibility");
    expect(metadata.alternates?.canonical?.toString()).toMatch(/\/reports\/compatibility$/);
    expect(metadata.openGraph?.url).toBe(metadata.alternates?.canonical);
    expect(metadata.openGraph?.title).toBe("궁합 | 운명대로");
  });
  it("does not allow a catalog string to terminate a JSON-LD script", () => {
    const payload = { name: '</script><script>alert("x")</script>' };
    const serialized = serializeJsonLd(payload);
    expect(serialized).not.toContain("<");
    expect(JSON.parse(serialized)).toEqual(payload);
  });
});
