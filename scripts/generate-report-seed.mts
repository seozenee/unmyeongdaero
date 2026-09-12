#!/usr/bin/env node
// lib/reports/catalog.ts → supabase/migrations/0002_seed_reports.sql
//   pnpm db:seed        → 시드 SQL 재생성
//   pnpm db:seed:check  → 카탈로그와 시드가 어긋나면 exit 1 (build 전에 실행)
// Node 24 의 TypeScript 타입 제거 기능으로 catalog.ts 를 직접 읽는다(catalog 는 type import 만 가진다).
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { REPORTS } from "../lib/reports/catalog.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_PATH = resolve(root, "supabase/migrations/0002_seed_reports.sql");

const literal = (value: string | number | undefined | null) =>
  value === undefined || value === null
    ? "null"
    : typeof value === "number"
      ? String(value)
      : `'${value.replaceAll("'", "''")}'`;

const rows = REPORTS.map((report) => {
  const r = report as typeof report & { originalPrice?: number; discountLabel?: string };
  return `  (${[r.slug, r.kind, r.category, r.title, r.price, r.originalPrice, r.discountLabel, r.description]
    .map(literal)
    .join(", ")})`;
});

const sql = `-- scripts/generate-report-seed.mts 가 lib/reports/catalog.ts 에서 생성한 파일입니다. 직접 수정하지 마세요.
insert into public.reports (slug, kind, category, title, price, original_price, discount_label, description)
values
${rows.join(",\n")}
on conflict (slug) do update set
  kind = excluded.kind,
  category = excluded.category,
  title = excluded.title,
  price = excluded.price,
  original_price = excluded.original_price,
  discount_label = excluded.discount_label,
  description = excluded.description,
  is_active = true;
`;

if (process.argv.includes("--check")) {
  const current = existsSync(OUT_PATH) ? readFileSync(OUT_PATH, "utf8") : "";
  if (current !== sql) {
    console.error("[db:seed] 0002_seed_reports.sql 이 카탈로그와 다릅니다. `pnpm db:seed` 로 재생성하세요.");
    process.exit(1);
  }
  console.log("[db:seed] 시드 SQL 최신 상태");
} else {
  writeFileSync(OUT_PATH, sql);
  console.log(`[db:seed] ${REPORTS.length}개 상품 → ${OUT_PATH}`);
}
