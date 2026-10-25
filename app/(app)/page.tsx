import { CategoryTabs } from "@/components/home/CategoryTabs";
import { FreeInsightSection } from "@/components/home/FreeInsightSection";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { MostReadSection } from "@/components/home/MostReadSection";
import { CategoryRails } from "@/components/home/CategoryRails";
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
      <HeroCarousel products={products} />
      <MostReadSection />
      {/* 주제별 가로 줄 — 세로로는 주제만 훑고, 관심 있는 줄에서만 옆으로 민다 */}
      <section className="mt-space-xl">
        <CategoryRails products={products} />
      </section>
      <NeedsShelf products={products} />
      <FreeInsightSection />
      <TrustBanner />
    </div>
  );
}
