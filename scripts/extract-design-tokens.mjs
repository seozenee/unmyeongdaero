#!/usr/bin/env node
// design/code.html 의 tailwind-config 와 design/DESIGN.md 의 frontmatter 를 읽어
// design/tokens.json 을 생성한다. 토큰 값은 사람이 옮겨 적지 않고 반드시 이 스크립트로만 갱신한다.
//
//   pnpm tokens        → tokens.json 재생성
//   pnpm tokens:check  → tokens.json 이 원본과 어긋나 있으면 exit 1 (build 전에 실행)
//
// 두 원본의 값이 충돌하면 code.html 이 이긴다(시각적 source of truth, screen.png 가 이 파일로 렌더링됨).
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { parse as parseYaml } from "yaml";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const HTML_PATH = resolve(root, "design/code.html");
const MD_PATH = resolve(root, "design/DESIGN.md");
const OUT_PATH = resolve(root, "design/tokens.json");

function readStitchTailwindExtend() {
  const html = readFileSync(HTML_PATH, "utf8");
  const match = html.match(/<script id="tailwind-config">([\s\S]*?)<\/script>/);
  if (!match) throw new Error('design/code.html 에서 <script id="tailwind-config"> 를 찾지 못했습니다.');
  // 스크립트는 `tailwind.config = {...}` 형태의 JS 객체 리터럴이라 JSON.parse 불가 → 격리된 vm 에서 평가
  const sandbox = { tailwind: {} };
  vm.runInNewContext(match[1], sandbox, { timeout: 1000 });
  return sandbox.tailwind.config.theme.extend;
}

function readDesignFrontmatter() {
  const md = readFileSync(MD_PATH, "utf8");
  const match = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) throw new Error("design/DESIGN.md 에서 frontmatter 를 찾지 못했습니다.");
  return parseYaml(match[1]);
}

/** DESIGN.md typography 항목 → Tailwind fontSize 튜플 */
function toFontSize({ fontSize, lineHeight, letterSpacing, fontWeight }) {
  const opts = { lineHeight };
  if (letterSpacing !== undefined) opts.letterSpacing = letterSpacing;
  opts.fontWeight = String(fontWeight);
  return [fontSize, opts];
}

const sortKeys = (obj) =>
  Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)));

const mapValues = (obj, fn) =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fn(v, k)]));

function diffScale(label, winner, loser) {
  const warnings = [];
  for (const key of new Set([...Object.keys(winner), ...Object.keys(loser)])) {
    const a = JSON.stringify(winner[key]);
    const b = JSON.stringify(loser[key]);
    if (a !== b) warnings.push(`  ${label}.${key}: code.html=${a ?? "(없음)"} / DESIGN.md=${b ?? "(없음)"}`);
  }
  return warnings;
}

function build() {
  const stitch = readStitchTailwindExtend();
  const design = readDesignFrontmatter();

  const designFontSize = mapValues(design.typography, toFontSize);
  const designFontFamily = mapValues(design.typography, (t) => [t.fontFamily]);

  const warnings = [
    ...diffScale("colors", stitch.colors, design.colors),
    ...diffScale("spacing", stitch.spacing, design.spacing),
    ...diffScale("borderRadius", stitch.borderRadius, design.rounded),
    ...diffScale("fontSize", stitch.fontSize, designFontSize),
  ];

  const tokens = {
    $generated: "scripts/extract-design-tokens.mjs 가 생성한 파일입니다. 직접 수정하지 마세요.",
    $sources: ["design/code.html#tailwind-config", "design/DESIGN.md#frontmatter"],
    colors: sortKeys(stitch.colors),
    // radius 는 두 원본의 스케일 자체가 달라(code.html lg=0.5rem, DESIGN.md lg=1rem) 섞으면
    // md(0.75rem) > lg(0.5rem) 역전이 생긴다 → code.html 스케일만 사용.
    borderRadius: sortKeys(stitch.borderRadius),
    // 나머지는 code.html 이 우선이고 DESIGN.md 에만 있는 키는 보강한다.
    spacing: sortKeys({ ...design.spacing, ...stitch.spacing }),
    fontFamily: sortKeys({ ...designFontFamily, ...stitch.fontFamily }),
    fontSize: sortKeys({ ...designFontSize, ...stitch.fontSize }),
  };

  return { tokens, warnings };
}

const { tokens, warnings } = build();
const output = JSON.stringify(tokens, null, 2) + "\n";

if (warnings.length) {
  console.warn(`[tokens] 두 원본 간 불일치 ${warnings.length}건 (code.html 값 채택):\n${warnings.join("\n")}`);
}

if (process.argv.includes("--check")) {
  const current = existsSync(OUT_PATH) ? readFileSync(OUT_PATH, "utf8") : "";
  if (current !== output) {
    console.error("[tokens] design/tokens.json 이 원본과 다릅니다. `pnpm tokens` 로 재생성하세요.");
    process.exit(1);
  }
  console.log("[tokens] design/tokens.json 최신 상태");
} else {
  writeFileSync(OUT_PATH, output);
  console.log(`[tokens] ${OUT_PATH} 생성 완료`);
}
