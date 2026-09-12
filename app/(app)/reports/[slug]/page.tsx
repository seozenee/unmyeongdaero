import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { StoryFunnel } from "@/components/story/StoryFunnel";
import { getCurrentUser } from "@/lib/auth/session";
import { getRepository } from "@/lib/db";
import { isSazuSandbox } from "@/lib/env";
import { getReport } from "@/lib/reports/catalog";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const report = getReport(params.slug);
  return report ? { title: report.title, description: report.description } : {};
}

export default async function ReportStoryPage({ params }: { params: { slug: string } }) {
  const report = getReport(params.slug);
  if (!report || report.kind !== "report") notFound();

  const user = await getCurrentUser();
  if (user && (await getRepository().getPurchase(user.id, report.slug))) {
    redirect(`/reports/${report.slug}/read`);
  }

  return <StoryFunnel report={report} sandbox={isSazuSandbox()} />;
}
