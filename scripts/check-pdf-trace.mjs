// 람다에 PDF 를 굽는 데 필요한 파일이 실제로 실려 가는지 확인한다.
//
// PDF 가 운영에서만 안 되는 일이 세 번 있었다. 세 번 다 "로컬에서는 되는데"로 시작했다.
// node_modules 가 통째로 있는 자리에서는 무엇이 빠졌는지 알 길이 없기 때문이다.
//
// 가장 사람을 속인 것은 진입점 조건이었다. 패키지가 exports 로 require 용 파일과
// import 용 파일을 따로 두면, Next 의 파일 추적은 import 쪽을 따라가고 서버 번들은
// CommonJS 라 require 쪽을 집는다. 둘이 엇갈리면 추적 목록에는 파일이 멀쩡히 있는데
// 런타임에 찾는 파일만 없다.
//
// 그래서 추적 결과(.nft.json)를 열어 "런타임이 집을 파일"이 그 안에 있는지 본다.
// 빌드 뒤에 돌고, 없으면 빌드를 실패시킨다 — 배포하고 나서 아는 것보다 낫다.
import { readFileSync, existsSync, globSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);

/** PDF 를 굽는 모든 길. next.config.mjs 의 추적 목록과 같아야 한다 */
const ROUTES = [
  "api/readings/[id]/pdf",
  "api/readings/[id]/generate",
  "r/[token]",
];

/** exports 에서 조건을 따라 내려가 파일 하나를 고른다 */
function resolveCondition(node, conditions) {
  if (typeof node === "string") return node;
  if (!node || typeof node !== "object") return null;
  for (const condition of conditions) {
    if (condition in node) {
      const found = resolveCondition(node[condition], conditions);
      if (found) return found;
    }
  }
  return null;
}

/**
 * 패키지의 package.json 을 찾는다.
 *
 * pnpm 은 직접 의존이 아닌 것을 루트 node_modules 에 올리지 않는다. pdfkit 은
 * @react-pdf/font 가 끌어오는 것이라 루트에서는 require.resolve 가 실패한다.
 * 그래서 .pnpm 아래 실제 자리를 직접 찾는다(디렉터리 이름은 @scope/name → @scope+name).
 */
function manifestPath(pkg) {
  try {
    return require.resolve(`${pkg}/package.json`);
  } catch {
    const flat = pkg.replace("/", "+");
    const [found] = globSync(`node_modules/.pnpm/${flat}@*/node_modules/${pkg}/package.json`);
    if (!found) throw new Error(`${pkg} 를 찾을 수 없다 — 설치되어 있는가?`);
    return found;
  }
}

/** 서버 번들이 런타임에 집는 파일 — CommonJS 이므로 require 조건을 따른다 */
function requireEntry(pkg) {
  const manifest = JSON.parse(readFileSync(manifestPath(pkg), "utf8"));
  const root = manifest.exports?.["."] ?? manifest.exports;
  return resolveCondition(root, ["node", "require", "default"]) ?? manifest.main ?? "index.js";
}

/** 번들에서 빼낸 패키지들 — 빼냈으면 런타임이 node_modules 에서 직접 집는다 */
const EXTERNAL = ["pdfkit", "fontkit", "@react-pdf/renderer"];

/** 코드에 경로가 문자열로 박혀 있지 않아 추적이 놓치는 것들 */
const EXTRA = [
  { label: "pdfkit 표준 14서체", match: /pdfkit\/js\/standard-fonts\/Helvetica\.cjs$/ },
  { label: "한글 글꼴", match: /assets\/fonts\/Pretendard-Regular\.ttf$/ },
];

const problems = [];

for (const route of ROUTES) {
  const trace = path.join(".next/server/app", route, "route.js.nft.json");
  if (!existsSync(trace)) {
    problems.push(`${route}: 추적 파일이 없다 (${trace}) — 길 이름이 바뀌었는가?`);
    continue;
  }
  const files = JSON.parse(readFileSync(trace, "utf8")).files.map((f) => path.posix.normalize(f));

  for (const pkg of EXTERNAL) {
    const entry = requireEntry(pkg).replace(/^\.\//, "");
    const wanted = `${pkg}/${entry}`;
    if (!files.some((f) => f.endsWith(wanted))) {
      problems.push(`${route}: ${wanted} 가 안 실린다 — require 진입점이다. 없으면 MODULE_NOT_FOUND`);
    }
  }

  for (const { label, match } of EXTRA) {
    if (!files.some((f) => match.test(f))) problems.push(`${route}: ${label} 가 안 실린다`);
  }
}

if (problems.length > 0) {
  console.error("\nPDF 가 운영에서 터질 상태다:\n");
  for (const problem of problems) console.error(`  · ${problem}`);
  console.error("\nnext.config.mjs 의 outputFileTracingIncludes 를 손봐야 한다.\n");
  process.exit(1);
}

console.log(`PDF 추적 확인 — ${ROUTES.length}개 길 모두 필요한 파일이 실린다`);
