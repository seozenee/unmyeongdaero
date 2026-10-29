"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

interface ReadMeAloudProps {
  name: string;
  /** 명식에서 나온 장면들. 지어낸 말이 아니라 계산된 값의 다른 표현이다. */
  scenes: string[];
}

/**
 * 결제 직전, 먼저 맞혀 보이는 자리.
 *
 * 여기까지 온 사람은 생년월일시를 적고 여덟 글자를 받아 본 참이다. 그런데 한자 여덟 자는
 * 맞는지 틀린지 알 수 없어서, "그래서 이게 나랑 무슨 상관인데"로 끝나기 쉽다.
 *
 * 그래서 돈을 받기 전에 먼저 하나를 보여 준다. 아래 문장들은 점이 아니라 분류다 —
 * 신강약과 오행 분포에서 바로 나오고, 그 둘은 생년월일시로 계산된 값이다. 맞는다고
 * 느껴지는 이유가 거기에 있다.
 *
 * 한 줄씩 차례로 올린다. 세 줄을 한꺼번에 깔면 훑고 지나가지만, 하나씩 오면 각각을
 * 자기 삶에 대 보게 된다.
 */
export function ReadMeAloud({ name, scenes }: ReadMeAloudProps) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || typeof IntersectionObserver === "undefined") {
      setShown(scenes.length);
      return;
    }

    let timers: number[] = [];
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        timers = scenes.map((_, index) => window.setTimeout(() => setShown(index + 1), index * 900));
      },
      { rootMargin: "-10% 0px" },
    );
    observer.observe(node);

    // 관찰자가 돌지 않는 자리(배경 탭, 썸네일 캡처)에서도 내용이 사라지면 안 된다
    const fallback = window.setTimeout(() => setShown(scenes.length), 2600);
    return () => {
      observer.disconnect();
      timers.forEach(window.clearTimeout);
      window.clearTimeout(fallback);
    };
  }, [scenes]);

  if (scenes.length === 0) return null;

  return (
    <section
      ref={ref}
      aria-label="먼저 짚어 보는 것"
      className="flex flex-col gap-space-md rounded-2xl border border-secondary/25 bg-secondary/[0.06] p-space-lg"
    >
      <div className="flex items-start gap-space-sm">
        <Icon name="auto_awesome" className="mt-0.5 shrink-0 text-[20px] text-secondary" />
        <div className="flex flex-col gap-0.5">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">{name}님, 이런 적 있으셨죠</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            방금 계산한 여덟 글자에서 바로 나오는 것들이에요. 풀이를 열면 왜 그런지까지 말씀드릴게요.
          </p>
        </div>
      </div>

      <ul className="flex flex-col gap-space-sm">
        {scenes.map((scene, index) => (
          <li
            key={scene}
            className={cn(
              "flex gap-space-sm rounded-xl bg-surface-container-lowest/80 p-space-md transition-all duration-500 ease-out",
              index < shown ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
            )}
          >
            <Icon name="check" className="mt-0.5 shrink-0 text-[18px] text-secondary" />
            <span className="font-body-md text-body-md leading-relaxed text-on-surface">{scene}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
