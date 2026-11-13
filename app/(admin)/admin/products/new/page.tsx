import Link from "next/link";
import { AdminPageTitle } from "@/components/admin/AdminView";
import { requireAdmin } from "@/lib/admin/access";
import { ProductForm } from "@/components/admin/ProductForm";
import { Icon } from "@/components/ui/Icon";
import { saveProductAction } from "../actions";
import { PRODUCT_FORM_OPTIONS } from "../options";

export const dynamic = "force-dynamic";

export default async function NewProduct() {
  await requireAdmin();
  return (
    <div className="admin-page">
      <Link href="/admin/products" className="admin-text-link">
        <Icon name="chevron_left" className="text-[18px]" /> 상품 목록
      </Link>
      <AdminPageTitle title="새 상품 만들기" />
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        여기서 만든 상품은 배포 없이 바로 팔립니다. 입력 대화에서 묻는 선택형 질문은 코드에 있는 상품의 것을 따르므로,
        새로운 질문이 필요하면 개발자에게 요청하세요.
      </p>
      <div className="admin-panel admin-editor"><ProductForm
        action={saveProductAction.bind(null, true)}
        initial={null}
        lockSlug={false}
        options={PRODUCT_FORM_OPTIONS}
      /></div>
    </div>
  );
}
