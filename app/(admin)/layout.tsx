import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/access";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "운영", robots: { index: false, follow: false } };

const NAV = [
  { href: "/admin", label: "현황" },
  { href: "/admin/products", label: "상품" },
  { href: "/admin/readings", label: "풀이" },
  { href: "/admin/payments", label: "결제" },
];

/**
 * 운영 화면의 틀.
 *
 * 고객 화면(app)과 레이아웃을 공유하지 않는다. 하는 일이 다르다 — 고객 화면은 한 손에
 * 들어오는 폭이지만, 운영 화면은 표를 넓게 펴 놓고 한눈에 훑어야 한다.
 *
 * 권한 검사는 여기 한 곳에서만 한다. 하위 페이지가 각자 검사하게 두면 새 페이지를 만들 때
 * 빠뜨리기 쉽다.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <header className="border-b border-outline-variant/30 bg-surface-container-lowest">
        <div className="mx-auto flex max-w-6xl items-center gap-space-lg px-space-lg py-space-md">
          <Link href="/admin" className="font-label-md text-label-md text-on-surface">
            운명대로 <span className="text-outline">운영</span>
          </Link>
          <nav className="flex gap-space-md">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="font-label-sm text-label-sm text-on-surface-variant transition-colors hover:text-on-surface"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <span className="ml-auto font-label-sm text-label-sm text-outline">{user.email}</span>
          <Link href="/" className="font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface">
            사이트로
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-space-lg py-space-xl">{children}</main>
    </div>
  );
}
