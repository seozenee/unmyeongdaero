import type { MetadataRoute } from "next";
import { loadReports } from "@/lib/reports/store";
import { env } from "@/lib/env";

// Use the same published catalog as the storefront, including newly added products.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await loadReports("report");
  const paths = ["/", "/search", "/consult", "/free/today", "/free/dohwa", "/free/mbti", "/terms", "/privacy", "/refund",
    ...products.map((report) => `/reports/${encodeURIComponent(report.slug)}`)];
  return [...new Set(paths)].map((path) => ({ url: new URL(path, env.siteUrl).toString() }));
}
