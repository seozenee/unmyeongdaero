/** Cookie-authenticated mutations must come from the same origin, including login forms. */
export function isTrustedMutation(request: Request): boolean {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return true;
  const url = new URL(request.url);
  // Server-to-server notification: the handler independently verifies the payment with Toss.
  if (url.pathname === "/api/payments/webhook") return true;
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  // Next may normalize request.url to localhost behind its HTTP server.
  // Host is the browser request destination; do not trust X-Forwarded-Host.
  const expectedOrigin = `${url.protocol}//${request.headers.get("host") ?? url.host}`;
  const origin = request.headers.get("origin");
  if (origin) return origin === expectedOrigin;
  const referer = request.headers.get("referer");
  if (referer) {
    try { return new URL(referer).origin === expectedOrigin; } catch { return false; }
  }
  return false;
}

export function isPrivatePath(pathname: string): boolean {
  return /^\/(api|auth|admin|checkout|library|login|readings|r|v|dev)(\/|$)/.test(pathname)
    || /^\/consult\//.test(pathname)
    || /^\/reports\/[^/]+\/read(?:\/|$)/.test(pathname);
}
