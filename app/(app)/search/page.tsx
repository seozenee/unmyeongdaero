import type { Metadata } from "next";
import { SearchCatalog } from "@/components/home/SearchCatalog";
import { loadReports } from "@/lib/reports/store";

export const metadata: Metadata = { title: "검색" };
export const dynamic = "force-dynamic";

export default async function SearchPage() {
  // 운영 화면에서 만든 상품도 검색되게 서버에서 합쳐 내려 준다
  return <SearchCatalog products={await loadReports("report")} />;
}
