import type { Metadata } from "next";
import { notFound } from "next/navigation";
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

  // 이미 산 사람을 결과 화면으로 돌려보내고 있었다. 그러면 다시 사려는 사람은 상세
  // 화면에 들어오지도 못한다 — 막던 자리 중 마지막 하나였다.
  //
  // 대신 가지고 있다는 것을 알려 주고 바로 읽을 수 있는 길을 위에 둔다. 다시 보러 온
  // 사람은 한 번 누르면 되고, 다시 사러 온 사람은 그대로 내려가면 된다.
  const user = await getCurrentUser();
  const owned = Boolean(user && (await getRepository().getPurchase(user.id, report.slug)));

  // 상세 화면 아래의 "이것도 함께 봐요". 같은 고민을 먼저 세우고, 모자라면 다른 주제로 채운다 —
  // 재회를 보던 사람에게 건강사주를 먼저 들이밀지 않는다.
  const products = await loadReports("report");
  const related = [
    ...products.filter((item) => item.category === report.category),
    ...products.filter((item) => item.category !== report.category),
  ];

  return <StoryFunnel report={report} related={related} owned={owned} />;
}
