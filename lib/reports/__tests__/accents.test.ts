import { describe, expect, it } from "vitest";
import { PRODUCT_ACCENT, productThemeStyle } from "../accents";

const light = (rgb: string) => rgb.split(" ").map(Number).map(channel => {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index]!, 0);

describe("상품별 버튼 색과 읽기 대비", () => {
  it.each(Object.keys(PRODUCT_ACCENT))("%s 버튼은 상품 색을 사용하고 양쪽 끝에서 글자가 읽힌다", slug => {
    const theme = productThemeStyle(slug) as Record<string, string>;
    expect(theme["--accent"]).toBe(PRODUCT_ACCENT[slug]);
    for (const key of ["--accent-button", "--accent-button-end"]) {
      const luminance = light(theme[key]!);
      const contrast = theme["--accent-on"] === "#000000" ? (luminance + 0.05) / 0.05 : 1.05 / (luminance + 0.05);
      expect(contrast).toBeGreaterThanOrEqual(4.5);
    }
  });
});
