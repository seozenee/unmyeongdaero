"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "@/components/home/useInView";
import { getWebtoonAsset, type WebtoonAsset } from "@/components/webtoon/assets";
import { WebtoonMedia } from "@/components/webtoon/WebtoonMedia";
import { Icon } from "@/components/ui/Icon";
import type { GuideId } from "@/lib/story/guides";
import { cn } from "@/lib/cn";

/** 글은 처음부터 읽을 수 있다. 화면 안으로 들어오면 장식과 등장 효과만 한 번 재생한다. */
export function SalesReveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!ref.current || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) { setShown(true); observer.disconnect(); }
    }, { threshold: 0.12 });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className={cn("ds-reveal", shown && "ds-in", className)}>{children}</div>;
}

export function SalesScene({ guide, shot, fallback = "intro-5", asset, className = "" }: {
  guide: GuideId; shot: string; fallback?: string; asset?: WebtoonAsset | null; className?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const media = asset ?? getWebtoonAsset(guide, shot) ?? getWebtoonAsset(guide, fallback);
  if (!media) return null;
  return <div ref={ref} className={cn("ds-scene", className)} data-visible={inView}>
    <WebtoonMedia asset={media} active={inView} />
  </div>;
}

export function SalesSay({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <SalesReveal className={cn("ds-say", className)}><p>{children}</p></SalesReveal>;
}

const HANJA_NUMERALS = ["壹", "貳", "參", "肆", "伍", "陸"] as const;

/**
 * 장을 여는 자리.
 *
 * 전에는 ◆ 사이에 제목 한 줄이었다. 긴 화면에서는 어디까지 읽었는지가 보이지 않아,
 * 중간에 들어온 사람은 그냥 스크롤만 길다고 느낀다. 한자 숫자와 장 번호를 크게 세워
 * "지금 몇 번째 이야기인지"를 눈에 박아 둔다.
 */
export function SalesChapter({ title, index }: { title: string; index?: number }) {
  if (index === undefined) {
    return <SalesReveal className="ds-chapter"><span aria-hidden="true">◆</span><p>{title}</p><span aria-hidden="true">◆</span></SalesReveal>;
  }
  return <SalesReveal className="ds-chapter-big">
    <span className="ds-chapter-seal" aria-hidden="true">{HANJA_NUMERALS[index - 1] ?? index}</span>
    <small>CHAPTER {String(index).padStart(2, "0")}</small>
    <p>{title}</p>
  </SalesReveal>;
}

/** 다섯 칸으로만 보여 주는 세기. 액수나 점수가 아니다 — 눈금에 숫자를 쓰지 않는다. */
export function SalesGauge({ level, label, min, max }: { level: number; label: string; min: string; max: string }) {
  return <div className="ds-gauge">
    <div className="ds-gauge-bars" role="img" aria-label={`${label} (다섯 칸 중 ${level}칸)`}>
      {[1, 2, 3, 4, 5].map(step => <span key={step} data-on={step <= level} style={{ "--ds-delay": `${step * 90}ms` } as React.CSSProperties} />)}
    </div>
    <div className="ds-gauge-scale"><span>{min}</span><span>{max}</span></div>
    <b>{label}</b>
  </div>;
}

/** 운명대로가 실제로 주는 것. 지어낸 숫자나 남의 실적을 적지 않는다. */
export function SalesProof({ chapters, topics }: { chapters: number; topics: number }) {
  return <SalesReveal className="ds-proof">
    <div><b>{chapters}개</b><p>주제의 전체 풀이<span>목차 그대로, 빠짐없이 씁니다.</span></p></div>
    <div><b>근거</b><p>해석마다 읽은 자리를 함께<span>무슨 글자를 어떻게 읽었는지 밝힙니다.</span></p></div>
    <div><b>20해</b><p>지나온 10년과 앞으로 10년<span>해마다 재물·인연·일을 따로 적습니다.</span></p></div>
    <div><b>12개월</b><p>보관함에서 다시 읽기<span>PDF로 내려받아 소장할 수 있어요.</span></p></div>
    {topics > 0 && <div><b>{topics}가지</b><p>이 상품이 함께 읽는 영역<span>상품이 다루는 주제만 적습니다.</span></p></div>}
  </SalesReveal>;
}

/** 아직 쓰이지 않은 답을 임의의 실제 날짜나 액수로 채우지 않는다. */
export function SalesMosaic({ wide = false, label = "전체 풀이에서 공개" }: { wide?: boolean; label?: string }) {
  return <span className={cn("ds-mosaic", wide && "ds-mosaic-wide")} role="img" aria-label={label}><span aria-hidden="true">▧▨▥{wide ? "▧▨▥" : ""}</span></span>;
}

export function SalesCard({ seal, title, children, className = "" }: { seal: string; title: React.ReactNode; children: React.ReactNode; className?: string }) {
  return <SalesReveal className={cn("ds-card", className)}>
    <span className="ds-seal" aria-hidden="true">{seal}</span>
    <h3>{title}</h3>
    <div className="ds-card-body">{children}</div>
  </SalesReveal>;
}

export function SalesLockNote({ children = "구체적인 시기와 이유는 전체 풀이에서 이어집니다." }: { children?: React.ReactNode }) {
  return <p className="ds-lock-note"><Icon name="lock" className="text-[14px]" />{children}</p>;
}

export function SalesAssurance() {
  return <div className="ds-assurance">
    <div><b>내 여덟 글자</b><p>이름만 바꾸는 글이 아니라<br />입력한 생년월일시로 세운 명식</p></div>
    <div><b>근거가 남는 풀이</b><p>무슨 글자를 어떻게 읽었는지<br />해석의 이유까지 함께</p></div>
    <div><b>내 곁에 두고</b><p>보관함에서 다시 읽고<br />PDF로 내려받기</p></div>
  </div>;
}

/** 화면에 들어오면 0부터 올라가는 숫자. 강조가 필요한 자리에만 쓴다. */
export function SalesCount({ value, suffix = "" }: { value: number; suffix?: string }) {
  const { ref, inView } = useInView<HTMLSpanElement>();
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (!inView) return;
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setShown(value); return; }
    let frame = 0;
    const steps = Math.min(value, 24) || 1;
    const timer = setInterval(() => {
      frame += 1;
      setShown(Math.round((value * frame) / steps));
      if (frame >= steps) clearInterval(timer);
    }, 1000 / steps);
    return () => clearInterval(timer);
  }, [inView, value]);
  return <span ref={ref} className="ds-count">{shown}{suffix}</span>;
}

/** 지금 몇 가지가 아직 가려져 있는지 — 남은 것을 수로 보여 준다. */
export function SalesLockedCount({ count, label }: { count: number; label: string }) {
  if (count <= 0) return null;
  return <SalesReveal className="ds-locked-count">
    <p><SalesCount value={count} suffix="가지" /></p>
    <b>{label}</b>
  </SalesReveal>;
}
