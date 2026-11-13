import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { AdminAppProvider } from "@/components/admin/AdminAppProvider";
import { AdminNavigation, AdminNotificationsLink } from "@/components/admin/AdminNavigation";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { requireAdmin } from "@/lib/admin/access";
import "./admin.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "운명대로 운영",
  robots: { index: false, follow: false },
  manifest: "/admin/manifest.webmanifest",
  appleWebApp: { capable: true, title: "운명대로 운영", statusBarStyle: "black-translucent" },
  icons: { apple: "/admin/icon-192.png" },
};
export const viewport: Viewport = { themeColor: "#141413", viewportFit: "cover" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();

  return <AdminAppProvider>
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/admin" className="admin-brand"><Logo /><span>운명대로<strong>운영 센터</strong></span></Link>
        <AdminNavigation />
        <div className="admin-sidebar-bottom">
          <span className="admin-account" title={user.email ?? undefined}>{user.email}</span>
          <Link href="/"><Icon name="open_in_new" />고객 사이트</Link>
        </div>
      </aside>
      <div className="admin-workspace">
        <header className="admin-topbar">
          <Link href="/admin" className="admin-brand admin-brand-mobile"><Logo /><strong>운명대로 운영</strong></Link>
          <AdminNotificationsLink />
        </header>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  </AdminAppProvider>;
}
