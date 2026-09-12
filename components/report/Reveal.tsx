"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/** 화면에 들어올 때 한 번 부드럽게 떠오른다 */
export function Reveal({ children, className, as: Tag = "div", id }: { children: React.ReactNode; className?: string; as?: "div" | "section"; id?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={ref} id={id} className={cn(visible ? "motion-safe:animate-fade-up" : "motion-safe:opacity-0", "print:opacity-100", className)}>
      {children}
    </Tag>
  );
}
