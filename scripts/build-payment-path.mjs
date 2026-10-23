// 토스페이먼츠 결제경로 파일(PPT)을 만든다.
//
// 카드사 심사용 문서라 꾸미지 않는다. 토스가 보내 준 예시와 같은 구성 —
// 위에 단계 이름, 아래 설명 한 줄, 그 아래 화면 캡처 하나 — 을 그대로 따른다.
// 심사자가 캡처를 보고 흐름을 따라갈 수 있으면 그걸로 족하다.
//
//   node scripts/build-payment-path.mjs
//
// 캡처는 docs/토스페이먼츠/captures/ 에 아래 이름으로 둔다. 없는 캡처는 빈 자리로 표시되어
// 무엇이 빠졌는지 바로 보인다.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pptxgen = require("pptxgenjs");

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const capturesDir = join(root, "docs/토스페이먼츠/captures");
const outPath = join(root, "docs/토스페이먼츠/결제경로_운명대로.pptx");

const MERCHANT = {
  name: "르노바 (운명대로)",
  bizNumber: "656-26-02081",
  url: "https://www.unmyeongdaero.com",
  testId: "review@unmyeongdaero.com",
  testPw: "Unmyeong2026!",
};

/** 단계별 슬라이드. file 은 captures/ 안의 파일 이름 */
const STEPS = [
  {
    badge: "② 하단 정보",
    caption: "모든 페이지 하단에 상호명·대표자명·사업자등록번호·통신판매업신고번호·사업장주소·연락처를 기재했습니다.",
    file: "02-하단정보.png",
  },
  {
    badge: "③ 환불규정 (무형상품)",
    caption: "서비스 제공기간과 청약철회·환불 기준을 명시한 환불규정 페이지입니다.",
    file: "03-환불규정.png",
  },
  {
    badge: "④ 로그인 / 회원가입",
    caption: "이메일·비밀번호로 로그인합니다. 심사용 계정은 표지에 기재했습니다.",
    file: "04-로그인.png",
  },
  {
    badge: "⑤ 상품 선택 (1/5)",
    caption: "첫 화면에서 판매 중인 리포트 상품을 고릅니다.",
    file: "05-상품목록.png",
  },
  {
    badge: "⑤ 상품 상세 (2/5)",
    caption: "상품명·구성·금액과 서비스 제공기간을 확인합니다.",
    file: "06-상품상세.png",
  },
  {
    badge: "⑤ 정보 입력 (3/5)",
    caption: "풀이에 필요한 생년월일시를 입력합니다.",
    file: "07-정보입력.png",
  },
  {
    badge: "⑤ 만세력 확인 (4/5)",
    caption: "입력한 정보로 계산한 사주 명식을 먼저 보여 드리고, 맞는지 확인받은 뒤 결제로 넘어갑니다.",
    file: "08-만세력확인.png",
  },
  {
    badge: "⑤ 주문 확인 (5/5)",
    caption: "상품명·금액·결제수단·청약철회 제한 동의를 확인하고 결제를 요청합니다.",
    file: "09-주문확인.png",
  },
  {
    badge: "⑥ 카드 결제경로 (1/2)",
    caption: "토스페이먼츠 결제창이 열리고 카드사를 선택합니다.",
    file: "10-결제창.png",
  },
  {
    badge: "⑥ 카드 결제경로 (2/2)",
    caption: "카드사 인증 화면까지의 흐름입니다.",
    file: "11-카드사인증.png",
  },
];

const COLOR = {
  ink: "191F28",
  muted: "6B7684",
  line: "E5E8EB",
  toss: "3182F6",
  warn: "D03050",
};

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.3" × 7.5"
pres.author = "르노바";
pres.title = "운명대로 결제경로";

// ─── 표지 · 가맹점 정보 ──────────────────────────────────────────────────────
const cover = pres.addSlide();
cover.background = { color: "FFFFFF" };
cover.addText("홈페이지 결제경로", {
  x: 0.9, y: 1.1, w: 11.5, h: 0.6,
  fontSize: 20, color: COLOR.muted, fontFace: "Arial", isTextBox: true,
});
cover.addText("운명대로", {
  x: 0.9, y: 1.6, w: 11.5, h: 1.0,
  fontSize: 44, bold: true, color: COLOR.ink, fontFace: "Arial", isTextBox: true,
});

const rows = [
  ["(1) 상호명", MERCHANT.name],
  ["(2) 사업자번호", MERCHANT.bizNumber],
  ["(3) URL", MERCHANT.url],
  ["(4) Test ID", MERCHANT.testId],
  ["(5) Test PW", MERCHANT.testPw],
];
rows.forEach(([label, value], index) => {
  const y = 3.1 + index * 0.62;
  cover.addText(label, {
    x: 0.9, y, w: 2.4, h: 0.5,
    fontSize: 16, bold: true, color: COLOR.toss, fontFace: "Arial", margin: 0, isTextBox: true,
  });
  cover.addText(value, {
    x: 3.4, y, w: 8.9, h: 0.5,
    fontSize: 16, color: COLOR.ink, fontFace: "Arial", margin: 0, isTextBox: true,
  });
});

cover.addText("※ 소셜 로그인이 아닌 이메일·비밀번호 계정입니다.", {
  x: 0.9, y: 6.4, w: 11.5, h: 0.4,
  fontSize: 12, color: COLOR.muted, fontFace: "Arial", isTextBox: true,
});

// ─── 단계별 캡처 ────────────────────────────────────────────────────────────
let missing = 0;
for (const step of STEPS) {
  const slide = pres.addSlide();
  slide.background = { color: "FFFFFF" };

  // 단계 이름 — 토스 예시의 파란 머리표와 같은 자리
  slide.addShape(pres.ShapeType.roundRect, {
    x: 4.4, y: 0.22, w: 4.5, h: 0.46,
    fill: { color: COLOR.toss }, rectRadius: 0.1, line: { color: COLOR.toss },
  });
  slide.addText(step.badge, {
    x: 4.4, y: 0.22, w: 4.5, h: 0.46,
    fontSize: 14, bold: true, color: "FFFFFF", align: "center", valign: "middle",
    fontFace: "Arial", margin: 0, isTextBox: true,
  });

  slide.addText(step.caption, {
    x: 0.9, y: 0.78, w: 11.5, h: 0.4,
    fontSize: 13, color: COLOR.muted, align: "center", fontFace: "Arial", isTextBox: true,
  });

  const file = join(capturesDir, step.file);
  if (existsSync(file)) {
    // 캡처는 가로 꽉 채우지 않고 가운데 정렬 — 세로가 긴 화면도 잘리지 않게 높이로 맞춘다
    slide.addImage({ path: file, x: 1.4, y: 1.3, w: 10.5, h: 5.9, sizing: { type: "contain", w: 10.5, h: 5.9 } });
  } else {
    missing += 1;
    slide.addShape(pres.ShapeType.rect, {
      x: 1.4, y: 1.3, w: 10.5, h: 5.9,
      fill: { color: "F7F8FA" }, line: { color: COLOR.line, dashType: "dash" },
    });
    slide.addText(`캡처 없음 — captures/${step.file}`, {
      x: 1.4, y: 3.9, w: 10.5, h: 0.6,
      fontSize: 16, bold: true, color: COLOR.warn, align: "center", fontFace: "Arial", isTextBox: true,
    });
  }

  slide.addNotes(step.caption);
}

await pres.writeFile({ fileName: outPath });
console.log(`만들었습니다: ${outPath}`);
if (missing > 0) console.log(`아직 ${missing}장의 캡처가 비어 있습니다.`);
