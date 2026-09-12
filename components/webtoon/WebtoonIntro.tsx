"use client";

import { useCallback, useMemo, useState } from "react";
import { SpeechBalloon, WhisperLines } from "@/components/webtoon/ComicText";
import { Stage, StageAction } from "@/components/webtoon/Stage";
import { useAmbientSound } from "@/components/webtoon/useAmbientSound";
import type { ReportProduct } from "@/lib/reports/catalog";
import { getGuide } from "@/lib/story/guides";
import { buildIntroShots } from "@/lib/story/webtoon";

/**
 * 구매 전 웹툰 인트로. 한 컷이 화면을 가득 채우고, 아래 버튼을 누를 때만 다음 컷으로 간다.
 * 마지막 컷의 버튼이 곧 대화 시작이다.
 */
export function WebtoonIntro({ report, onStart, onClose }: { report: ReportProduct; onStart: () => void; onClose: () => void }) {
  const guide = getGuide(report.guide);
  const shots = useMemo(() => buildIntroShots(report), [report]);
  const [index, setIndex] = useState(0);
  const sound = useAmbientSound();

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
      onBack={index > 0 ? () => setIndex((value) => value - 1) : undefined}
      footer={<StageAction onClick={advance}>{shot.action}</StageAction>}
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
