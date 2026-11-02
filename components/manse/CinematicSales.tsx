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

export function SalesChapter({ title }: { title: string }) {
  return <SalesReveal className="ds-chapter"><span aria-hidden="true">◆</span><p>{title}</p><span aria-hidden="true">◆</span></SalesReveal>;
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
