"use client";

// fal.ai 로 만든 웹툰 컷.
//
// 영상이 있으면 영상을 틀고, 없으면 정지 이미지에 CSS 모션을 얹는다.
//
// 한동안 영상을 꺼 두고 이미지만 썼다. 생성기가 내놓은 영상이 컷당 5~8MB 라 첫 장면이
// 뜨기까지 한참 걸렸기 때문이다. 지금은 9:16 으로 자르고 다시 인코딩해 0.3MB 대로 줄었으므로
// (scripts/optimize-webtoon-videos.sh) 다시 튼다. 정지 이미지의 CSS 팬으로는 인물이 숨 쉬고
// 등불이 흔들리는 결까지 흉내 낼 수 없다.
//
// poster 에 같은 컷의 이미지를 넣어, 영상이 첫 프레임을 받기 전에도 화면이 비지 않게 한다.
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { WebtoonAsset } from "./assets";

// 컷마다 다른 결로 움직이도록 이미지 경로에서 결정적으로 고른다 (영상이 없는 컷에만 쓴다)
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

export function WebtoonMedia({
  asset,
  still = false,
  active = true,
  className,
}: {
  asset: WebtoonAsset;
  /** 정지 화면으로 둘 것인지 (보고서 표지 등) */
  still?: boolean;
  /** 지금 보이는 컷인가. 캐러셀처럼 여러 장이 깔릴 때 보이는 것만 재생한다 */
  active?: boolean;
  className?: string;
}) {
  const playVideo = Boolean(asset.video) && !still;

  return (
    <div aria-hidden className={cn("absolute inset-0 overflow-hidden bg-surface-container-lowest", className)}>
      {playVideo ? (
        <SceneVideo src={asset.video!} poster={asset.image} active={active} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={asset.image}
          alt=""
          loading="lazy"
          decoding="async"
          className={cn("h-full w-full object-cover", !still && motionFor(asset.image))}
        />
      )}
    </div>
  );
}

/**
 * 한 컷의 영상.
 *
 * 받아 온 첫 프레임이 뜨기 전까지는 poster 이미지가 보이고, 준비되면 조용히 겹쳐 올라온다.
 * 바로 바꾸면 이미지와 영상의 밝기 차이가 깜빡임처럼 보인다.
 *
 * 움직임을 줄여 쓰는 사람에게는 영상을 틀지 않고 첫 프레임만 보여 준다 —
 * 5초짜리 반복 재생은 전정기관을 자극할 수 있다.
 *
 * 여러 장이 한 화면에 깔리면(캐러셀) 보이는 것만 재생한다. 넷을 동시에 틀면
 * 브라우저가 디코더를 아끼려고 제멋대로 멈춰 세워, 정작 보고 있는 카드가 정지한다.
 */
function SceneVideo({ src, poster, active }: { src: string; poster: string; active: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // 서버에서 내려온 <video> 는 React 가 붙기 전에 이미 다 받아 둘 수 있다. 그러면 canplay 는
  // 이미 지나가 버렸고, 그 한 번을 놓치면 영상이 투명한 채로 깔려 까만 화면만 남는다.
  // 지금 상태를 직접 보고, 앞으로 올 이벤트도 함께 듣는다.
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const show = () => setReady(true);
    if (video.readyState >= 2) show();
    video.addEventListener("loadeddata", show);
    video.addEventListener("canplay", show);
    return () => {
      video.removeEventListener("loadeddata", show);
      video.removeEventListener("canplay", show);
    };
  }, [src]);

  useEffect(() => {
    const video = ref.current;
    if (!video || reduced) return;
    if (!active) {
      video.pause();
      return;
    }
    // 자동재생이 막히는 환경(저전력 모드 등)에서는 poster 가 그대로 남는다 — 화면이 비지는 않는다
    const play = () => void video.play().catch(() => undefined);
    play();

    // 탭을 숨기면 브라우저가 재생을 멈춰 세운다. 돌아왔을 때 아무도 다시 틀어 주지 않으면
    // 첫 화면이 정지 사진으로 남는다 — 앱을 잠깐 나갔다 온 사람에게는 그게 전부다.
    const onVisible = () => {
      if (!document.hidden) play();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [src, reduced, active]);

  return (
    <video
      ref={ref}
      key={src}
      src={src}
      poster={poster}
      autoPlay={!reduced && active}
      loop
      muted
      playsInline
      preload="auto"
      className={cn(
        "h-full w-full object-cover transition-opacity duration-700",
        ready ? "opacity-100" : "opacity-0",
      )}
      // 영상이 아직이면 poster 가 보이도록 배경에 같은 그림을 깔아 둔다
      style={{ backgroundImage: `url(${poster})`, backgroundSize: "cover", backgroundPosition: "center" }}
    />
  );
}
