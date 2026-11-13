import { AdminBadge, adminDate, AdminEmpty, AdminFilters, AdminPageTitle, AdminTable } from "@/components/admin/AdminView";
import { requireAdmin } from "@/lib/admin/access";
import { listReadings } from "@/lib/admin/queries";

const FILTERS = [
  { value: "", label: "전체" },
  { value: "failed", label: "실패" },
  { value: "generating", label: "생성 중" },
  { value: "ready", label: "완료" },
  { value: "draft", label: "결제 전" },
];

const NOTIFY_LABEL: Record<string, string> = {
  "reading-started": "시작 알림 발송",
  "reading-ready": "완료 알림 발송",
};

export default async function AdminReadings({ searchParams }: { searchParams: Promise<{ status?: string; history?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const status = FILTERS.some((filter) => filter.value === params.status) ? params.status ?? "" : "";
  const history = params.history === "1";
  const rows = await listReadings({ status: status || undefined, limit: 100, includeHistory: history });

  return <div className="admin-page">
    <AdminPageTitle title="풀이" description="생성 진행 상황과 PDF 준비 상태를 확인하세요." />
    <AdminFilters base="/admin/readings" filters={FILTERS} current={status} history={history} />
    <section className="admin-panel">
      {rows.length ? <AdminTable columns={["상품", "이름", "상태", "신청 시각", "알림", "PDF"]}>
        {rows.map((row) => <tr key={row.id}>
          <td data-label="상품"><strong>{row.reportTitle}</strong></td>
          <td data-label="이름">{row.subjectName}</td>
          <td data-label="상태">
            <AdminBadge tone={row.status === "ready" ? "positive" : row.status === "generating" ? "warning" : row.status === "failed" ? "negative" : "muted"}>
              {FILTERS.find((item) => item.value === row.status)?.label ?? row.status}
            </AdminBadge>
            {row.error && <small>{row.error}</small>}
          </td>
          <td data-label="신청 시각">{adminDate(row.createdAt)}</td>
          <td data-label="알림">{row.notifiedKind ? NOTIFY_LABEL[row.notifiedKind] ?? row.notifiedKind : "—"}</td>
          <td data-label="PDF"><AdminBadge tone={row.hasPdf ? "positive" : "muted"}>{row.hasPdf ? "보관됨" : "—"}</AdminBadge></td>
        </tr>)}
      </AdminTable> : <AdminEmpty>해당하는 풀이가 없어요.</AdminEmpty>}
    </section>
  </div>;
}
