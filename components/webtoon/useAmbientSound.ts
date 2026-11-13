"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// 음원 파일 없이 Web Audio 로 합성하는 잔잔한 배경음과 컷 전환 소리.
export function useAmbientSound(active: boolean) {
  const contextRef = useRef<AudioContext | null>(null);
  const [on, setOn] = useState(true);

  const stop = useCallback(() => {
    const context = contextRef.current;
    contextRef.current = null;
    if (context) void context.close().catch(() => undefined);
  }, []);

  const start = useCallback(() => {
    const current = contextRef.current;
    if (current) {
      if (current.state !== "running") void current.resume().catch(() => undefined);
      return;
    }

    const AudioContextClass = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const master = context.createGain();
    master.gain.value = 0;
    master.connect(context.destination);

    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 700;
    filter.connect(master);

    // 낮은 드론 3음
    [110, 164.81, 220.5].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = index === 2 ? "triangle" : "sine";
      oscillator.frequency.value = frequency;
      const gain = context.createGain();
      gain.gain.value = index === 2 ? 0.12 : 0.32;
      oscillator.connect(gain).connect(filter);
      oscillator.start();
    });

    // 느린 숨결 같은 음량 변화
    const lfo = context.createOscillator();
    const lfoGain = context.createGain();
    lfo.frequency.value = 0.08;
    lfoGain.gain.value = 0.015;
    lfo.connect(lfoGain).connect(master.gain);
    lfo.start();

    master.gain.linearRampToValueAtTime(0.045, context.currentTime + 1.8);
    contextRef.current = context;
    if (context.state !== "running") void context.resume().catch(() => undefined);
  }, []);

  const toggle = useCallback(() => {
    if (on) stop();
    else if (active) start();
    setOn(!on);
  }, [active, on, start, stop]);

  const chime = useCallback(() => {
    const context = contextRef.current;
    if (context?.state !== "running") return;
    const now = context.currentTime;
    [1318.5, 1975.5].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, now + index * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.05 / (index + 1), now + index * 0.09 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.09 + 1.4);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(now + index * 0.09);
      oscillator.stop(now + index * 0.09 + 1.5);
    });
  }, []);

  useEffect(() => {
    if (!active || !on) return;
    // 브라우저가 소리 자동 재생을 막으면 첫 탭이나 키 입력으로 재생을 시작한다.
    if (navigator.userActivation?.hasBeenActive !== false) start();
    document.addEventListener("pointerup", start);
    document.addEventListener("keydown", start);
    return () => {
      document.removeEventListener("pointerup", start);
      document.removeEventListener("keydown", start);
    };
  }, [active, on, start]);

  useEffect(() => {
    if (active) return stop;
  }, [active, stop]);

  return { on, toggle, chime };
}
