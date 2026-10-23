import { CategoryTabs } from "@/components/home/CategoryTabs";
import { FreeInsightSection } from "@/components/home/FreeInsightSection";
import { HighlightCard } from "@/components/home/HighlightCard";
import { MostReadSection } from "@/components/home/MostReadSection";
import { NeedsShelf } from "@/components/home/NeedsShelf";
import { TrustBanner } from "@/components/home/TrustBanner";

export default function HomePage() {
  return (
    <div className="flex w-full flex-col pb-8">
      <CategoryTabs />
      <HighlightCard />
      <MostReadSection />
      <NeedsShelf />
      <FreeInsightSection />
      <TrustBanner />
    </div>
  );
}
