import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

const siteUrl = env.siteUrl;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/auth/", "/checkout", "/library", "/login", "/consult/", "/reports/*/read", "/dev/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
