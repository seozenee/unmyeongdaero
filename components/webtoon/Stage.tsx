"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { SfxText } from "@/components/webtoon/ComicText";
import { getWebtoonAsset, WebtoonMedia, type WebtoonAsset } from "@/components/webtoon/WebtoonMedia";
import { cn } from "@/lib/cn";
import type { Guide } from "@/lib/story/guides";
import type { Camera, FigurePose, Place } from "@/lib/story/webtoon";

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

  // 스테이지가 떠 있는 동안 뒤쪽 페이지 스크롤을 잠그고, 아래 내비게이션을 숨긴다.
  // (내비는 반투명이라 덮어 두기만 하면 스테이지 버튼 뒤로 비쳐 보인다)
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.dataset.stageOpen = "true";
    return () => {
      document.body.style.overflow = previousOverflow;
      delete document.body.dataset.stageOpen;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[60] mx-auto flex w-full max-w-md flex-col overflow-hidden bg-surface-container-lowest lg:shadow-[0_0_80px_rgba(0,0,0,0.55)] lg:ring-1 lg:ring-outline-variant/30">
      {/* 장면 — 이전 컷 위로 겹쳐 넘어간다 */}
      <SceneLayer sceneKey={`${place}-${assetKey ?? camera}`} asset={asset} still={still} />

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

/**
 * 장면 한 겹.
 *
 * 컷이 바뀔 때 이전 컷을 바로 지우지 않고 아래에 남겨 둔 뒤, 새 컷이 다 올라오면 치운다.
 * 바로 지우면 두 컷 사이에 검은 바탕이 한 프레임 비쳐 끊겨 보인다 — 장면이 바뀌는 게
 * 아니라 화면이 깜빡이는 것처럼 느껴진다.
 */
function SceneLayer({
  sceneKey,
  asset,
  still,
}: {
  sceneKey: string;
  asset: WebtoonAsset | null;
  still?: boolean;
}) {
  const [layers, setLayers] = useState<Array<{ key: string; asset: WebtoonAsset | null }>>([
    { key: sceneKey, asset },
  ]);

  useEffect(() => {
    setLayers((current) => {
      if (current[current.length - 1]?.key === sceneKey) return current;
      // 바로 앞 컷 하나만 남긴다. 더 쌓으면 영상이 여러 개 동시에 돌아간다.
      return [...current.slice(-1), { key: sceneKey, asset }];
    });
  }, [sceneKey, asset]);

  // 새 컷이 올라오고 나면 아래 겹을 치운다
  useEffect(() => {
    if (layers.length < 2) return;
    const timer = setTimeout(() => setLayers((current) => current.slice(-1)), 700);
    return () => clearTimeout(timer);
  }, [layers]);

  return (
    <div className="absolute inset-0">
      {layers.map((layer, index) => (
        <div
          key={layer.key}
          className={cn(
            "absolute inset-0",
            // 마지막(새) 겹만 떠오르게 한다. 아래 겹은 그대로 두고 위에서 덮는다.
            index === layers.length - 1 && layers.length > 1 && "motion-safe:animate-fade-in",
          )}
        >
          {layer.asset && <WebtoonMedia asset={layer.asset} still={still} />}
        </div>
      ))}
      {/* 글자가 읽히도록 위아래를 어둡게 */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface-container-lowest from-[2%] via-transparent to-surface-container-lowest/45" />
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_90px_rgba(0,0,0,0.55)]" />
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
        // 누를 때 살짝 들어가고, 손가락을 떼면 돌아온다. 화면이 어두워 버튼이 떠 있어야
        // 눌리는 것임을 알 수 있으므로 그림자를 넉넉히 준다.
        "group flex w-full items-center justify-center gap-2 rounded-xl py-4 font-label-md text-label-md",
        "shadow-[0_8px_24px_rgba(0,0,0,0.45)] transition-[transform,box-shadow,background-color] duration-200",
        "active:translate-y-[1px] active:shadow-[0_4px_14px_rgba(0,0,0,0.5)] disabled:opacity-60",
        tone === "story"
          ? "bg-secondary-container/90 text-on-secondary-container ring-1 ring-secondary/40 backdrop-blur-md hover:bg-secondary-container"
          : "bg-on-surface text-surface hover:bg-on-surface/92",
      )}
    >
      {children}
    </button>
  );
}
