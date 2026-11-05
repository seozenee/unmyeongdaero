import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getRepository } from "@/lib/db";
import { jsonError, toErrorResponse } from "@/lib/errors";
import { getReport } from "@/lib/reports/catalog";
import { buildManseTopics } from "@/lib/manse";
import { mergedModules } from "@/lib/sazu/readings";
import { buildReadingTeaser } from "@/lib/manse/teaser";
import { buildInstantPreview, buildPreviewContext } from "@/lib/manse/preview";
import { buildHomeChart } from "@/lib/manse/home-chart";

export const dynamic = "force-dynamic";
export async function GET(_request:Request,{params}:{params:{id:string}}) {
  const user=await getCurrentUser();
  if(!user) return jsonError(401,"LOGIN_REQUIRED","로그인이 필요해요.");
  try {
    const reading=await getRepository().getReading(params.id);
    if(!reading || reading.userId!==user.id) return jsonError(404,"NOT_FOUND","입력 정보를 찾을 수 없어요.");
    const selected=getReport(reading.reportSlug);
    const report=selected?.bundle ? getReport(selected.bundle.baseSlug) : selected;
    if(!report) return jsonError(404,"NOT_FOUND","상품을 찾을 수 없어요.");
    const now=new Date();
    const sazu=buildManseTopics(Array.from(new Set(["today" as const,...report.topics])),reading.subject,reading.partner,now);
    const modules=mergedModules(sazu);
    const context=buildPreviewContext(modules,reading.subject,report,now,reading.answers.detail??"",reading.answers,reading.partner);
    return NextResponse.json({context,narrative:buildInstantPreview(context),teaser:buildReadingTeaser(modules,reading.subject.name),chart:buildHomeChart(sazu,reading.subject.name)},{headers:{"Cache-Control":"private, no-store"}});
  } catch(error) {return toErrorResponse(error);}
}
