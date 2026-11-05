import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StoryFunnel } from "@/components/story/StoryFunnel";
import { isAdmin } from "@/lib/admin/access";
import { getCurrentUser } from "@/lib/auth/session";
import { getRepository } from "@/lib/db";
import { loadReport, loadReports } from "@/lib/reports/store";
import { productThemeStyle } from "@/lib/reports/accents";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const report = await loadReport(params.slug);
  return report ? { title: report.title, description: report.description } : {};
}

export default async function ReportStoryPage({ params, searchParams }: { params: { slug: string }; searchParams: { reading?: string } }) {
  const requested = await loadReport(params.slug);
  const report = requested?.bundle ? await loadReport(requested.bundle.baseSlug) : requested;
  if (!report || report.kind !== "report") notFound();

  // 이미 산 사람을 결과 화면으로 돌려보내고 있었다. 그러면 다시 사려는 사람은 상세
  // 화면에 들어오지도 못한다 — 막던 자리 중 마지막 하나였다.
  //
  // 대신 가지고 있다는 것을 알려 주고 바로 읽을 수 있는 길을 위에 둔다. 다시 보러 온
  // 사람은 한 번 누르면 되고, 다시 사러 온 사람은 그대로 내려가면 된다.
  const user = await getCurrentUser();
  const candidate = user && searchParams.reading ? await getRepository().getReading(searchParams.reading) : null;
  const initialReading = candidate && candidate.userId === user?.id && (candidate.reportSlug === report.slug || (await loadReport(candidate.reportSlug))?.bundle?.baseSlug === report.slug) ? candidate : null;
  const owned = Boolean(user && (await getRepository().getPurchase(user.id, report.slug)));

  const products = await loadReports("report");
  const related = [...products.filter(item => item.category === report.category), ...products.filter(item => item.category !== report.category)];
  return <div className="product-theme w-full" style={productThemeStyle(report.slug)}><StoryFunnel key={report.slug} report={report} related={related} owned={owned} customerName={user?.displayName} initialReading={initialReading} freeIssue={isAdmin(user)} /></div>;
}
