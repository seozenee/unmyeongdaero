"use client";

import { useEffect, useRef, useState } from "react";

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * 텍스트를 한 글자씩 드러낸다. 스트리밍으로 text 가 길어지면 이어서 타이핑한다.
 * skip() 을 부르면 즉시 끝까지 보여준다.
 */
export function useTypewriter(text: string, { charsPerSecond = 38, enabled = true } = {}) {
  const [shown, setShown] = useState(() => (enabled && !prefersReducedMotion() ? 0 : text.length));
  const skipped = useRef(false);

  useEffect(() => {
    if (!enabled || skipped.current || prefersReducedMotion()) {
      setShown(text.length);
      return;
    }
    let frame = 0;
    let last = performance.now();
    let carry = 0;

    const tick = (now: number) => {
      carry += ((now - last) / 1000) * charsPerSecond;
      last = now;
      const step = Math.floor(carry);
      if (step > 0) {
        carry -= step;
        setShown((current) => Math.min(current + step, text.length));
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [text, charsPerSecond, enabled]);

  const visible = Math.min(shown, text.length);
  return {
    text: text.slice(0, visible),
    done: visible >= text.length,
    skip: () => {
      skipped.current = true;
      setShown(text.length);
    },
  };
}
