import Link from "next/link";
import { listAdminProducts } from "@/lib/admin/products";
import { formatKRW } from "@/lib/format";

export const dynamic = "force-dynamic";

const CATEGORY_LABEL: Record<string, string> = {
  reunion: "재회", romance: "연애", chemistry: "궁합", destiny: "평생",
  year: "신년", wealth: "직업·재물", study: "학업",
};

export default async function AdminProducts({ searchParams }: { searchParams: { saved?: string } }) {
  const products = await listAdminProducts();

  return (
    <div className="flex flex-col gap-space-lg">
      <div className="flex items-baseline gap-space-md">
        <h1 className="font-headline-md text-headline-md">상품</h1>
        <Link
          href="/admin/products/new"
          className="ml-auto rounded-lg bg-on-surface px-space-md py-2 font-label-sm text-label-sm text-surface"
        >
          새 상품 만들기
        </Link>
      </div>

      {searchParams.saved && (
        <p className="rounded-lg bg-surface-container px-space-md py-space-sm font-body-sm text-body-sm text-primary">
          저장했어요. 첫 화면에 반영되기까지 잠시 걸릴 수 있어요.
        </p>
      )}

      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-outline-variant/30 font-label-sm text-label-sm text-outline">
            <th className="py-space-sm font-normal">상품</th>
            <th className="py-space-sm font-normal">분류</th>
            <th className="py-space-sm text-right font-normal">가격</th>
            <th className="py-space-sm font-normal">상태</th>
            <th className="py-space-sm font-normal">출처</th>
          </tr>
        </thead>
        <tbody>
          {products.map((row) => (
            <tr key={row.slug} className="border-b border-outline-variant/15">
              <td className="py-space-sm">
                <Link href={`/admin/products/${row.slug}`} className="font-body-sm text-body-sm hover:underline">
                  {row.title}
                </Link>
                <p className="font-label-sm text-label-sm text-outline">{row.slug}</p>
              </td>
              <td className="py-space-sm font-label-sm text-label-sm text-on-surface-variant">
                {CATEGORY_LABEL[row.category] ?? row.category}
              </td>
              <td className="py-space-sm text-right font-label-sm text-label-sm">
                {formatKRW(row.price)}
                {row.originalPrice && (
                  <span className="ml-1 text-outline line-through">{formatKRW(row.originalPrice)}</span>
                )}
              </td>
              <td className="py-space-sm font-label-sm text-label-sm">
                <span className={row.isActive ? "text-on-surface" : "text-error"}>
                  {row.isActive ? "판매 중" : "내림"}
                </span>
              </td>
              <td className="py-space-sm font-label-sm text-label-sm text-outline">
                {/* 코드에 적힌 상품은 주소와 입력 질문을 배포로만 바꾼다 */}
                {row.builtIn ? (row.overridden ? "코드 + 수정됨" : "코드") : "운영 화면"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
