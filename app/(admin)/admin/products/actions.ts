"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/access";
import { saveProduct, type SaveResult } from "@/lib/admin/products";

/**
 * 상품 저장.
 *
 * 폼에서 바로 부르는 서버 액션이라, 권한 검사를 여기서 한 번 더 한다. 레이아웃이 이미
 * 막고 있지만 액션은 주소만 알면 직접 부를 수 있으므로 레이아웃을 믿지 않는다.
 */
export async function saveProductAction(
  creating: boolean,
  _previous: SaveResult | null,
  formData: FormData,
): Promise<SaveResult> {
  await requireAdmin();

  const text = (key: string) => String(formData.get(key) ?? "").trim();
  const number = (key: string) => {
    const value = text(key);
    return value === "" ? undefined : value;
  };

  const result = await saveProduct(
    {
      slug: text("slug"),
      title: text("title"),
      description: text("description"),
      category: text("category"),
      categoryLabel: text("categoryLabel") || undefined,
      price: text("price"),
      originalPrice: number("originalPrice"),
      discountLabel: text("discountLabel") || undefined,
      guide: text("guide"),
      partner: text("partner"),
      cover: text("cover"),
      topics: formData.getAll("topics").map(String),
      chapters: text("chapters"),
      disclaimer: text("disclaimer") || undefined,
      isActive: formData.get("isActive") === "on",
    },
    { creating },
  );

  if (!result.ok) return result;

  // 상품은 첫 화면·검색·상세에 모두 걸려 있다. 한 군데만 비우면 값이 엇갈려 보인다.
  revalidatePath("/", "layout");
  redirect("/admin/products?saved=1");
}
