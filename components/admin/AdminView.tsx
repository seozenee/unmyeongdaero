import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

const dateFormat = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul", year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit",
});
export const adminDate = (date: string | null | undefined) => date ? dateFormat.format(new Date(date)) : "—";

export function AdminPageTitle({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
  return <header className="admin-page-title">
    <div><h1>{title}</h1>{description && <p>{description}</p>}</div>
    {children}
  </header>;
}

export function AdminBadge({ tone, children }: { tone: "positive" | "warning" | "negative" | "muted"; children: ReactNode }) {
  return <span className="admin-badge" data-tone={tone}>{children}</span>;
}

export function AdminEmpty({ children }: { children: ReactNode }) {
  return <p className="admin-empty">{children}</p>;
}

export function AdminTable({ columns, children }: { columns: readonly string[]; children: ReactNode }) {
  return <div className="admin-table-wrap">
    <table className="admin-table">
      <thead><tr>{columns.map((label) => <th key={label} scope="col">{label}</th>)}</tr></thead>
      <tbody>{children}</tbody>
    </table>
  </div>;
}

export function AdminFilters({ base, filters, current, history }: {
  base: string;
  filters: readonly { value: string; label: string }[];
  current: string;
  history: boolean;
}) {
  return <div className="admin-filter-row">
    <nav className="admin-filters" aria-label="상태 필터">
      {filters.map(({ value, label }) => {
        const query = new URLSearchParams();
        if (value) query.set("status", value);
        if (history) query.set("history", "1");
        return <Link key={value} href={query.size ? `${base}?${query}` : base} aria-current={current === value ? "page" : undefined}>{label}</Link>;
      })}
    </nav>
    <Link className="admin-text-link" href={`${base}?${new URLSearchParams({
      ...(current ? { status: current } : {}),
      ...(history ? {} : { history: "1" }),
    })}`}>
      <Icon name="history" />{history ? "최근 내역만 보기" : "초기화 이전 내역 포함"}
    </Link>
  </div>;
}
