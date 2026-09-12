import type { Metadata } from "next";
import { SearchCatalog } from "@/components/home/SearchCatalog";

export const metadata: Metadata = { title: "검색" };

export default function SearchPage() {
  return <SearchCatalog />;
}
