"use client";

// fal.ai 로 만든 웹툰 컷.
//
// 영상이 있으면 영상을 틀고, 없으면 정지 이미지에 CSS 모션을 얹는다.
//
// 한동안 영상을 꺼 두고 이미지만 썼다. 생성기가 내놓은 영상이 컷당 5~8MB 라 첫 장면이
// 뜨기까지 한참 걸렸기 때문이다. 지금은 9:16 으로 자르고 다시 인코딩해 0.3MB 대로 줄었으므로
// (scripts/optimize-webtoon-videos.sh) 다시 튼다. 정지 이미지의 CSS 팬으로는 인물이 숨 쉬고
// 등불이 흔들리는 결까지 흉내 낼 수 없다.
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

/**
 * 한 컷.
 *
 * 그림은 늘 깔려 있고, 보이는 동안에만 그 위에 영상이 올라온다.
 *
 * 한동안 <video> 를 항상 붙여 두고 preload 로만 아꼈다. 화면 밖에서 <img> 로 갈아 끼우면
 * 미는 동안 요소가 통째로 바뀌면서 영상이 끊겨 보일까 봐서였다. 그런데 첫 화면이 포스터
 * 카드로 채워지면서 한 장에 <video> 가 예순 개 넘게 붙었고, 브라우저는 동시에 둘 수 있는
 * 미디어 요소 수가 정해져 있어서 전부 멈춰 세웠다 — 정작 보고 있는 카드가 정지 사진이 됐다.
 * 폰에서는 한도가 훨씬 낮아 더 빨리 그렇게 된다.
 *
 * 그래서 보이는 컷만 <video> 를 붙이고 나가면 떼어 낸다. 떼어 내도 같은 그림의 <img> 가
 * 그 자리에 그대로 남아 있으므로 깜빡이지 않는다 — 처음에 걱정했던 일은 그림을 밑에
 * 깔아 두는 것으로 해결된다.
 *
 * 움직임을 줄여 쓰는 사람에게는 영상을 붙이지 않는다 — 5초짜리 반복 재생은 전정기관을
 * 자극할 수 있다. 그 경우 그림에 CSS 모션조차 걸지 않는다(motion-safe).
 */
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
  const playVideo = Boolean(asset.video) && !still && active;

  return (
    <div aria-hidden className={cn("absolute inset-0 overflow-hidden bg-surface-container-lowest", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={asset.image}
        alt=""
        loading="lazy"
        decoding="async"
        className={cn("h-full w-full object-cover", !still && !asset.video && motionFor(asset.image))}
      />
      {playVideo && <SceneVideo src={asset.video!} poster={asset.image} />}
    </div>
  );
}

/**
 * 한 컷의 영상.
 *
 * 밑에 같은 그림이 깔려 있으므로 받아 오는 동안에도 화면이 비지 않는다. poster 까지
 * 함께 걸어, 자동재생이 막히거나 데이터를 아끼는 설정에서도 첫 그림이 남게 한다.
 */
function SceneVideo({ src, poster }: { src: string; poster: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    const video = ref.current;
    if (!video || reduced) return;

    // 자동재생이 막히는 자리가 있다(브라우저 정책, 데이터 절약 설정). 그러면 첫 그림만
    // 남고 멈춰 있는데, 손님이 화면을 한 번 건드리는 순간은 재생이 허용되는 순간이기도
    // 하다. 막혔을 때만 그 한 번을 기다렸다 다시 튼다.
    const retryOnGesture = () => {
      const once = () => void video.play().catch(() => undefined);
      document.addEventListener("pointerdown", once, { once: true });
      return () => document.removeEventListener("pointerdown", once);
    };
    let cancelGesture: (() => void) | undefined;
    const play = () => void video.play().catch(() => (cancelGesture ??= retryOnGesture()));
    play();

    // 탭을 숨기면 브라우저가 재생을 멈춰 세운다. 돌아왔을 때 아무도 다시 틀어 주지 않으면
    // 첫 화면이 정지 사진으로 남는다 — 앱을 잠깐 나갔다 온 사람에게는 그게 전부다.
    const onVisible = () => {
      if (!document.hidden) play();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      cancelGesture?.();
    };
  }, [src, reduced]);

  if (reduced) return null;

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}
