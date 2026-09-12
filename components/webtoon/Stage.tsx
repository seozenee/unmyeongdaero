"use client";

import { useEffect } from "react";
import { Icon } from "@/components/ui/Icon";
import { SfxText } from "@/components/webtoon/ComicText";
import { GuideFigure } from "@/components/webtoon/GuideFigure";
import { SceneBackdrop } from "@/components/webtoon/SceneBackdrop";
import { getWebtoonAsset, WebtoonMedia } from "@/components/webtoon/WebtoonMedia";
import { cn } from "@/lib/cn";
import type { Guide } from "@/lib/story/guides";
import type { Camera, FigurePose, Place } from "@/lib/story/webtoon";

/** 캐릭터가 화면에 서는 자리 */
const FIGURE: Record<Exclude<FigurePose, "none">, string> = {
  silhouette: "bottom-0 h-[46%] brightness-[0.22] saturate-0 opacity-90",
  reveal: "bottom-0 h-[62%] motion-safe:animate-rise-in",
  close: "bottom-0 h-[78%] motion-safe:animate-fade-in",
};

interface StageProps {
  guide: Guide;
  place: Place;
  camera: Camera;
  figure: FigurePose;
  /** 생성 에셋 키. 해당 컷의 이미지·영상이 있으면 코드 장면 대신 쓴다 */
  assetKey?: string;
  /** 영상 대신 정지 이미지로 */
  still?: boolean;
  sfx?: string;
  /** 장면 위에 겹치는 내용 — 말풍선, 대사 줄 */
  children?: React.ReactNode;
  /** 화면 아래 고정 영역 — 행동 버튼, 선택지, 입력 시트 */
  footer: React.ReactNode;
  /** 왼쪽 아래 되돌아가기 */
  onBack?: () => void;
  /** 화면을 누를 때 (대사 빨리 넘기기 등) */
  onTap?: () => void;
  /** 오른쪽 위 소리 토글 */
  sound?: { on: boolean; toggle: () => void };
  /** 스토리에서 빠져나가기 */
  onClose?: () => void;
}

export function Stage({ guide, place, camera, figure, assetKey, still, sfx, children, footer, onBack, onTap, sound, onClose }: StageProps) {
  const asset = getWebtoonAsset(guide.id, assetKey);

  // 스테이지가 떠 있는 동안 뒤쪽 페이지가 스크롤되지 않게 잠근다
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col overflow-hidden bg-surface-container-lowest">
      {/* 장면 */}
      <div key={`${place}-${assetKey ?? camera}`} className="absolute inset-0 motion-safe:animate-fade-in">
        {asset ? <WebtoonMedia asset={asset} still={still} /> : <SceneBackdrop theme={guide.id} camera={camera} place={place} />}
        {!asset && figure !== "none" && (
          <div className={cn("absolute left-1/2 -translate-x-1/2", FIGURE[figure])}>
            <GuideFigure guide={guide} />
          </div>
        )}
        {/* 글자가 읽히도록 위아래를 어둡게 */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-surface-container-lowest/45" />
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_90px_rgba(0,0,0,0.55)]" />
      </div>

      {/* 상단 조작 */}
      <div className="pt-safe relative flex items-start justify-between p-space-md">
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-lowest/55 text-on-surface backdrop-blur"
          >
            <Icon name="close" className="text-[20px]" />
          </button>
        ) : (
          <span />
        )}
        {sound && (
          <button
            type="button"
            onClick={sound.toggle}
            aria-label={sound.on ? "소리 끄기" : "소리 켜기"}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-lowest/55 text-on-surface backdrop-blur"
          >
            <Icon name={sound.on ? "volume_up" : "volume_off"} className="text-[20px]" />
          </button>
        )}
      </div>

      {/* 장면 위에 겹치는 내용 */}
      <div
        className="no-scrollbar relative flex flex-1 flex-col justify-end gap-space-md overflow-y-auto px-margin pb-space-md"
        onClick={onTap}
      >
        {sfx && (
          <div className="pointer-events-none absolute right-margin top-[12%]">
            <SfxText rotate={-10}>{sfx}</SfxText>
          </div>
        )}
        {children}
      </div>

      {/* 아래 고정 영역 */}
      <div className="pb-safe relative flex items-stretch gap-space-sm px-margin pb-space-md">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="이전 장면"
            className="flex w-11 shrink-0 items-center justify-center rounded-lg bg-surface-container-lowest/70 text-on-surface-variant ring-1 ring-outline-variant/50 backdrop-blur transition-colors hover:text-on-surface"
          >
            <Icon name="chevron_left" className="text-[22px]" />
          </button>
        )}
        <div className="min-w-0 flex-1">{footer}</div>
      </div>
    </div>
  );
}

/** 스테이지 아래에 놓는 기본 행동 버튼 */
export function StageAction({
  children,
  onClick,
  disabled,
  tone = "story",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "story" | "confirm";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-lg py-3.5 font-label-md text-label-md shadow-lg transition-transform active:scale-[0.99] disabled:opacity-60",
        tone === "story"
          ? "bg-secondary-container/90 text-on-secondary-container ring-1 ring-secondary/30 backdrop-blur"
          : "bg-on-surface text-surface",
      )}
    >
      {children}
    </button>
  );
}
