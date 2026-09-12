import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FreeInsightFlow } from "@/components/free/FreeInsightFlow";
import { isSazuSandbox } from "@/lib/env";

const CONTENT: Record<string, { title: string; description: string }> = {
  today: { title: "오늘의 무료 운세 & 나의 만세력 명식", description: "내 생년월일시로 세운 여덟 글자 기운 표와, 오늘 일진이 내 사주에 어떻게 작용하는지 알려 드려요." },
  dohwa: { title: "도화살 테스트 : 내 타고난 매력의 결", description: "홍염살, 도화살, 화개살 중 내게 머문 기운과 배우자 자리의 결을 짚어 드려요." },
  mbti: { title: "사주로 보는 성격 유형", description: "음양오행과 신강약으로 읽어내는 내 본원 성향을, 재미로 보는 성향 유형으로 옮겨 드려요." },
};

export function generateMetadata({ params }: { params: { kind: string } }): Metadata {
  const content = CONTENT[params.kind];
  return content ? { title: content.title, description: content.description } : {};
}

export default function FreeInsightPage({ params }: { params: { kind: string } }) {
  const content = CONTENT[params.kind];
  if (!content) notFound();
  return <FreeInsightFlow kind={params.kind} title={content.title} description={content.description} sandbox={isSazuSandbox()} />;
}
