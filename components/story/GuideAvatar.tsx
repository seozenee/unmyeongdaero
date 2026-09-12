import { cn } from "@/lib/cn";
import type { Guide } from "@/lib/story/guides";

const ACCENT = {
  primary: { ring: "ring-primary/50", glow: "from-primary/35", text: "text-primary" },
  secondary: { ring: "ring-secondary/50", glow: "from-secondary/35", text: "text-secondary" },
  tertiary: { ring: "ring-tertiary/50", glow: "from-tertiary/35", text: "text-tertiary" },
} as const;

const SIZE = {
  sm: "h-8 w-8 text-[15px]",
  md: "h-10 w-10 text-headline-md",
  lg: "h-16 w-16 text-headline-lg-mobile",
} as const;

/** 초상화 대신 안내자의 인장 글자와 기운(그라데이션)으로 표현한다. 캐릭터 일러스트가 생기면 여기서 교체. */
export function GuideAvatar({ guide, size = "md", className }: { guide: Guide; size?: keyof typeof SIZE; className?: string }) {
  const accent = ACCENT[guide.accent];
  return (
    <div
      aria-hidden
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-container-highest ring-1",
        accent.ring,
        SIZE[size],
        className,
      )}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br to-transparent", accent.glow)} />
      <span className={cn("relative font-headline-md font-bold leading-none", accent.text)}>{guide.seal}</span>
    </div>
  );
}
