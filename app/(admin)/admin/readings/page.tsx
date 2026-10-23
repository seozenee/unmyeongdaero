import Link from "next/link";
import { listReadings } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

const FILTERS = [
  { value: "", label: "전체" },
  { value: "failed", label: "실패" },
  { value: "generating", label: "생성 중" },
  { value: "ready", label: "완료" },
  { value: "draft", label: "결제 전" },
];

const STATUS_LABEL: Record<string, string> = {
  draft: "결제 전", generating: "생성 중", ready: "완료", failed: "실패",
};

const NOTIFY_LABEL: Record<string, string> = {
  "reading-started": "시작 알림 발송",
  "reading-ready": "완료 알림 발송",
};

/** 언제 일어난 일인지 — 초 단위는 필요 없다 */
const when = (iso: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));

export default async function AdminReadings({ searchParams }: { searchParams: { status?: string } }) {
  const status = FILTERS.some((filter) => filter.value === searchParams.status) ? searchParams.status : "";
  const rows = await listReadings({ status: status || undefined, limit: 100 });

  return (
    <div className="flex flex-col gap-space-lg">
      <div className="flex items-baseline gap-space-md">
        <h1 className="font-headline-md text-headline-md">풀이</h1>
        <nav className="flex gap-space-sm">
          {FILTERS.map((filter) => (
            <Link
              key={filter.value || "all"}
              href={filter.value ? `/admin/readings?status=${filter.value}` : "/admin/readings"}
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
        <p className="font-body-sm text-body-sm text-outline">해당하는 풀이가 없어요.</p>
      ) : (
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-outline-variant/30 font-label-sm text-label-sm text-outline">
              <th className="py-space-sm font-normal">시각</th>
              <th className="py-space-sm font-normal">상태</th>
              <th className="py-space-sm font-normal">상품</th>
              <th className="py-space-sm font-normal">이름</th>
              <th className="py-space-sm font-normal">알림</th>
              <th className="py-space-sm font-normal">PDF</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-outline-variant/15 align-top">
                <td className="whitespace-nowrap py-space-sm font-label-sm text-label-sm text-on-surface-variant">
                  {when(row.createdAt)}
                </td>
                <td className="py-space-sm">
                  <span
                    className={`font-label-sm text-label-sm ${
                      row.status === "failed"
                        ? "text-error"
                        : row.status === "generating"
                          ? "text-tertiary"
                          : "text-on-surface"
                    }`}
                  >
                    {STATUS_LABEL[row.status] ?? row.status}
                  </span>
                  {/* 실패는 이유가 보여야 손을 쓸 수 있다 */}
                  {row.error && <p className="mt-1 max-w-sm font-label-sm text-label-sm text-outline">{row.error}</p>}
                </td>
                <td className="py-space-sm font-body-sm text-body-sm">{row.reportTitle}</td>
                <td className="py-space-sm font-body-sm text-body-sm text-on-surface-variant">{row.subjectName}</td>
                <td className="py-space-sm font-label-sm text-label-sm text-on-surface-variant">
                  {row.notifiedKind ? (NOTIFY_LABEL[row.notifiedKind] ?? row.notifiedKind) : "—"}
                </td>
                <td className="py-space-sm font-label-sm text-label-sm text-on-surface-variant">
                  {row.hasPdf ? "있음" : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
