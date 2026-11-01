import { notFound } from "next/navigation";
import { ReadingWebtoon } from "@/components/manse/ReadingWebtoon";
import { ManseSheet } from "@/components/manse/ManseSheet";
import { getPoster } from "@/components/home/posters";
import { buildManseTopics } from "@/lib/manse";
import { buildPreviewContext, buildFallbackPreview } from "@/lib/manse/preview";
import { loadPreviewReading } from "@/lib/manse/preview-ai";
import { buildReadingTeaser } from "@/lib/manse/teaser";
import { getReport } from "@/lib/reports/catalog";
import { getGuide } from "@/lib/story/guides";
import { parseFourPillars, parseElementCounts } from "@/lib/saju/modules";

export const dynamic = "force-dynamic";

export default async function MansePreview({ searchParams }: { searchParams: { ai?: string; minor?: string } }) {
  if (process.env.NODE_ENV === "production") notFound();
  const product = getReport("destiny-full")!;
  const profile = { name: "이서연", birthYear: searchParams.minor === "1" ? 2012 : 1995, birthMonth: 5, birthDay: 19,
    birthHour: 12, birthMinute: 30, isFemale: true, isLunar: false, birthCity: "서울" };
  const modules = buildManseTopics([], profile, null).manse!.modules;
  const context = buildPreviewContext(modules, profile, product);
  const narrative = searchParams.ai === "1" ? await loadPreviewReading(context) : buildFallbackPreview(context);
  return <div className="py-space-md">
    <ReadingWebtoon teaser={buildReadingTeaser(modules, profile.name)} name={profile.name}
      productTitle={product.title} guide={getGuide(product.guide)} poster={getPoster(product.slug, product.guide)}
      narrative={narrative} context={context} chapters={product.chapters}
      chart={<ManseSheet name={profile.name} birthLine="가상 고객 · 화면 검토용" pillars={parseFourPillars(modules)}
        counts={parseElementCounts(modules)} facts={[]} basis={[]} decade={null} />} />
  </div>;
}
