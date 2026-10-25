"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 이 요소가 지금 화면에 보이는지.
 *
 * 영상 카드를 여러 장 깔면 브라우저가 디코더를 아끼려고 제멋대로 멈춰 세운다. 그래서
 * 정작 보고 있는 카드가 정지한다. 보이는 카드만 재생하면 그 일이 생기지 않는다.
 *
 * 들어오고 나가는 것을 계속 따라가야 하므로 한 번 보고 끊지 않는다.
 * 관찰자가 없는 환경(서버 렌더 직후, 미리보기 캡처)에서는 보이는 것으로 둔다 —
 * 연출 하나 때문에 그림이 통째로 비면 그건 연출이 아니라 고장이다.
 */
export function useInView<T extends HTMLElement>(threshold = 0.35) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => setInView(Boolean(entry?.isIntersecting)), { threshold });
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}
