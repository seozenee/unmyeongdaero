import "server-only";

import { modes } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { GuideId } from "@/lib/story/guides";
import type { SazuTopic } from "@/lib/sazu/schemas";
import {
  getReport as getBuiltIn,
  REPORTS,
  type PartnerRequirement,
  type ProductKind,
  type ReportCategory,
  type ReportProduct,
  type SituationQuestion,
} from "./catalog";

/**
 * 팔 수 있는 상품 목록.
 *
 * 코드에 적힌 상품(lib/reports/catalog.ts)과 운영 화면에서 만든 상품(reports 테이블)을
 * 합쳐 돌려준다. 같은 slug 가 양쪽에 있으면 DB 쪽이 이긴다 — 배포 없이 가격을 고치거나
 * 잠시 내리기 위한 통로다.
 *
 * 코드 쪽을 없애고 전부 DB 로 옮기지 않는 이유가 둘 있다. 하나는 DB 가 비어 있거나 닿지
 * 않을 때도 가게가 열려 있어야 한다는 것, 다른 하나는 열넷의 상품 문구가 코드 리뷰를
 * 거치는 편이 낫다는 것이다.
 */

type Row = Record<string, unknown>;

const str = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : undefined);
const arr = <T>(value: unknown): T[] | undefined => (Array.isArray(value) ? (value as T[]) : undefined);

/** DB 행을 상품으로. 빠진 칸은 같은 slug 의 코드 상품에서 메운다 */
function toProduct(row: Row): ReportProduct | null {
  const slug = str(row.slug);
  if (!slug) return null;
  const base = getBuiltIn(slug);

  // 태그라인이 없는 행은 간판·후킹·설명을 셋으로 나누기 전에 심어진 시드 행이다.
  // 그런 행에서 글과 분류를 섞어 오면 옛 긴 제목 밑에 새 후킹이 붙고, 카테고리도
  // 옛 자리에 남아 탭에서 상품이 사라진다. 운영자가 고쳤을 법한 값(가격·할인)만
  // 행에서 받고, 카탈로그가 쓰는 글과 분류는 한 벌째로 코드에서 가져온다.
  const fresh = Boolean(str(row.tagline)) || !base;
  const own = <T>(value: T | undefined) => (fresh ? value : undefined);

  const category = (own(str(row.category)) ?? base?.category ?? str(row.category)) as ReportCategory | undefined;
  const title = own(str(row.title)) ?? base?.title ?? str(row.title);
  const tagline = own(str(row.tagline)) ?? base?.tagline;
  const description = own(str(row.description)) ?? base?.description ?? str(row.description);
  const price = typeof row.price === "number" ? row.price : base?.price;
  const guide = (str(row.guide) ?? base?.guide) as GuideId | undefined;
  const chapters = arr<string>(row.chapters) ?? base?.chapters;
  // 이 넷이 없으면 풀이를 만들 수 없다. 반쯤 채워진 상품은 파는 것보다 감추는 게 낫다.
  if (!category || !title || !description || !price || !guide || !chapters) return null;

  return {
    slug,
    kind: ((str(row.kind) ?? base?.kind) ?? "report") as ProductKind,
    category,
    categoryLabel: own(str(row.category_label)) ?? base?.categoryLabel ?? category,
    title,
    // 후킹 한 줄이 비면 카드가 허전해지므로 설명 첫 문장으로 메운다
    tagline: tagline ?? (description ?? "").split(/[.。]/)[0] ?? "",
    description,
    price,
    originalPrice: typeof row.original_price === "number" ? row.original_price : base?.originalPrice,
    discountLabel: str(row.discount_label) ?? base?.discountLabel,
    guide,
    roles: base?.roles,
    topics: (arr<SazuTopic>(row.topics) ?? base?.topics ?? ["life"]) as readonly SazuTopic[],
    partner: ((str(row.partner) ?? base?.partner) ?? "none") as PartnerRequirement,
    chapters,
    questions: (arr<SituationQuestion>(row.questions) ?? base?.questions ?? []) as readonly SituationQuestion[],
    detail: (row.detail as ReportProduct["detail"]) ?? base?.detail,
    cover: (own(str(row.cover)) ?? base?.cover ?? "thumbLife") as ReportProduct["cover"],
    disclaimer: str(row.disclaimer) ?? base?.disclaimer,
  };
}

async function dbRows(options: { includeHidden?: boolean } = {}): Promise<Row[]> {
  if (modes.data() !== "supabase") return [];
  let query = getSupabaseAdmin().from("reports").select("*");
  if (!options.includeHidden) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) {
    // DB 가 흔들려도 가게는 열려 있어야 한다 — 코드 쪽 상품으로 돈다
    console.error("[reports] DB 상품을 읽지 못해 코드 카탈로그만 씁니다:", error.message);
    return [];
  }
  return (data ?? []) as Row[];
}

/** 코드 + DB 를 합친 전체 상품. 같은 slug 는 DB 가 이긴다 */
export async function loadReports(
  kind: ProductKind = "report",
  options: { includeHidden?: boolean } = {},
): Promise<ReportProduct[]> {
  const merged = new Map<string, ReportProduct>();
  for (const report of REPORTS as readonly ReportProduct[]) merged.set(report.slug, report);

  const rows = await dbRows(options);
  const hidden = new Set<string>();
  for (const row of rows) {
    const slug = str(row.slug);
    if (!slug) continue;
    // is_active=false 인 행은 코드에 있어도 내린다
    if (row.is_active === false) {
      hidden.add(slug);
      continue;
    }
    const product = toProduct(row);
    if (product) merged.set(slug, product);
  }

  return Array.from(merged.values())
    .filter((report) => report.kind === kind && (options.includeHidden || !hidden.has(report.slug)))
    .sort((a, b) => b.price - a.price);
}

/** 한 상품. 없으면 undefined */
export async function loadReport(slug: string): Promise<ReportProduct | undefined> {
  if (modes.data() !== "supabase") return getBuiltIn(slug);

  const { data } = await getSupabaseAdmin().from("reports").select("*").eq("slug", slug).maybeSingle();
  if (data) {
    if ((data as Row).is_active === false) return undefined;
    const product = toProduct(data as Row);
    if (product) return product;
  }
  return getBuiltIn(slug);
}
