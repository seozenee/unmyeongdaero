"use client";
import { useEffect, useState } from "react";
import { ReadingWebtoon } from "@/components/manse/ReadingWebtoon";
import { ChartBoard } from "@/components/saju/ChartBoard";
import { getGuide } from "@/lib/story/guides";
import { getPoster } from "@/components/home/posters";
import type { ReportProduct } from "@/lib/reports/catalog";
import type { PreviewContext, PreviewReading } from "@/lib/manse/preview";
import type { ReadingTeaser } from "@/lib/manse/teaser";
import type { HomeChart } from "@/lib/manse/home-chart";
type SalesData={context:PreviewContext;narrative:PreviewReading;teaser:ReadingTeaser;chart:HomeChart};
export function PersonalizedSales({readingId,report,onPurchase}:{readingId:string;report:ReportProduct;onPurchase:()=>void}) {
  const [data,setData]=useState<SalesData|null>(null);
  const [error,setError]=useState(false);
  const [retry,setRetry]=useState(0);
  useEffect(()=>{
    const controller=new AbortController(); setData(null);setError(false);
    void fetch(`/api/readings/${readingId}/sales`,{signal:controller.signal,cache:"no-store"})
      .then(async response=>{if(!response.ok) throw new Error(); return response.json();})
      .then(value=>{if(!controller.signal.aborted)setData(value);})
      .catch(()=>{if(!controller.signal.aborted)setError(true);});
    return ()=>controller.abort();
  },[readingId,retry]);
  if(!data)return <div className="py-20 text-center" role="status">{error ? <><p>사주를 불러오지 못했어요.</p><button onClick={()=>setRetry(value=>value+1)}>다시 불러오기</button></> : "입력하신 사주를 펼치고 있어요."}</div>;
  return <ReadingWebtoon name={data.context.name} guide={getGuide(report.guide)} poster={getPoster(report.slug,report.guide)}
    context={data.context} narrative={data.narrative} teaser={data.teaser} chapters={report.chapters} productTitle={report.title}
    chart={<ChartBoard chart={data.chart}/>} purchaseHref="#purchase-final" onPurchase={onPurchase}/>;
}
