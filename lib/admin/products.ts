import "server-only";

import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { modes } from "@/lib/env";
import { getReport as getBuiltIn, REPORTS, type ReportProduct } from "@/lib/reports/catalog";
import { GUIDES } from "@/lib/story/guides";
import { SAZU_TOPICS } from "@/lib/sazu/schemas";

/**
 * 운영 화면에서 상품을 만들고 고친다.
 *
 * 쓰기는 전부 여기를 지난다. 가격처럼 돈이 걸린 값이 여러 곳에서 고쳐지면 어디서 틀렸는지
 * 찾을 수 없으므로, 검증도 한곳에 모은다.
 *
 * 부르는 자리는 반드시 requireAdmin() 뒤여야 한다 — 여기에는 권한 검사가 없다.
 */

export const COVERS = ["highlightReunion", "thumbReunion", "thumbLove", "thumbCompatibility", "thumbLife"] as const;
export const CATEGORIES = ["reunion", "romance", "chemistry", "destiny", "year", "wealth", "study"] as const;
export const PARTNERS = ["none", "optional", "required"] as const;
export const GUIDE_IDS = Object.keys(GUIDES) as [string, ...string[]];

/** 줄바꿈으로 적은 목록을 배열로. 빈 줄은 버린다 */
const lines = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

export const productFormSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2, "주소에 쓸 이름을 2자 이상 적어 주세요.")
    .max(40)
    .regex(/^[a-z0-9-]+$/, "영문 소문자·숫자·하이픈만 쓸 수 있어요."),
  title: z.string().trim().min(2, "상품 이름을 적어 주세요.").max(120),
  description: z.string().trim().min(10, "설명을 10자 이상 적어 주세요.").max(500),
  category: z.enum(CATEGORIES),
  categoryLabel: z.string().trim().max(30).optional(),
  price: z.coerce.number().int().min(100, "100원 이상으로 적어 주세요.").max(1_000_000),
  originalPrice: z.coerce.number().int().max(1_000_000).optional(),
  discountLabel: z.string().trim().max(20).optional(),
  guide: z.enum(GUIDE_IDS),
  partner: z.enum(PARTNERS),
  cover: z.enum(COVERS),
  topics: z.array(z.enum(SAZU_TOPICS)).min(1, "토픽을 하나 이상 고르세요."),
  chapters: z.string().trim().min(1, "목차를 한 줄에 하나씩 적어 주세요."),
  disclaimer: z.string().trim().max(300).optional(),
  isActive: z.boolean(),
});

export type ProductFormInput = z.input<typeof productFormSchema>;

export interface SaveResult {
  ok: boolean;
  /** 입력 칸별 오류. 화면에서 그 칸 아래에 띄운다 */
  errors?: Record<string, string>;
  message?: string;
}

export async function saveProduct(raw: unknown, options: { creating: boolean }): Promise<SaveResult> {
  const parsed = productFormSchema.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      errors[key] ??= issue.message;
    }
    return { ok: false, errors };
  }
  const input = parsed.data;

  if (input.originalPrice !== undefined && input.originalPrice < input.price) {
    return { ok: false, errors: { originalPrice: "할인 전 가격은 판매가보다 크거나 같아야 해요." } };
  }
  if (modes.data() !== "supabase") {
    return { ok: false, message: "Supabase 가 연결되지 않아 상품을 저장할 수 없어요." };
  }

  const db = getSupabaseAdmin();

  if (options.creating) {
    const { data: existing } = await db.from("reports").select("slug").eq("slug", input.slug).maybeSingle();
    if (existing) return { ok: false, errors: { slug: "이미 쓰고 있는 주소예요." } };
  }

  const row = {
    slug: input.slug,
    kind: "report",
    category: input.category,
    category_label: input.categoryLabel || null,
    title: input.title,
    description: input.description,
    price: input.price,
    original_price: input.originalPrice ?? null,
    discount_label: input.discountLabel || null,
    guide: input.guide,
    partner: input.partner,
    cover: input.cover,
    topics: input.topics,
    chapters: lines(input.chapters),
    // 질문은 코드 상품의 것을 그대로 쓴다. 운영 화면에서 만들 수 있게 하면 입력 흐름까지
    // 바뀌는데, 그건 글자 몇 줄이 아니라 설계라서 배포를 거치는 편이 낫다.
    questions: getBuiltIn(input.slug)?.questions ?? [],
    disclaimer: input.disclaimer || null,
    is_active: input.isActive,
    is_custom: !getBuiltIn(input.slug),
  };

  const { error } = await db.from("reports").upsert(row, { onConflict: "slug" });
  if (error) {
    console.error("[admin] 상품 저장 실패", error);
    return { ok: false, message: `저장하지 못했어요: ${error.message}` };
  }
  return { ok: true };
}

export interface AdminProductRow {
  slug: string;
  title: string;
  price: number;
  originalPrice: number | null;
  category: string;
  isActive: boolean;
  /** 코드에 적힌 상품인지. 그렇다면 주소와 질문은 배포로만 바꾼다 */
  builtIn: boolean;
  /** DB 에 행이 있는지 — 없으면 코드 기본값 그대로 팔리는 중 */
  overridden: boolean;
}

export async function listAdminProducts(): Promise<AdminProductRow[]> {
  const byslug = new Map<string, AdminProductRow>();
  for (const report of REPORTS as readonly ReportProduct[]) {
    if (report.kind !== "report") continue;
    byslug.set(report.slug, {
      slug: report.slug,
      title: report.title,
      price: report.price,
      originalPrice: report.originalPrice ?? null,
      category: report.category,
      isActive: true,
      builtIn: true,
      overridden: false,
    });
  }

  if (modes.data() === "supabase") {
    const { data } = await getSupabaseAdmin().from("reports").select("*").eq("kind", "report");
    for (const row of data ?? []) {
      const slug = row.slug as string;
      byslug.set(slug, {
        slug,
        title: (row.title as string) ?? byslug.get(slug)?.title ?? slug,
        price: (row.price as number) ?? 0,
        originalPrice: (row.original_price as number | null) ?? null,
        category: (row.category as string) ?? "destiny",
        isActive: row.is_active !== false,
        builtIn: Boolean(getBuiltIn(slug)),
        overridden: true,
      });
    }
  }

  return Array.from(byslug.values()).sort((a, b) => b.price - a.price);
}

/** 수정 화면에 채울 값. DB 행이 없으면 코드 상품에서 가져온다 */
export async function loadProductForm(slug: string): Promise<ProductFormInput | null> {
  const builtIn = getBuiltIn(slug);
  let row: Record<string, unknown> | null = null;
  if (modes.data() === "supabase") {
    const { data } = await getSupabaseAdmin().from("reports").select("*").eq("slug", slug).maybeSingle();
    row = (data as Record<string, unknown> | null) ?? null;
  }
  if (!row && !builtIn) return null;

  const pick = <T>(key: string, fallback: T): T => (row?.[key] as T | undefined) ?? fallback;

  return {
    slug,
    title: pick("title", builtIn?.title ?? ""),
    description: pick("description", builtIn?.description ?? ""),
    category: pick("category", builtIn?.category ?? "destiny") as ProductFormInput["category"],
    categoryLabel: pick("category_label", builtIn?.categoryLabel ?? "") ?? "",
    price: pick("price", builtIn?.price ?? 0),
    originalPrice: pick("original_price", builtIn?.originalPrice) ?? undefined,
    discountLabel: pick("discount_label", builtIn?.discountLabel ?? "") ?? "",
    guide: pick("guide", builtIn?.guide ?? "doham"),
    partner: pick("partner", builtIn?.partner ?? "none") as ProductFormInput["partner"],
    cover: pick("cover", builtIn?.cover ?? "thumbLife") as ProductFormInput["cover"],
    topics: (pick("topics", builtIn?.topics ?? ["life"]) as ProductFormInput["topics"]),
    chapters: (pick("chapters", builtIn?.chapters ?? []) as string[]).join("\n"),
    disclaimer: pick("disclaimer", builtIn?.disclaimer ?? "") ?? "",
    isActive: row ? row.is_active !== false : true,
  };
}
