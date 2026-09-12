"use client";

import Link from "next/link";
import { useState } from "react";
import { FiveElementsRadar } from "@/components/saju/FiveElementsRadar";
import { FourPillarsChart } from "@/components/saju/FourPillarsChart";
import { BirthForm } from "@/components/story/BirthForm";
import { GuideAvatar } from "@/components/story/GuideAvatar";
import { Icon } from "@/components/ui/Icon";
import type { BirthProfile } from "@/lib/db/types";
import type { ElementCounts, FourPillarsInput } from "@/lib/saju/modules";
import { getGuide } from "@/lib/story/guides";

interface FreeInsightResult {
  title: string;
  headline: string;
  highlights: Array<{ label: string; text: string }>;
  pillars: FourPillarsInput | null;
  counts: ElementCounts | null;
  sample: boolean;
}

const UPSELL: Record<string, { href: string; label: string }> = {
  today: { href: "/reports/yearly", label: "한 해 전체 흐름이 궁금하다면 · 신년운세 보고서" },
  dohwa: { href: "/reports/love", label: "이 매력이 닿을 인연이 궁금하다면 · 연애 사주 보고서" },
  mbti: { href: "/reports/life", label: "타고난 그릇을 깊이 보고 싶다면 · 평생 사주 보고서" },
};

export function FreeInsightFlow({ kind, title, description, sandbox }: { kind: string; title: string; description: string; sandbox: boolean }) {
  const guide = getGuide("seoha");
  const [result, setResult] = useState<FreeInsightResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (profile: BirthProfile) => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/free/${kind}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(profile),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error?.message ?? "잠시 문제가 생겼어요.");
        return;
      }
      setResult(body);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("네트워크가 불안정해요. 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-space-md py-space-md">
      <header className="flex items-center gap-space-sm">
        <GuideAvatar guide={guide} size="md" />
        <div className="flex flex-col">
          <span className="font-label-sm text-label-sm text-secondary">FREE INSIGHT · 100% 무료</span>
          <h1 className="font-headline-md text-headline-md text-on-surface">{title}</h1>
        </div>
      </header>

      {!result ? (
        <>
          <p className="font-body-md text-body-md text-on-surface-variant">{description}</p>
          {error && <p className="rounded-lg bg-error-container/30 p-space-sm font-body-sm text-body-sm text-on-surface">{error}</p>}
          <BirthForm title="나의 정보" submitLabel={busy ? "명식을 펼치고 있어요…" : "무료로 보기"} sandbox={sandbox} onSubmit={submit} />
        </>
      ) : (
        <>
          {result.sample && (
            <p className="rounded-lg bg-tertiary/10 p-space-sm font-label-sm text-label-sm text-tertiary">체험용 분석 키의 고정 샘플 명식 결과예요.</p>
          )}
          <section className="flex flex-col gap-space-sm rounded-xl bg-surface-container-low p-space-lg motion-safe:animate-fade-up">
            <Icon name="format_quote" filled className="text-[28px] text-tertiary" />
            <p className="font-headline-md text-headline-md text-on-surface">{result.headline}</p>
          </section>
          {result.highlights.map((item) => (
            <article key={item.label} className="flex flex-col gap-1 rounded-xl bg-surface-container p-space-lg motion-safe:animate-fade-up">
              <span className="font-label-md text-label-md text-primary">{item.label}</span>
              <p className="font-body-md text-body-md leading-relaxed text-on-surface">{item.text}</p>
            </article>
          ))}
          {result.pillars && <FourPillarsChart pillars={result.pillars} />}
          {result.counts && <FiveElementsRadar counts={result.counts} />}
          <Link
            href={UPSELL[kind]?.href ?? "/"}
            className="flex items-center justify-between rounded-xl bg-gradient-to-r from-secondary-container to-secondary p-space-md font-label-md text-label-md text-on-secondary"
          >
            {UPSELL[kind]?.label ?? "전체 풀이 보러 가기"} <Icon name="arrow_forward" className="text-[18px]" />
          </Link>
          <button type="button" onClick={() => setResult(null)} className="font-label-md text-label-md text-outline underline">
            다른 명식으로 다시 보기
          </button>
          <p className="text-center font-label-sm text-label-sm text-outline">참고용 콘텐츠입니다.</p>
        </>
      )}
    </div>
  );
}
