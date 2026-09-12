"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// 음원 파일 없이 Web Audio 로 합성하는 잔잔한 배경음 + 컷 전환 풍경 소리. 기본값은 꺼짐(사용자 조작으로만 켬).
export function useAmbientSound() {
  const contextRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const onRef = useRef(false);
  const [on, setOn] = useState(false);

  const stop = useCallback(() => {
    const context = contextRef.current;
    if (context && masterRef.current) {
      masterRef.current.gain.linearRampToValueAtTime(0, context.currentTime + 0.6);
      window.setTimeout(() => void context.close(), 700);
    }
    contextRef.current = null;
    masterRef.current = null;
    onRef.current = false;
    setOn(false);
  }, []);

  const start = useCallback(() => {
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
    masterRef.current = master;
    onRef.current = true;
    setOn(true);
  }, []);

  const toggle = useCallback(() => (onRef.current ? stop() : start()), [start, stop]);

  const chime = useCallback(() => {
    const context = contextRef.current;
    if (!context || !onRef.current) return;
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

  useEffect(() => () => void contextRef.current?.close(), []);

  return { on, toggle, chime };
}
