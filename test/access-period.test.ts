// 열람 기간을 한 입으로 말하는지 본다.
//
// 「영구 열람」과 「12개월」이 한 서비스 안에 같이 적혀 있었다. 랜딩·약관·로그인 화면은
// 기간 제한이 없다고 했고, FAQ·결제 화면·PDF 는 12개월이라고 했다. 실제로 주는 것은
// 12개월이므로, 영구라고 적힌 쪽은 지키지 못할 말을 한 셈이다.
//
// 이건 문구 취향 문제가 아니다. 결제 화면과 약관에 적는 열람 기간은 전자상거래법이
// 요구하는 표시사항이고, 카드사 심사가 반드시 들여다보는 자리다. 한 군데만 어긋나도
// 그 한 군데가 근거가 된다.
//
// 그래서 소스를 직접 훑는다. 화면이 늘어날 때마다 사람이 기억해서 맞추는 일로 두면
// 또 어긋난다 — 어긋나면 테스트가 먼저 안다.
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOTS = ["app", "components", "lib"];

/** 기간이 없다고 말하는 표현 */
const FOREVER = /영구\s*열람|기간\s*제한\s*없이|무기한\s*열람|평생\s*열람/;

/**
 * 예외.
 *
 * 환불규정은 "영구라고 뭉뚱그리면 안 된다"는 설명을 적어 두는 자리라서, 그 말이
 * 금지된 표현으로 등장한다. 이 파일만 빼 둔다.
 */
const ALLOWED = new Set([path.join("app", "(marketing)", "refund", "page.tsx")]);

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx)$/.test(entry) && !entry.includes(".test.") ? [full] : [];
  });
}

describe("열람 기간", () => {
  const files = ROOTS.flatMap(sourceFiles);

  it("기간이 없다고 말하는 화면이 없다 — 실제로 주는 것은 12개월이다", () => {
    const offenders = files
      .filter((file) => !ALLOWED.has(file))
      .filter((file) => FOREVER.test(readFileSync(file, "utf8")));

    expect(offenders, `영구/무기한으로 적힌 곳:\n${offenders.join("\n")}`).toEqual([]);
  });

  it("손님이 보는 자리에 12개월이 적혀 있다", () => {
    // 결제 직전, 랜딩의 약속, FAQ — 돈을 내기 전에 읽는 세 자리
    for (const file of [
      path.join("components", "home", "TrustBanner.tsx"),
      path.join("components", "home", "FaqSection.tsx"),
      path.join("components", "checkout", "CheckoutPanel.tsx"),
    ]) {
      expect(readFileSync(file, "utf8"), file).toMatch(/12개월/);
    }
  });
});
