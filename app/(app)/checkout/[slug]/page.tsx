import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
/** 기존 북마크도 상세페이지의 구매창으로 연결한다. 결제 완료 콜백 경로는 별도 유지한다. */
export default function CheckoutPage({ params, searchParams }: { params: { slug: string }; searchParams: { reading?: string } }) {
  redirect(`/reports/${encodeURIComponent(params.slug)}${searchParams.reading ? `?reading=${encodeURIComponent(searchParams.reading)}` : ""}`);
}
