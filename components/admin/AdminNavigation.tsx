"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

const NAV = [
  { href: "/admin", label: "현황", icon: "space_dashboard" },
  { href: "/admin/payments", label: "결제", icon: "credit_card" },
  { href: "/admin/readings", label: "풀이", icon: "auto_stories" },
  { href: "/admin/products", label: "상품", icon: "inventory_2" },
  { href: "/admin/members", label: "회원", icon: "group" },
];

export function AdminNavigation() {
  const pathname = usePathname();
  return <nav className="admin-navigation" aria-label="운영 메뉴">
    {NAV.map(({ href, label, icon }) => {
      const active = href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
      return <Link key={href} href={href} aria-current={active ? "page" : undefined}>
        <Icon name={icon} filled={active} />
        <span>{label}</span>
      </Link>;
    })}
  </nav>;
}

export function AdminNotificationsLink() {
  const active = usePathname() === "/admin/notifications";
  return <Link className="admin-notifications-link" href="/admin/notifications" aria-label="앱 설치 및 알림" aria-current={active ? "page" : undefined}>
    <Icon name="notifications" filled={active} />
    <span>앱 및 알림</span>
  </Link>;
}
