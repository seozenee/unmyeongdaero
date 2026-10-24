import Link from "next/link";
import { ProductForm } from "@/components/admin/ProductForm";
import { Icon } from "@/components/ui/Icon";
import { saveProductAction } from "../actions";
import { PRODUCT_FORM_OPTIONS } from "../options";

export const dynamic = "force-dynamic";

export default function NewProduct() {
  return (
    <div className="flex flex-col gap-space-lg">
      <Link href="/admin/products" className="flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant">
        <Icon name="chevron_left" className="text-[18px]" /> 상품 목록
      </Link>
      <h1 className="font-headline-md text-headline-md">새 상품 만들기</h1>
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        여기서 만든 상품은 배포 없이 바로 팔립니다. 입력 대화에서 묻는 선택형 질문은 코드에 있는 상품의 것을 따르므로,
        새로운 질문이 필요하면 개발자에게 요청하세요.
      </p>
      <ProductForm
        action={saveProductAction.bind(null, true)}
        initial={null}
        lockSlug={false}
        options={PRODUCT_FORM_OPTIONS}
      />
    </div>
  );
}
