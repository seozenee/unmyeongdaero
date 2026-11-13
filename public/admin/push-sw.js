self.addEventListener("install", (event) => event.waitUntil(self.skipWaiting()));
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

function adminUrl(path) {
  const url = new URL(path || "/admin/payments", self.location.origin);
  return url.origin === self.location.origin && /^\/admin(?:\/|$)/.test(url.pathname)
    ? url.href
    : new URL("/admin/payments", self.location.origin).href;
}

self.addEventListener("push", (event) => {
  let message;
  try {
    message = event.data?.json();
  } catch {
    return;
  }
  if (!message?.title) return;
  event.waitUntil(self.registration.showNotification(message.title, {
    body: message.body,
    tag: message.tag,
    icon: "/admin/icon-192.png",
    data: { url: adminUrl(message.url) },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = adminUrl(event.notification.data?.url);
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const alreadyOpen = clients.find((client) => client.url === target);
    if (alreadyOpen) return alreadyOpen.focus();
    const admin = clients.find((client) => {
      const url = new URL(client.url);
      return url.origin === self.location.origin && /^\/admin(?:\/|$)/.test(url.pathname);
    });
    if (admin) {
      const navigated = await admin.navigate(target);
      if (navigated) return navigated.focus();
    }
    return self.clients.openWindow(target);
  })());
});
