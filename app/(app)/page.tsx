import { CategoryTabs } from "@/components/home/CategoryTabs";
import { FreeInsightSection } from "@/components/home/FreeInsightSection";
import { HighlightCard } from "@/components/home/HighlightCard";
import { MostReadSection } from "@/components/home/MostReadSection";
import { NeedsShelf } from "@/components/home/NeedsShelf";
import { TrustBanner } from "@/components/home/TrustBanner";
import { loadReports } from "@/lib/reports/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // 운영 화면에서 만든 상품까지 합쳐 내려 준다
  const products = await loadReports("report");

  return (
    <div className="flex w-full flex-col pb-8">
      <CategoryTabs />
      <HighlightCard />
      <MostReadSection />
      <NeedsShelf products={products} />
      <FreeInsightSection />
      <TrustBanner />
    </div>
  );
}
