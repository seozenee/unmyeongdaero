"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SpeechBalloon, WhisperLines } from "@/components/webtoon/ComicText";
import { Stage, StageAction } from "@/components/webtoon/Stage";
import type { useAmbientSound } from "@/components/webtoon/useAmbientSound";
import type { ReportProduct } from "@/lib/reports/catalog";
import { getGuide } from "@/lib/story/guides";
import { buildIntroShots } from "@/lib/story/webtoon";

/**
 * 구매 전 웹툰 인트로. 한 컷이 화면을 가득 채우고, 아래 버튼을 누를 때만 다음 컷으로 간다.
 * 마지막 컷의 버튼이 곧 대화 시작이다.
 */
export function WebtoonIntro({ report, onStart, onClose, sound, owned = false }: {
  report: ReportProduct;
  onStart: () => void;
  onClose: () => void;
  sound: ReturnType<typeof useAmbientSound>;
  owned?: boolean;
}) {
  const guide = getGuide(report.guide);
  const shots = useMemo(() => buildIntroShots(report), [report]);
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const reset = () => setIndex(0);
    window.addEventListener("pageshow", reset);
    window.addEventListener("pagehide", reset);
    return () => { window.removeEventListener("pageshow", reset); window.removeEventListener("pagehide", reset); };
  }, []);

  const shot = shots[index]!;
  const isLast = index === shots.length - 1;

  const advance = useCallback(() => {
    if (isLast) {
      onStart();
      return;
    }
    setIndex((value) => value + 1);
    sound.chime();
  }, [isLast, onStart, sound]);

  return (
    <Stage
      guide={guide}
      place={shot.place}
      camera={shot.camera}
      figure={shot.figure}
      assetKey={shot.assetKey}
      sfx={shot.sfx}
      sound={sound}
      onClose={onClose}
      progress={{current:index, total:shots.length}}
      onBack={index > 0 ? () => setIndex((value) => value - 1) : undefined}
      footer={<div className="flex flex-col gap-2">
        {isLast && <p className="text-center text-sm font-semibold text-on-surface">{report.title}</p>}
        <StageAction onClick={advance}>{isLast ? "내 사주 입력하기" : shot.action}</StageAction>
        {owned && <Link href={`/reports/${report.slug}/read`} className="min-h-11 py-2 text-center text-sm text-on-surface-variant">이미 받은 풀이 읽기</Link>}
      </div>}
    >
      {shot.balloon && (
        <SpeechBalloon key={`${shot.id}-balloon`} className="self-end" tail="bottom-right">
          {shot.balloon}
        </SpeechBalloon>
      )}
      <WhisperLines key={`${shot.id}-lines`} lines={shot.lines} className="pb-space-sm" />
    </Stage>
  );
}
