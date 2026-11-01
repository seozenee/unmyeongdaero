import { notFound } from "next/navigation";
import { ReadingWebtoon } from "@/components/manse/ReadingWebtoon";
import { StoryFunnel } from "@/components/story/StoryFunnel";
import { ManseSheet } from "@/components/manse/ManseSheet";
import { ManseConfirm } from "@/components/manse/ManseConfirm";
import { getPoster } from "@/components/home/posters";
import { buildManseTopics } from "@/lib/manse";
import { buildPreviewContext, buildInstantPreview } from "@/lib/manse/preview";
import { buildReadingTeaser } from "@/lib/manse/teaser";
import { getReport } from "@/lib/reports/catalog";
import { getGuide } from "@/lib/story/guides";
import { parseFourPillars, parseElementCounts } from "@/lib/saju/modules";

export const dynamic = "force-dynamic";

export default async function MansePreview({ searchParams }: { searchParams: { slug?: string; minor?: string; form?: string } }) {
  if (process.env.NODE_ENV === "production") notFound();
  const product = getReport(searchParams.slug ?? "destiny-full") ?? getReport("destiny-full")!;
  if (searchParams.form === "1") return <StoryFunnel report={product} rememberProfile={false} />;
  const profile = { name: "이서연", birthYear: searchParams.minor === "1" ? 2012 : 1995, birthMonth: 5, birthDay: 19,
    birthHour: 12, birthMinute: 30, isFemale: true, isLunar: false, birthCity: "서울" };
  const modules = buildManseTopics([], profile, null).manse!.modules;
  const answers: Record<string, string> = searchParams.minor === "1" ? { learningStage: "middle", detail: "지금 하는 공부 방법이 맞는지 궁금해요." }
    : { relationshipStatus: "solo", occupation: "employee", detail: "직장을 옮길지, 지금 맡은 일을 더 해 볼지 고민이에요." };
  const context = buildPreviewContext(modules, profile, product, new Date(), answers.detail ?? "", answers);
  return <div className="py-space-md">
    <ReadingWebtoon teaser={buildReadingTeaser(modules, profile.name)} name={profile.name}
      purchaseHref={`/checkout/${product.slug}?reading=sample-reading`}
      productTitle={product.title} guide={getGuide(product.guide)} poster={getPoster(product.slug, product.guide)}
      narrative={buildInstantPreview(context)} context={context} chapters={product.chapters}
      chart={<ManseSheet name={profile.name} birthLine="가상 고객 · 화면 검토용" pillars={parseFourPillars(modules)}
        counts={parseElementCounts(modules)} facts={[]} basis={[]} decade={null} />} />
    <ManseConfirm revealAfterId="reading-first-reveal" readingId="sample-reading" slug={product.slug} title={product.title}
      categoryLabel={product.categoryLabel} price={product.price} originalPrice={product.originalPrice ?? null}
      />
  </div>;
}
