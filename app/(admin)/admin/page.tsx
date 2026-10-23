import Link from "next/link";
import { listProductSales, loadSummary } from "@/lib/admin/queries";
import { formatKRW } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [summary, sales] = await Promise.all([loadSummary(), listProductSales()]);

  if (!summary.available) {
    return (
      <p className="rounded-lg bg-surface-container p-space-lg font-body-md text-body-md text-on-surface-variant">
        Supabase 가 연결되지 않아 집계를 읽을 수 없어요. 로컬 개발 환경에서는 운영 화면이 비어 있습니다.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-space-xl">
      <section>
        <h1 className="mb-space-md font-headline-md text-headline-md">오늘</h1>
        <div className="grid grid-cols-2 gap-space-md md:grid-cols-4">
          <Stat label="오늘 매출" value={formatKRW(summary.today.revenue)} note={`${summary.today.paidCount}건`} />
          <Stat label="최근 7일" value={formatKRW(summary.week.revenue)} note={`${summary.week.paidCount}건`} />
          <Stat label="구매한 사람" value={`${summary.users}명`} note="누적" />
          <Stat
            label="결제 진행 중"
            value={`${summary.pendingPayments}건`}
            note={summary.pendingPayments > 0 ? "결제창에서 멈춘 건" : "없음"}
            tone={summary.pendingPayments > 0 ? "warn" : undefined}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-space-md font-headline-md text-headline-md">풀이 상태</h2>
        <div className="grid grid-cols-2 gap-space-md md:grid-cols-4">
          <Stat label="완료" value={`${summary.readings.ready}`} />
          <Stat
            label="생성 중"
            value={`${summary.readings.generating}`}
            note={summary.readings.generating > 0 ? "오래 머물면 확인 필요" : undefined}
          />
          <Stat
            label="실패"
            value={`${summary.readings.failed}`}
            tone={summary.readings.failed > 0 ? "error" : undefined}
            href={summary.readings.failed > 0 ? "/admin/readings?status=failed" : undefined}
          />
          <Stat label="결제 전" value={`${summary.readings.draft}`} note="입력만 한 건" />
        </div>
      </section>

      <section>
        <h2 className="mb-space-md font-headline-md text-headline-md">무엇이 팔리나</h2>
        {sales.length === 0 ? (
          <p className="font-body-sm text-body-sm text-outline">아직 결제된 건이 없어요.</p>
        ) : (
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-outline-variant/30 font-label-sm text-label-sm text-outline">
                <th className="py-space-sm font-normal">상품</th>
                <th className="py-space-sm text-right font-normal">건수</th>
                <th className="py-space-sm text-right font-normal">매출</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((row) => (
                <tr key={row.title} className="border-b border-outline-variant/15">
                  <td className="py-space-sm font-body-sm text-body-sm">{row.title}</td>
                  <td className="py-space-sm text-right font-body-sm text-body-sm text-on-surface-variant">{row.count}</td>
                  <td className="py-space-sm text-right font-label-sm text-label-sm">{formatKRW(row.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function Stat({
  label, value, note, tone, href,
}: {
  label: string;
  value: string;
  note?: string;
  tone?: "warn" | "error";
  href?: string;
}) {
  const body = (
    <div className="flex flex-col gap-1 rounded-lg bg-surface-container p-space-md">
      <span className="font-label-sm text-label-sm text-outline">{label}</span>
      <span
        className={`font-headline-md text-headline-md ${
          tone === "error" ? "text-error" : tone === "warn" ? "text-tertiary" : "text-on-surface"
        }`}
      >
        {value}
      </span>
      {note && <span className="font-label-sm text-label-sm text-on-surface-variant">{note}</span>}
    </div>
  );
  return href ? (
    <Link href={href} className="transition-opacity hover:opacity-80">
      {body}
    </Link>
  ) : (
    body
  );
}
