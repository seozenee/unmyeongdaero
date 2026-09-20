// 안내자 아이콘. 생성된 정면 초상(intro-5)의 얼굴 부분을 원형으로 잘라 쓴다.
import { getWebtoonAsset } from "@/components/webtoon/WebtoonMedia";
import { cn } from "@/lib/cn";
import type { Guide } from "@/lib/story/guides";

const ACCENT = {
  primary: "ring-primary/50",
  secondary: "ring-secondary/50",
  tertiary: "ring-tertiary/50",
} as const;

const SIZE = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-16 w-16",
} as const;

export function GuideAvatar({ guide, size = "md", className }: { guide: Guide; size?: keyof typeof SIZE; className?: string }) {
  const portrait = getWebtoonAsset(guide.id, "intro-5");

  return (
    <div
      aria-hidden
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-container-highest ring-1",
        ACCENT[guide.accent],
        SIZE[size],
        className,
      )}
    >
      {portrait && (
        // 얼굴이 이미지 위쪽에 있어 object-top 으로 맞춘다
        // eslint-disable-next-line @next/next/no-img-element
        <img src={portrait.image} alt="" loading="lazy" decoding="async" className="h-full w-full scale-[1.9] object-cover object-top" />
      )}
    </div>
  );
}
