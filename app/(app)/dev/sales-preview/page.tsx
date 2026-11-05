import { notFound } from "next/navigation";
import { ReadingWebtoon } from "@/components/manse/ReadingWebtoon";
import { ChartBoard } from "@/components/saju/ChartBoard";
import { getPoster } from "@/components/home/posters";
import { buildManseTopics } from "@/lib/manse";
import { buildHomeChart } from "@/lib/manse/home-chart";
import { buildInstantPreview, buildPreviewContext } from "@/lib/manse/preview";
import { buildReadingTeaser } from "@/lib/manse/teaser";
import { productAccent, productThemeStyle } from "@/lib/reports/accents";
import { getReport } from "@/lib/reports/catalog";
import { mergedModules } from "@/lib/sazu/readings";
import { getGuide } from "@/lib/story/guides";
import type { BirthProfile } from "@/lib/db";

/*
  개발 환경 전용: 결제 전 구입 유도 화면을 상품별로 확인한다.

  이 화면은 실제로는 생일을 입력하고 풀이를 만든 뒤에야 나온다. 그래서 문구 하나를
  고칠 때마다 로그인하고 깔때기를 끝까지 걸어야 했다 — 열여덟 상품을 돌려보는 건
  사실상 불가능했다. 같은 계산으로 같은 화면을 여기서 바로 띄운다.

  ?slug=... 로 상품을, ?child=1 로 자녀 명식을 본다.
*/
export const dynamic = "force-dynamic";

const ADULT: BirthProfile = {
  name: "서하", birthYear: 1998, birthMonth: 5, birthDay: 19, birthHour: 9, birthMinute: 30,
  isFemale: true, isLunar: false, birthCity: "서울",
};
const CHILD: BirthProfile = { ...ADULT, name: "하린", birthYear: 2015, birthMonth: 6, birthDay: 26, birthHour: 16, birthMinute: 10 };

export default function SalesPreviewPage({ searchParams }: { searchParams: { slug?: string; child?: string } }) {
  if (process.env.NODE_ENV === "production") notFound();

  const report = getReport(searchParams.slug ?? "destiny-full");
  if (!report || report.kind !== "report") notFound();

  const subject = report.roles?.subject === "child" || searchParams.child === "1" ? CHILD : ADULT;
  const partner = report.partner === "none" ? null
    : { ...(report.roles?.partner === "child" ? CHILD : ADULT), name: report.roles?.partner === "child" ? "하린" : "도윤", isFemale: false };
  const now = new Date();
  const sazu = buildManseTopics(Array.from(new Set(["today" as const, ...report.topics])), subject, partner, now);
  const modules = mergedModules(sazu);
  const context = buildPreviewContext(modules, subject, report, now, "", {}, partner);

  return (
    <div className="product-theme w-full" style={productThemeStyle(report.slug)}>
      <p className="mb-3 text-xs text-on-surface-variant">가상 인물로 만든 구입 유도 화면 미리보기예요. (?slug={report.slug})</p>
      <ReadingWebtoon
        name={subject.name}
        guide={getGuide(report.guide)}
        poster={getPoster(report.slug, report.guide)}
        context={context}
        narrative={buildInstantPreview(context)}
        teaser={buildReadingTeaser(modules, subject.name)}
        chapters={report.chapters}
        productTitle={report.title}
        chart={<ChartBoard chart={buildHomeChart(sazu, subject.name)} />}
        purchaseHref={`/reports/${report.slug}`}
      />
      <p className="sr-only">{productAccent(report.slug)}</p>
    </div>
  );
}
