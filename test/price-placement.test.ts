// 값을 어디에 적는지 본다.
//
// 값은 결제 직전에 한 번만 보여 준다. 고르는 자리에서 값부터 보이면 사람은 "무엇이
// 궁금한가"가 아니라 "무엇이 싼가"로 고른다. 그러면 가장 싼 풀이가 가장 많이 팔리고,
// 정작 그 사람이 알고 싶었던 것은 안 팔린다.
//
// 화면이 늘어날 때마다 사람이 기억해서 지키는 일로 두면 또 샌다. 실제로 한 번 걷어낸
// 뒤에도 랜딩에 다시 깔려 있었다 — 그래서 소스를 훑는다.
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/** 값을 그려 내는 함수 */
const PRICE = /formatKRW|discountLabel|originalPrice/;

/**
 * 값을 적어도 되는 자리.
 *
 * · 결제 화면과 결제 패널 — 돈이 나가는 자리다. 여기서는 반드시 적어야 한다.
 * · 명식 확인·페이월·대화 마지막 — 명식을 다 보여 준 뒤 결제로 넘기는 자리다.
 * · 상담 — 세션을 사는 자리다.
 * · 관리자 — 손님이 보는 화면이 아니다.
 */
const ALLOWED = [
  path.join("app", "(app)", "checkout"),
  path.join("app", "(admin)"),
  // 명식을 다 보여 준 다음 결제로 넘기는 화면. 값을 ManseConfirm 으로 내려 준다
  path.join("app", "(app)", "readings", "[id]", "manse", "page.tsx"),
  path.join("components", "admin"),
  path.join("components", "checkout"),
  path.join("components", "consult"),
  path.join("components", "manse", "ManseConfirm.tsx"),
  path.join("components", "saju", "ReportPaywall.tsx"),
  path.join("components", "story", "StoryFunnel.tsx"),
];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.tsx?$/.test(entry) && !entry.includes(".test.") ? [full] : [];
  });
}

describe("값을 적는 자리", () => {
  it("고르는 자리에는 값이 없다 — 결제 직전에 한 번만 보여 준다", () => {
    const offenders = ["app", "components"]
      .flatMap(sourceFiles)
      .filter((file) => !ALLOWED.some((allowed) => file.startsWith(allowed)))
      .filter((file) => PRICE.test(readFileSync(file, "utf8")));

    expect(offenders, `값이 적힌 곳:\n${offenders.join("\n")}`).toEqual([]);
  });

  it("랜딩에는 값이 한 글자도 없다", () => {
    for (const file of sourceFiles(path.join("components", "home"))) {
      expect(readFileSync(file, "utf8"), file).not.toMatch(PRICE);
    }
  });

  it("결제 직전에는 값이 반드시 있다 — 모르고 누르게 하면 안 된다", () => {
    expect(readFileSync(path.join("components", "checkout", "CheckoutPanel.tsx"), "utf8")).toMatch(/formatKRW/);
  });
});
