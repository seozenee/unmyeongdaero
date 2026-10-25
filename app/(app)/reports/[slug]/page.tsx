import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { StoryFunnel } from "@/components/story/StoryFunnel";
import { getCurrentUser } from "@/lib/auth/session";
import { getRepository } from "@/lib/db";
import { loadReport, loadReports } from "@/lib/reports/store";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const report = await loadReport(params.slug);
  return report ? { title: report.title, description: report.description } : {};
}

export default async function ReportStoryPage({ params }: { params: { slug: string } }) {
  const report = await loadReport(params.slug);
  if (!report || report.kind !== "report") notFound();

  const user = await getCurrentUser();
  if (user && (await getRepository().getPurchase(user.id, report.slug))) {
    redirect(`/reports/${report.slug}/read`);
  }

  // 상세 화면 아래의 "이것도 함께 봐요". 같은 고민을 먼저 세우고, 모자라면 다른 주제로 채운다 —
  // 재회를 보던 사람에게 건강사주를 먼저 들이밀지 않는다.
  const products = await loadReports("report");
  const related = [
    ...products.filter((item) => item.category === report.category),
    ...products.filter((item) => item.category !== report.category),
  ];

  return <StoryFunnel report={report} related={related} />;
}
