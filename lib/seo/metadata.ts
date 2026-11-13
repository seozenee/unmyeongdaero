import type { Metadata } from "next";
import { env } from "@/lib/env";

export const SITE_NAME = "운명대로";
export const SITE_TITLE = "운명대로 | 나를 이해하는 사주 리포트";
export const SITE_DESCRIPTION = "타고난 성향부터 연애, 일, 재물의 흐름까지. 지금의 고민을 나만의 사주 리포트로 풀어보세요.";

/** Each public page declares its own canonical; never inherit the home URL globally. */
export function publicPageMetadata(title: string, description: string, pathname: string): Metadata {
  const url = new URL(pathname, env.siteUrl).toString();
  const image = new URL("/opengraph-image?v=20261111", env.siteUrl).toString();
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", locale: "ko_KR", siteName: SITE_NAME, title, description, url, images: [{ url: image, width: 1200, height: 630, alt: SITE_TITLE }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export function websiteSchema() {
  return { "@context": "https://schema.org", "@type": "WebSite", name: SITE_NAME, url: new URL("/", env.siteUrl).toString(), inLanguage: "ko-KR", description: SITE_DESCRIPTION };
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
