import Link from "next/link";
import { AdminBadge, adminDate, AdminEmpty, AdminFilters, AdminPageTitle, AdminTable } from "@/components/admin/AdminView";
import { Icon } from "@/components/ui/Icon";
import { requireAdmin } from "@/lib/admin/access";
import { listPayments } from "@/lib/admin/queries";
import { formatKRW } from "@/lib/format";

const FILTERS = [
  { value: "", label: "전체" },
  { value: "paid", label: "완료" },
  { value: "pending", label: "진행 중" },
  { value: "failed", label: "실패" },
  { value: "cancelled", label: "취소" },
];

export default async function AdminPayments({ searchParams }: { searchParams: Promise<{ status?: string; history?: string; order?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const history = params.history === "1";
  const order = typeof params.order === "string" ? params.order.trim().slice(0, 80) : "";
  const status = !order && FILTERS.some((filter) => filter.value === params.status) ? params.status ?? "" : "";
  const rows = await listPayments({ status: status || undefined, orderId: order || undefined, limit: 100, includeHistory: history });

  return <div className="admin-page">
    <AdminPageTitle title="결제" description="주문 상태와 승인 금액을 확인하세요." />
    <form className="admin-search" action="/admin/payments" method="get">
      <label className="sr-only" htmlFor="admin-order-search">주문번호</label>
      <input id="admin-order-search" name="order" placeholder="주문번호 입력" defaultValue={order} maxLength={80} />
      <button className="admin-button" type="submit"><Icon name="search" /> 주문 찾기</button>
      {order && <Link className="admin-text-link" href="/admin/payments">검색 초기화</Link>}
    </form>
    {order ? <p className="admin-notice">주문번호 <strong className="admin-mono">{order}</strong></p>
      : <AdminFilters base="/admin/payments" filters={FILTERS} current={status} history={history} />}
    <section className="admin-panel">
      {rows.length ? <AdminTable columns={["상품", "금액", "상태", "결제 시각", "주문번호"]}>
        {rows.map((row) => <tr key={row.paymentId}>
          <td data-label="상품"><strong>{row.reportTitle}</strong>{row.provider === "mock" && <small>모의 결제 · 운영자 발급</small>}</td>
          <td data-label="금액"><strong>{formatKRW(row.amount)}</strong></td>
          <td data-label="상태">
            <AdminBadge tone={row.status === "paid" ? "positive" : row.status === "pending" ? "warning" : row.status === "failed" ? "negative" : "muted"}>
              {FILTERS.find((item) => item.value === row.status)?.label ?? row.status}
            </AdminBadge>
            {row.failureReason && <small>{row.failureReason}</small>}
          </td>
          <td data-label="결제 시각">{adminDate(row.paidAt ?? row.createdAt)}</td>
          <td data-label="주문번호"><span className="admin-mono select-all">{row.paymentId}</span>
            {row.pgTransactionId && <small className="admin-mono select-all">{row.pgTransactionId}</small>}
          </td>
        </tr>)}
      </AdminTable> : <AdminEmpty>{order ? "해당 주문번호의 결제가 없어요." : "해당하는 결제가 없어요."}</AdminEmpty>}
    </section>
  </div>;
}
