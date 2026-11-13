"use client";

import { useEffect, useState } from "react";
import { registerAdminWorker, useAdminApp } from "./AdminAppProvider";
import { Icon } from "@/components/ui/Icon";

async function pushRequest(action: string, details: object) {
  const response = await fetch("/api/admin/push", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action, ...details }),
  });
  const result = await response.json().catch(() => null) as { subscribed?: boolean; error?: string } | null;
  if (!response.ok) throw Object.assign(new Error(result?.error ?? "알림 설정을 처리하지 못했어요. 다시 로그인한 뒤 시도해 주세요."), { status: response.status });
  return result;
}

function keyBytes(key: string) {
  return Uint8Array.from(window.atob(key.replace(/-/g, "+").replace(/_/g, "/")), (char) => char.charCodeAt(0));
}

export function PushSettings({ publicKey }: { publicKey: string | null }) {
  const { installed, ios, prompt } = useAdminApp();
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [promptUsed, setPromptUsed] = useState<InstallPromptUse>(null);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return;
    setSupported(true);
    setPermission(Notification.permission);
    if (!publicKey || Notification.permission !== "granted") return;

    let cancelled = false;
    void navigator.serviceWorker.getRegistration().then(async (registration) => {
      const subscription = await registration?.pushManager.getSubscription();
      if (!subscription || cancelled) return;
      const status = await pushRequest("status", { endpoint: subscription.endpoint });
      if (!cancelled) setConnected(Boolean(status?.subscribed));
    }).catch(() => {
      if (!cancelled) setMessage({ text: "기기의 알림 설정을 확인하지 못했어요.", error: true });
    });
    return () => { cancelled = true; };
  }, [publicKey]);

  async function change(action: "subscribe" | "unsubscribe" | "test") {
    setBusy(true);
    setMessage(null);
    try {
      if (action === "subscribe") {
        const granted = await Notification.requestPermission();
        setPermission(granted);
        if (granted !== "granted") return;
      }
      const registration = await registerAdminWorker();
      await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (action === "subscribe" && publicKey) {
        const applicationServerKey = keyBytes(publicKey);
        if (subscription) {
          const oldKey = new Uint8Array(subscription.options.applicationServerKey ?? []);
          if (oldKey.length !== applicationServerKey.length || oldKey.some((value, index) => value !== applicationServerKey[index])) {
            await subscription.unsubscribe();
            subscription = null;
          }
        }
        subscription ??= await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
        await pushRequest(action, { subscription: subscription.toJSON() });
        setConnected(true);
        setMessage({ text: "이 기기의 결제 알림을 켰어요." });
      } else if (action === "unsubscribe") {
        if (subscription) {
          await pushRequest(action, { endpoint: subscription.endpoint });
          await subscription.unsubscribe();
        }
        setConnected(false);
        setMessage({ text: "이 기기의 결제 알림을 껐어요." });
      } else if (action === "test" && subscription) {
        await pushRequest(action, { endpoint: subscription.endpoint });
        setMessage({ text: "테스트 알림을 보냈어요. 기기의 알림 센터를 확인해 주세요." });
      }
    } catch (error) {
      if (action === "test" && error instanceof Error && "status" in error && error.status === 410) setConnected(false);
      setMessage({ text: error instanceof Error && error.name === "Error" ? error.message : "기기와 연결하지 못했어요. 잠시 후 다시 시도해 주세요.", error: true });
    } finally {
      setBusy(false);
    }
  }

  const needsInstallation = ios && !installed;
  const canSubscribe = publicKey && supported && !needsInstallation && permission !== "denied";
  const status = permission === "denied" ? "권한 차단됨" : connected ? "켜짐" : "꺼짐";
  return <div className="admin-settings-grid">
    <section className="admin-panel admin-setting">
      <div className="admin-setting-icon"><Icon name="install_mobile" /></div>
      <div><h2>운영 앱 설치</h2><p>홈 화면에서 운명대로 운영을 바로 열 수 있어요.</p></div>
      {installed ? <span className="admin-badge" data-tone="positive">앱으로 열림</span> : prompt && prompt !== promptUsed ? (
        <button className="admin-button" type="button" onClick={async () => {
          setPromptUsed(prompt);
          try { await prompt.prompt(); await prompt.userChoice; } catch { /* The browser menu remains available. */ }
        }}>운영 앱 설치</button>
      ) : <p className="admin-setting-hint">{ios ? "Safari 공유 메뉴에서 ‘홈 화면에 추가’를 누른 뒤 아이콘으로 열어 주세요." : "브라우저 메뉴에서 ‘앱 설치’ 또는 ‘홈 화면에 추가’를 선택해 주세요."}</p>}
    </section>
    <section className="admin-panel admin-setting">
      <div className="admin-setting-icon"><Icon name="notifications_active" /></div>
      <div><h2>새 결제 알림</h2><p>결제가 완료되면 상품명과 금액을 알려 드려요. 알림을 누르면 해당 주문을 열 수 있어요.</p></div>
      <span className="admin-badge" data-tone={connected ? "positive" : "muted"}>{status}</span>
      {!publicKey && <p className="admin-setting-hint">서버의 결제 알림 설정을 마친 뒤 이 기기에서 알림을 켤 수 있어요.</p>}
      {publicKey && needsInstallation && <p className="admin-setting-hint">홈 화면에 추가한 운영 앱에서 알림을 켜 주세요.</p>}
      {publicKey && !needsInstallation && !supported && <p className="admin-setting-hint">이 브라우저에서는 결제 알림을 받을 수 없어요.</p>}
      {permission === "denied" && <p className="admin-setting-hint">브라우저 또는 기기 설정에서 운명대로의 알림을 허용해 주세요.</p>}
      {canSubscribe && !connected && <button className="admin-button admin-button-primary" type="button" disabled={busy} onClick={() => void change("subscribe")}>이 기기에서 알림 켜기</button>}
      {connected && <div className="admin-actions">
        {permission === "granted" && <button className="admin-button admin-button-primary" type="button" disabled={busy} onClick={() => void change("test")}>테스트 알림 보내기</button>}
        <button className="admin-button" type="button" disabled={busy} onClick={() => void change("unsubscribe")}>이 기기 알림 끄기</button>
      </div>}
      {message && <p role="status" className="admin-setting-hint" data-tone={message.error ? "negative" : "positive"}>{message.text}</p>}
    </section>
  </div>;
}

type InstallPromptUse = ReturnType<typeof useAdminApp>["prompt"];
