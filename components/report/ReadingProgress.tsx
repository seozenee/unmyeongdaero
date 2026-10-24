"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 읽은 만큼 차오르는 가는 띠.
 *
 * 명식 전서는 열한 장이다. 그만큼 긴 글을 스크롤바 하나로 읽게 두면 "얼마나 남았지" 가
 * 계속 걸린다. 얇은 띠 하나로 그 질문에 답한다.
 *
 * 헤더 바로 아래에 붙인다. 화면을 가리지 않을 만큼 얇게, 그러나 눈에는 들어오게.
 */
export function ReadingProgress() {
  const [ratio, setRatio] = useState(0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const measure = () => {
      frame.current = null;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      // 글이 한 화면에 다 들어오면 띠를 띄울 이유가 없다
      setRatio(scrollable <= 0 ? 0 : Math.min(1, Math.max(0, window.scrollY / scrollable)));
    };

    // 스크롤마다 레이아웃을 재면 끊긴다 — 프레임당 한 번으로 묶는다
    const onScroll = () => {
      if (frame.current === null) frame.current = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, []);

  if (ratio <= 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-16 z-40 mx-auto h-0.5 w-full max-w-md bg-outline-variant/20 print:hidden"
      role="progressbar"
      aria-label="읽은 분량"
      aria-valuenow={Math.round(ratio * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full bg-gradient-to-r from-primary to-secondary transition-[width] duration-150 ease-out"
        style={{ width: `${ratio * 100}%` }}
      />
    </div>
  );
}
