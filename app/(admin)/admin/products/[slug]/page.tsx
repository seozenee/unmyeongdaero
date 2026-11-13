import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageTitle } from "@/components/admin/AdminView";
import { requireAdmin } from "@/lib/admin/access";
import { ProductForm } from "@/components/admin/ProductForm";
import { Icon } from "@/components/ui/Icon";
import { loadProductForm } from "@/lib/admin/products";
import { getReport } from "@/lib/reports/catalog";
import { saveProductAction } from "../actions";
import { PRODUCT_FORM_OPTIONS } from "../options";

export const dynamic = "force-dynamic";

export default async function EditProduct({ params: paramsPromise }: { params: Promise<{ slug: string }> }) {
  await requireAdmin();
  const params = await paramsPromise;
  const initial = await loadProductForm(params.slug);
  if (!initial) notFound();
  const builtIn = Boolean(getReport(params.slug));

  return (
    <div className="admin-page">
      <Link href="/admin/products" className="admin-text-link">
        <Icon name="chevron_left" className="text-[18px]" /> 상품 목록
      </Link>
      <AdminPageTitle title={initial.title} description="상품 정보와 판매 상태를 수정하세요." />
      {builtIn && (
        <p className="rounded-lg bg-surface-container p-space-md font-body-sm text-body-sm text-on-surface-variant">
          코드에 적힌 상품이에요. 여기서 고친 값이 코드 기본값을 덮어씁니다. 주소(slug)는 바꿀 수 없어요 —
          바꾸면 이미 팔린 기록과 끊깁니다.
        </p>
      )}
      <div className="admin-panel admin-editor"><ProductForm
        action={saveProductAction.bind(null, false)}
        initial={initial}
        lockSlug={builtIn}
        options={PRODUCT_FORM_OPTIONS}
      /></div>
    </div>
  );
}
