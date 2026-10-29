import { SearchCatalog } from "@/components/home/SearchCatalog";
import { loadReports } from "@/lib/reports/store";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "풀이 찾기 — 운명대로",
  description: "재회·궁합·이직·건강. 궁금한 말로 찾으면 그 자리로 데려다 줘요.",
};

/**
 * 찾는 자리.
 *
 * 홈은 주제별로 줄을 세워 구경하게 만든 화면이다. 그런데 "재회"를 찾아 온 사람에게
 * 아홉 줄을 밀어 보게 하는 것은 길을 알려 주는 게 아니라 미루는 것이다.
 *
 * 머리의 돋보기가 여기로 온다. 전에는 그 자리에 종 모양 버튼이 있었고 눌러도 아무 일도
 * 없었다.
 */
export default async function SearchPage() {
  const products = await loadReports();

  return (
    <div className="flex w-full flex-col gap-space-sm px-margin pb-24 pt-space-lg">
      <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">무엇이 궁금하세요?</h1>
      <SearchCatalog products={products} />
    </div>
  );
}
