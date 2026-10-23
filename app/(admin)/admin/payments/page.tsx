import Link from "next/link";
import { listPayments } from "@/lib/admin/queries";
import { formatKRW } from "@/lib/format";

export const dynamic = "force-dynamic";

const FILTERS = [
  { value: "", label: "전체" },
  { value: "paid", label: "완료" },
  { value: "pending", label: "진행 중" },
  { value: "failed", label: "실패" },
  { value: "cancelled", label: "취소" },
];

const STATUS_LABEL: Record<string, string> = {
  pending: "진행 중", paid: "완료", failed: "실패", cancelled: "취소",
};

const when = (iso: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));

export default async function AdminPayments({ searchParams }: { searchParams: { status?: string } }) {
  const status = FILTERS.some((filter) => filter.value === searchParams.status) ? searchParams.status : "";
  const rows = await listPayments({ status: status || undefined, limit: 100 });

  return (
    <div className="flex flex-col gap-space-lg">
      <div className="flex items-baseline gap-space-md">
        <h1 className="font-headline-md text-headline-md">결제</h1>
        <nav className="flex gap-space-sm">
          {FILTERS.map((filter) => (
            <Link
              key={filter.value || "all"}
              href={filter.value ? `/admin/payments?status=${filter.value}` : "/admin/payments"}
              className={`rounded-full px-space-sm py-1 font-label-sm text-label-sm transition-colors ${
                (status ?? "") === filter.value
                  ? "bg-surface-container-highest text-on-surface"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {filter.label}
            </Link>
          ))}
        </nav>
      </div>

      {rows.length === 0 ? (
        <p className="font-body-sm text-body-sm text-outline">해당하는 결제가 없어요.</p>
      ) : (
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-outline-variant/30 font-label-sm text-label-sm text-outline">
              <th className="py-space-sm font-normal">시각</th>
              <th className="py-space-sm font-normal">상태</th>
              <th className="py-space-sm font-normal">상품</th>
              <th className="py-space-sm text-right font-normal">금액</th>
              <th className="py-space-sm font-normal">주문번호</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.paymentId} className="border-b border-outline-variant/15 align-top">
                <td className="whitespace-nowrap py-space-sm font-label-sm text-label-sm text-on-surface-variant">
                  {when(row.paidAt ?? row.createdAt)}
                </td>
                <td className="py-space-sm">
                  <span
                    className={`font-label-sm text-label-sm ${
                      row.status === "paid"
                        ? "text-on-surface"
                        : row.status === "pending"
                          ? "text-tertiary"
                          : "text-error"
                    }`}
                  >
                    {STATUS_LABEL[row.status] ?? row.status}
                  </span>
                  {row.failureReason && (
                    <p className="mt-1 max-w-xs font-label-sm text-label-sm text-outline">{row.failureReason}</p>
                  )}
                </td>
                <td className="py-space-sm font-body-sm text-body-sm">{row.reportTitle}</td>
                <td className="py-space-sm text-right font-label-sm text-label-sm">{formatKRW(row.amount)}</td>
                <td className="py-space-sm font-label-sm text-label-sm text-outline">
                  {/* 환불·문의 때 토스 대시보드에서 찾는 값 */}
                  <span className="select-all">{row.paymentId}</span>
                  {row.pgTransactionId && (
                    <p className="mt-0.5 select-all text-outline/70">{row.pgTransactionId}</p>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
