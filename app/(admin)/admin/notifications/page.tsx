import { PushSettings } from "@/components/admin/PushSettings";
import { requireAdmin } from "@/lib/admin/access";
import { adminPushPublicKey } from "@/lib/admin/push";

export default async function AdminNotifications() {
  await requireAdmin();
  return <div className="admin-page">
    <header className="admin-page-title"><div><h1>앱 및 알림</h1><p>운영 앱을 설치하고 이 기기의 결제 알림을 관리하세요.</p></div></header>
    <PushSettings publicKey={adminPushPublicKey()} />
  </div>;
}
