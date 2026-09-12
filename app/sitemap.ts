import type { MetadataRoute } from "next";
import { listReports } from "@/lib/reports/catalog";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://unmyeongdaero.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["/", "/consult", "/search", "/free/today", "/free/dohwa", "/free/mbti", "/terms", "/privacy", "/refund"];
  return [...paths, ...listReports("report").map((report) => `/reports/${report.slug}`)].map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: "weekly",
  }));
}
