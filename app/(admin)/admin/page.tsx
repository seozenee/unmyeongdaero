import Link from "next/link";
import { AdminBadge, adminDate, AdminEmpty, AdminPageTitle } from "@/components/admin/AdminView";
import { Icon } from "@/components/ui/Icon";
import { requireAdmin } from "@/lib/admin/access";
import { listPayments, listProductSales, loadSummary } from "@/lib/admin/queries";
import { formatKRW } from "@/lib/format";

const number = new Intl.NumberFormat("ko-KR");

export default async function AdminHome() {
  await requireAdmin();
  const [summary, sales, latest] = await Promise.all([
    loadSummary(), listProductSales(), listPayments({ status: "paid", realOnly: true, limit: 5 }),
  ]);
  const stats = [
    { label: "오늘 결제액", value: formatKRW(summary.today.revenue), note: `결제 ${summary.today.paidCount}건`, icon: "payments", href: "/admin/payments?status=paid" },
    { label: "최근 7일 결제액", value: formatKRW(summary.week.revenue), note: `결제 ${summary.week.paidCount}건`, icon: "monitoring", href: "/admin/payments?status=paid" },
    { label: "결제 진행 중", value: `${number.format(summary.pendingPayments)}건`, note: "주문 상태 확인", icon: "hourglass_top", href: "/admin/payments?status=pending" },
    { label: "생성 실패", value: `${number.format(summary.readings.failed)}건`, note: "풀이 상태 확인", icon: "error", href: "/admin/readings?status=failed" },
  ];
  const maxRevenue = Math.max(1, ...summary.daily.map(({ revenue }) => revenue));
  return <div className="admin-page">
    <AdminPageTitle title="운영 현황" description="결제와 풀이 진행 상황을 한눈에 확인하세요.">
      <Link className="admin-button" href="/admin/notifications"><Icon name="notifications" /> 결제 알림 설정</Link>
    </AdminPageTitle>
    {!summary.available && <p className="admin-notice">로컬 미리보기입니다. 운영 데이터베이스에 연결하면 실제 결제와 풀이 현황이 표시돼요.</p>}

    <section className="admin-stat-grid" aria-label="운영 지표">
      {stats.map((stat) => <Link key={stat.label} className="admin-stat" href={stat.href}>
        <span className="admin-stat-top">{stat.label}<Icon name={stat.icon} /></span>
        <strong>{summary.available ? stat.value : "—"}</strong>
        <span>{summary.available ? stat.note : "미연결"}</span>
      </Link>)}
    </section>

    <div className="admin-dashboard-grid">
      <section className="admin-panel">
        <header className="admin-panel-heading"><div><h2>최근 7일 결제</h2><p>한국 시간 기준 · 실제 승인 금액</p></div><Icon name="monitoring" /></header>
        {summary.available ? <ul className="admin-revenue-chart" aria-label="최근 7일 날짜별 결제액">
          {summary.daily.map(({ date, count, revenue }) => <li key={date}>
            <span className="sr-only">{date} {count}건 {formatKRW(revenue)}</span>
            <span className="admin-chart-track" aria-hidden="true" title={`${date} · ${formatKRW(revenue)}`}>
              <span style={{ height: `${revenue / maxRevenue * 100}%` }} />
            </span>
            <small aria-hidden="true">{date.slice(5).replace("-", "/")}</small>
          </li>)}
        </ul> : <AdminEmpty>결제 추이를 불러오려면 운영 데이터 연결이 필요해요.</AdminEmpty>}
      </section>
      <section className="admin-panel">
        <header className="admin-panel-heading"><div><h2>풀이 상태</h2><p>최근 운영 내역 기준</p></div><Link className="admin-text-link" href="/admin/readings">전체 보기 <Icon name="arrow_forward" /></Link></header>
        <div className="admin-reading-grid">
          {([{ state: "ready", label: "완료", tone: "positive" }, { state: "generating", label: "생성 중", tone: "warning" }, { state: "failed", label: "실패", tone: "negative" }, { state: "draft", label: "결제 전", tone: "muted" }] as const)
            .map(({ state, label, tone }) => <Link key={state} href={`/admin/readings?status=${state}`}>
              <AdminBadge tone={tone}>{label}</AdminBadge><strong>{summary.available ? number.format(summary.readings[state]) : "—"}</strong>
            </Link>)}
        </div>
      </section>
      <section className="admin-panel">
        <header className="admin-panel-heading"><div><h2>최근 승인 주문</h2><p>승인 시각이 최근인 순서</p></div><Link className="admin-text-link" href="/admin/payments">전체 보기 <Icon name="arrow_forward" /></Link></header>
        {latest.length ? <ul className="admin-list">{latest.map((payment) => <li key={payment.paymentId}>
          <Link href={`/admin/payments?${new URLSearchParams({ order: payment.paymentId })}`}>
            <span><strong>{payment.reportTitle}</strong><small>{adminDate(payment.paidAt)}</small></span>
            <b>{formatKRW(payment.amount)}</b>
          </Link>
        </li>)}</ul> : <AdminEmpty>표시할 승인 주문이 없어요.</AdminEmpty>}
      </section>
      <section className="admin-panel">
        <header className="admin-panel-heading"><div><h2>상품별 판매</h2><p>실제 결제액이 높은 상품</p></div><Link className="admin-text-link" href="/admin/products">상품 관리 <Icon name="arrow_forward" /></Link></header>
        {sales.length ? <ul className="admin-list">{sales.slice(0, 5).map((sale) => <li key={sale.slug}>
          <div><span><strong>{sale.title}</strong><small>{number.format(sale.count)}건</small></span><b>{formatKRW(sale.revenue)}</b></div>
        </li>)}</ul> : <AdminEmpty>표시할 판매 내역이 없어요.</AdminEmpty>}
      </section>
    </div>
  </div>;
}
