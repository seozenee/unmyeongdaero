// fal.ai 로 생성한 웹툰 컷(이미지·움직이는 영상). 에셋이 없으면 호출부가 코드로 그린 장면으로 대체한다.
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

export function WebtoonMedia({ asset, still = false, className }: { asset: WebtoonAsset; still?: boolean; className?: string }) {
  return (
    <div aria-hidden className={cn("absolute inset-0 overflow-hidden bg-surface-container-lowest", className)}>
      {asset.video && !still ? (
        <video
          src={asset.video}
          poster={asset.image}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="h-full w-full object-cover motion-safe:animate-fade-in print:hidden"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={asset.image} alt="" className="h-full w-full object-cover motion-safe:animate-ken-burns" />
      )}
    </div>
  );
}
