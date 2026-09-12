// fal.ai 로 만든 웹툰 컷. 에셋이 없으면 호출부가 코드로 그린 장면으로 대체한다.
//
// 영상 대신 정지 이미지에 CSS 모션을 얹는다. 생성형 영상은 컷당 5~8MB 라
// 대역폭을 그대로 태우는데, 같은 인상을 CSS 로 90KB 이미지에서 만들 수 있다.
// (manifest 의 video 항목은 과거 생성분이라 남겨 두되 재생하지 않는다)
import { cn } from "@/lib/cn";
import type { GuideId } from "@/lib/story/guides";
import manifest from "@/lib/story/webtoon-manifest.json";

export interface WebtoonAsset {
  image: string;
  video?: string;
}

const MANIFEST = manifest as Record<string, Record<string, WebtoonAsset> | undefined>;

export function getWebtoonAsset(guide: GuideId, key: string | undefined): WebtoonAsset | null {
  if (!key) return null;
  return MANIFEST[guide]?.[key] ?? null;
}

// 컷마다 다른 결로 움직이도록 이미지 경로에서 결정적으로 고른다
const MOTIONS = [
  "motion-safe:animate-ken-burns",
  "motion-safe:animate-push-in",
  "motion-safe:animate-tilt",
  "motion-safe:animate-slow-zoom",
] as const;

function motionFor(src: string) {
  let hash = 0;
  for (let index = 0; index < src.length; index += 1) hash = (hash * 31 + src.charCodeAt(index)) % 997;
  return MOTIONS[hash % MOTIONS.length]!;
}

export function WebtoonMedia({ asset, still = false, className }: { asset: WebtoonAsset; still?: boolean; className?: string }) {
  return (
    <div aria-hidden className={cn("absolute inset-0 overflow-hidden bg-surface-container-lowest", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={asset.image}
        alt=""
        loading="lazy"
        decoding="async"
        className={cn("h-full w-full object-cover", !still && motionFor(asset.image))}
      />
    </div>
  );
}
