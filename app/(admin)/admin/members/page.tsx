import Link from "next/link";
import { AdminBadge, adminDate, AdminEmpty, AdminPageTitle, AdminTable } from "@/components/admin/AdminView";
import { requireAdmin } from "@/lib/admin/access";
import { listAdminMembers } from "@/lib/admin/queries";

const PROVIDERS: Record<string, string> = { kakao: "카카오", email: "이메일", google: "Google", apple: "Apple" };

export default async function AdminMembers({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireAdmin();
  const raw = (await searchParams).page;
  const requested = typeof raw === "string" && /^\d{1,6}$/.test(raw) ? Number(raw) : 1;
  const page = Math.max(1, requested);
  const { members, total, nextPage, available } = await listAdminMembers(page);
  return <div className="admin-page">
    <AdminPageTitle title="회원" description="가입 방식과 최근 로그인 내역을 확인하세요.">
      {total !== null && <AdminBadge tone="muted">전체 {total.toLocaleString("ko-KR")}명</AdminBadge>}
    </AdminPageTitle>
    <section className="admin-panel">
      {members.length ? <AdminTable columns={["계정", "가입 방식", "가입일", "최근 로그인"]}>
        {members.map((member) => <tr key={member.id}>
          <td data-label="계정"><strong>{member.email ?? "이메일 미제공"}</strong>{member.isAdmin && <AdminBadge tone="positive">운영자</AdminBadge>}</td>
          <td data-label="가입 방식">{PROVIDERS[member.provider] ?? "기타"}</td>
          <td data-label="가입일">{adminDate(member.createdAt)}</td>
          <td data-label="최근 로그인">{adminDate(member.lastSignInAt)}</td>
        </tr>)}
      </AdminTable> : <AdminEmpty>{available ? "이 페이지에 표시할 회원이 없어요." : "회원 목록은 운영 데이터베이스 연결 후 표시돼요."}</AdminEmpty>}
      {available && (page > 1 || nextPage) && <nav className="admin-pagination" aria-label="회원 목록 페이지">
        {page > 1 && <Link className="admin-button" href={`/admin/members?page=${page - 1}`}>이전</Link>}
        <span>{page} 페이지</span>
        {nextPage && <Link className="admin-button" href={`/admin/members?page=${nextPage}`}>다음</Link>}
      </nav>}
    </section>
  </div>;
}
