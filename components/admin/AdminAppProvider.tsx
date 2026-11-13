"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface InstallPrompt extends Event {
  prompt(): Promise<unknown>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const AdminApp = createContext<{ installed: boolean; ios: boolean; prompt: InstallPrompt | null }>({
  installed: false, ios: false, prompt: null,
});

export const useAdminApp = () => useContext(AdminApp);

export function registerAdminWorker() {
  return navigator.serviceWorker.register("/admin/push-sw.js", { scope: "/admin", updateViaCache: "none" });
}

export function AdminAppProvider({ children }: { children: ReactNode }) {
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);

  useEffect(() => {
    const standalone = navigator as Navigator & { standalone?: boolean };
    setInstalled(window.matchMedia("(display-mode: standalone)").matches || Boolean(standalone.standalone));
    setIos(/iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
    const ready = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    const complete = () => {
      setInstalled(true);
      setPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", ready);
    window.addEventListener("appinstalled", complete);
    if ("serviceWorker" in navigator) {
      void registerAdminWorker().catch(() => undefined);
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", ready);
      window.removeEventListener("appinstalled", complete);
    };
  }, []);

  return <AdminApp.Provider value={{ installed, ios, prompt }}>{children}</AdminApp.Provider>;
}
