import { CategoryTabs } from "@/components/home/CategoryTabs";
import { FaqSection } from "@/components/home/FaqSection";
import { FreeInsightSection } from "@/components/home/FreeInsightSection";
import { GuideShelf } from "@/components/home/GuideShelf";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { MostReadSection } from "@/components/home/MostReadSection";
import { MyChart } from "@/components/home/MyChart";
import { CategoryRails } from "@/components/home/CategoryRails";
import { QuickNeeds } from "@/components/home/QuickNeeds";
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
 * 순서는 상품이 먼저다. 설명과 약속과 자주 묻는 것을 위에 두면, 들어온 사람이 처음
 * 만나는 것이 "우리가 어떤 회사인가"가 된다. 그건 사고 나서 궁금해지는 것이지
 * 들어오자마자 궁금한 것이 아니다. 궁금한 것은 "내 것이 뭐가 나오나"다.
 *
 * 「결제 전에 어디까지 보이나요」와 「3가지 결제 약속」은 아예 뺐다. 아래로 내려도
 * 내려도 설명이 이어지면 첫 화면이 안내문이 된다. 둘 다 결제 화면과 약관·환불규정에
 * 그대로 적혀 있다 — 정작 읽어야 할 자리에서 읽히면 된다.
 *
 * 주제별 묶음은 세로로 쌓는다. 한동안 전부 옆으로 미는 줄이었는데, 상품이 한 번씩만
 * 나오도록 정리하고 나니 한 장짜리 묶음이 생겼다. 밀 것이 없는데 미는 줄로 만들 이유가
 * 없다. 맨 위 대표 풀이 한 줄만 옆으로 민다.
 */
export default async function HomePage() {
  // 운영 화면에서 만든 상품까지 합쳐 내려 준다
  const products = await loadReports("report");

  return (
    <div className="flex w-full flex-col pb-8">
      <CategoryTabs />
      <HeroCarousel products={products} />
      {/* 생일을 적은 적이 있으면 목록 대신 자기 원국부터 펼친다 */}
      <MyChart />
      <MostReadSection products={products} />
      {/* 주제별 가로 줄 — 세로로는 주제만 훑고, 관심 있는 줄에서만 옆으로 민다 */}
      <section className="mt-space-xl">
        <CategoryRails products={products} />
      </section>
      {/* 자기 고민을 손으로 짚고 바로 그 줄로 내려가는 길 */}
      <QuickNeeds />
      <GuideShelf products={products} />
      <FreeInsightSection />
      <FaqSection />
    </div>
  );
}
