import { CategoryTabs } from "@/components/home/CategoryTabs";
import { FaqSection } from "@/components/home/FaqSection";
import { FreeInsightSection } from "@/components/home/FreeInsightSection";
import { GuideShelf } from "@/components/home/GuideShelf";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { HowItWorks } from "@/components/home/HowItWorks";
import { MostReadSection } from "@/components/home/MostReadSection";
import { CategoryRails } from "@/components/home/CategoryRails";
import { QuickNeeds } from "@/components/home/QuickNeeds";
import { TrustBanner } from "@/components/home/TrustBanner";
import { loadReports } from "@/lib/reports/store";

export const dynamic = "force-dynamic";

/**
 * 첫 화면.
 *
 * 포스터 한 장과 상품 목록만 두었을 때는 화면이 비어 보였다. 밀면 끝이 보이고, 끝까지
 * 밀어도 우리가 누구인지·무엇을 어떻게 주는지는 나오지 않았다.
 *
 * 그래서 보여 주는 자리(포스터·대표 풀이·주제별 줄)와 고르는 자리(고민 바로가기),
 * 그리고 결제 직전에 궁금한 자리(안내자·받는 과정·자주 묻는 것)를 모두 한 장에 올린다.
 * 없는 숫자를 지어내 채우지는 않는다 — 채우는 것은 상품과 사실이다.
 *
 * 모든 묶음은 옆으로 미는 줄이다. 세로로 길게 쌓인 목록은 한 번 내려가면 끝이 보여서,
 * 열일곱 개를 다 지나야 다음 이야기가 나왔다. 줄로 바꾸면 세로로는 주제만 훑고 관심
 * 있는 줄에서만 옆으로 민다.
 */
export default async function HomePage() {
  // 운영 화면에서 만든 상품까지 합쳐 내려 준다
  const products = await loadReports("report");

  return (
    <div className="flex w-full flex-col pb-8">
      <CategoryTabs />
      <HeroCarousel products={products} />
      {/* 자기 고민을 손으로 짚고 바로 그 줄로 내려가는 길 */}
      <QuickNeeds />
      <MostReadSection products={products} />
      {/* 주제별 가로 줄 — 세로로는 주제만 훑고, 관심 있는 줄에서만 옆으로 민다 */}
      <section className="mt-space-xl">
        <CategoryRails products={products} />
      </section>
      <GuideShelf products={products} />
      <HowItWorks />
      <FreeInsightSection />
      <FaqSection />
      <TrustBanner />
    </div>
  );
}
