import Link from "next/link";
import { AdminBadge, AdminEmpty, AdminPageTitle, AdminTable } from "@/components/admin/AdminView";
import { Icon } from "@/components/ui/Icon";
import { requireAdmin } from "@/lib/admin/access";
import { listAdminProducts } from "@/lib/admin/products";
import { formatKRW } from "@/lib/format";

const CATEGORY_LABEL: Record<string, string> = {
  reunion: "재회", romance: "연애", chemistry: "궁합", destiny: "평생",
  year: "신년", wealth: "직업·재물", study: "학업",
};

export default async function AdminProducts({ searchParams }: { searchParams: Promise<{ saved?: string; q?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 60) : "";
  const products = await listAdminProducts();
  const needle = query.toLocaleLowerCase("ko");
  const filtered = needle ? products.filter((product) => `${product.title} ${product.slug}`.toLocaleLowerCase("ko").includes(needle)) : products;
  return <div className="admin-page">
    <AdminPageTitle title="상품" description="판매 중인 상품의 이름과 가격, 노출 상태를 관리하세요.">
      <Link href="/admin/products/new" className="admin-button admin-button-primary"><Icon name="add" /> 새 상품 만들기</Link>
    </AdminPageTitle>
    {params.saved && <p role="status" className="admin-notice">상품 변경을 저장했어요.</p>}
    <form className="admin-search" action="/admin/products" method="get">
      <label className="sr-only" htmlFor="admin-product-search">상품명 또는 주소</label>
      <input id="admin-product-search" name="q" defaultValue={query} maxLength={60} placeholder="상품명 또는 주소" />
      <button className="admin-button" type="submit"><Icon name="search" /> 상품 찾기</button>
      {query && <Link className="admin-text-link" href="/admin/products">검색 초기화</Link>}
    </form>
    <section className="admin-panel">
      {filtered.length ? <AdminTable columns={["상품", "분류", "가격", "상태", "출처"]}>
        {filtered.map((row) => <tr key={row.slug}>
          <td data-label="상품"><Link href={`/admin/products/${encodeURIComponent(row.slug)}`} className="admin-row-link">{row.title}</Link><small>{row.slug}</small></td>
          <td data-label="분류">{CATEGORY_LABEL[row.category] ?? row.category}</td>
          <td data-label="가격"><strong>{formatKRW(row.price)}</strong>{row.originalPrice && <small><del>{formatKRW(row.originalPrice)}</del></small>}</td>
          <td data-label="상태"><AdminBadge tone={row.isActive ? "positive" : "muted"}>{row.isActive ? "판매 중" : "내림"}</AdminBadge></td>
          <td data-label="출처">{row.builtIn ? (row.overridden ? "기본 상품 · 수정됨" : "기본 상품") : "운영 화면"}</td>
        </tr>)}
      </AdminTable> : <AdminEmpty>검색어와 일치하는 상품이 없어요.</AdminEmpty>}
    </section>
  </div>;
}
