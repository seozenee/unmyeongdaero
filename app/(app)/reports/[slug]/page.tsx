import { publicPageMetadata } from "@/lib/seo/metadata";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { StoryFunnel } from "@/components/story/StoryFunnel";
import { isAdmin } from "@/lib/admin/access";
import { getCurrentUser, loginUrl } from "@/lib/auth/session";
import { getRepository } from "@/lib/db";
import { loadReport, loadReports } from "@/lib/reports/store";
import { productThemeStyle } from "@/lib/reports/accents";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params: paramsPromise }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await paramsPromise;
  const requested = await loadReport(params.slug);
  const report = requested?.bundle ? await loadReport(requested.bundle.baseSlug) : requested;
  if (!report || report.kind !== "report") notFound();
  return publicPageMetadata(`${report.title} | 운명대로`, report.description, `/reports/${encodeURIComponent(report.slug)}`);
}

export default async function ReportStoryPage({ params: paramsPromise, searchParams: searchParamsPromise }: { params: Promise<{ slug: string }>; searchParams: Promise<{ reading?: string; resume?: string }> }) {
  const params = await paramsPromise;
  const searchParams = await searchParamsPromise;
  const requested = await loadReport(params.slug);
  const report = requested?.bundle ? await loadReport(requested.bundle.baseSlug) : requested;
  if (!report || report.kind !== "report") notFound();

  // 이미 산 사람을 결과 화면으로 돌려보내고 있었다. 그러면 다시 사려는 사람은 상세
  // 화면에 들어오지도 못한다 — 막던 자리 중 마지막 하나였다.
  //
  // 대신 가지고 있다는 것을 알려 주고 바로 읽을 수 있는 길을 위에 둔다. 다시 보러 온
  // 사람은 한 번 누르면 되고, 다시 사러 온 사람은 그대로 내려가면 된다.
  const user = await getCurrentUser();
  const readingId = typeof searchParams.reading === "string" ? searchParams.reading : undefined;
  const resumeToken = typeof searchParams.resume === "string" ? searchParams.resume : undefined;
  if (!user && (readingId || resumeToken)) {
    const query = new URLSearchParams(readingId ? { reading: readingId } : { resume: resumeToken ?? "" });
    redirect(loginUrl(`/reports/${report.slug}?${query}`));
  }
  const candidate = user && readingId ? await getRepository().getReading(readingId) : null;
  const initialReading = candidate && candidate.userId === user?.id && (candidate.reportSlug === report.slug || (await loadReport(candidate.reportSlug))?.bundle?.baseSlug === report.slug) ? candidate : null;
  const owned = Boolean(user && (await getRepository().getPurchase(user.id, report.slug)));

  const products = await loadReports("report");
  const related = [...products.filter(item => item.category === report.category), ...products.filter(item => item.category !== report.category)];
  return <div className="product-theme w-full" style={productThemeStyle(report.slug)}>
    <StoryFunnel key={initialReading?.id ?? report.slug} report={report} related={related} owned={owned}
      customerName={user?.displayName} initialReading={initialReading} signedIn={Boolean(user)}
      resumeToken={resumeToken} freeIssue={isAdmin(user)} />
  </div>;
}
