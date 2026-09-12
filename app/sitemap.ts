import type { MetadataRoute } from "next";
import { listReports } from "@/lib/reports/catalog";
import { env } from "@/lib/env";

const siteUrl = env.siteUrl;

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["/", "/consult", "/search", "/free/today", "/free/dohwa", "/free/mbti", "/terms", "/privacy", "/refund"];
  return [...paths, ...listReports("report").map((report) => `/reports/${report.slug}`)].map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: "weekly",
  }));
}
