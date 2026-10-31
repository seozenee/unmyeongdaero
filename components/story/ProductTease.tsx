"use client";

import { useCallback, useEffect, useState } from "react";
import { ChartBoard, dayPillarNickname } from "@/components/saju/ChartBoard";
import { BirthForm } from "@/components/story/BirthForm";
import { LockBadge } from "@/components/story/VeiledText";
import { Icon } from "@/components/ui/Icon";
import type { BirthProfile } from "@/lib/db/types";
import type { HomeChart } from "@/lib/manse/home-chart";
import { readLocalProfile } from "@/lib/me/local-profile";
import type { ReportProduct } from "@/lib/reports/catalog";

/**
 * 상세 화면 맨 위의 맛보기.
 *
 * 여기는 "이 상품은 이런 상품입니다" 만 적혀 있던 자리다. 어느 상품을 열어도 같은
 * 설명이 같은 자리에 있었으니, 읽는 사람 입장에서는 전단지 열여덟 장이 전부 비슷하게
 * 생긴 셈이다.
 *
 * 생년월일을 한 번이라도 적은 사람의 여덟 글자는 우리가 바로 세울 수 있다. 세워서
 * 맨 위에 깔면 화면의 성격이 바뀐다 — 파는 화면이 아니라 자기 것을 확인하는 화면이
 * 된다. 적은 적이 없는 사람에게는 적으면 바로 펼쳐 준다는 것만 보여 준다.
 *
 * 가린 값은 서버에 남는다. 화면에서만 가리면 개발자 도구를 연 사람에게는 공짜로
 * 보인다 — 가린 척이 되는 것이다.
 */
export function ProductTease({ report }: { report: ReportProduct }) {
  const [chart, setChart] = useState<HomeChart | null>(null);
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  // 서버에서 받아 오기 전까지는 자리를 비워 둔다. 저장된 생일이 없는 사람에게
  // 판이 깜빡 나타났다 사라지면 화면이 흔들린다
  const [ready, setReady] = useState(false);

  const load = useCallback(async (birth: BirthProfile) => {
    setBusy(true);
    setFailed(false);
    try {
      const response = await fetch("/api/manse/chart", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(birth),
      });
      if (!response.ok) {
        setFailed(true);
        return;
      }
      setChart((await response.json()) as HomeChart);
      setAsking(false);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    const saved = readLocalProfile();
    setReady(true);
    if (saved) void load(saved);
  }, [load]);

  if (!ready) return null;

  if (!chart) {
    if (!asking) {
      return (
        <section className="mt-space-xl">
          <button
            type="button"
            onClick={() => setAsking(true)}
            className="flex w-full items-center gap-space-md rounded-3xl border border-[rgb(var(--accent)/0.4)] bg-surface-container-low p-space-lg text-left transition-colors hover:bg-surface-container"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[rgb(var(--accent)/0.18)] text-[1.4rem] font-extrabold text-[rgb(var(--accent))]">
              命
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-[1.05rem] font-bold leading-snug tracking-tight text-on-surface">
                내 여덟 글자부터 펼쳐 볼까요
              </span>
              <span className="font-body-sm text-body-sm leading-snug text-on-surface-variant">
                생년월일만 적으면 바로 나와요. 돈은 들지 않아요.
              </span>
            </span>
            <Icon name="chevron_right" className="shrink-0 text-[20px] text-outline" />
          </button>
        </section>
      );
    }

    return (
      <section className="mt-space-xl flex flex-col gap-space-sm">
        {failed && (
          <p className="rounded-xl bg-error-container/30 p-space-sm font-body-sm text-body-sm text-on-surface">
            글자를 펼치지 못했어요. 적으신 날짜를 다시 확인해 주세요.
          </p>
        )}
        <BirthForm
          title="내 여덟 글자 펼치기"
          submitLabel={busy ? "펼치는 중…" : "무료로 펼쳐 보기"}
          onSubmit={load}
          onSkip={() => setAsking(false)}
          remember
        />
      </section>
    );
  }

  const nickname = dayPillarNickname(chart);

  return (
    <section className="mt-space-xl flex flex-col gap-space-md rounded-3xl bg-surface-container-low p-space-lg">
      <div className="flex items-start justify-between gap-space-sm">
        <div className="flex flex-col gap-1">
          <span className="font-label-sm text-label-sm font-bold tracking-[0.14em] text-[rgb(var(--accent))]">
            맛보기 · {chart.name}님의 여덟 글자
          </span>
          {nickname && (
            <h2 className="ink-shine-accent text-[1.75rem] font-extrabold leading-[1.2] tracking-[-0.03em]">
              {nickname}
            </h2>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setChart(null);
            setAsking(true);
          }}
          className="shrink-0 rounded-full px-2.5 py-1 font-label-sm text-label-sm text-outline transition-colors hover:text-on-surface"
        >
          고치기
        </button>
      </div>

      <ChartBoard chart={chart} />

      {chart.masked && (
        <div className="flex flex-col gap-space-sm rounded-2xl bg-[rgb(var(--accent)/0.12)] p-space-md">
          <div className="flex items-start justify-between gap-space-sm">
            <p className="font-body-md text-body-md leading-relaxed text-on-surface">
              {chart.masked.prefix}{" "}
              <span className="inline-block whitespace-nowrap rounded bg-on-surface/15 px-1.5 py-0.5 align-middle font-label-md text-label-md tracking-widest text-outline">
                ●●월
              </span>
              {chart.masked.suffix}
            </p>
            <LockBadge className="mt-0.5" />
          </div>
          <p className="font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
            「{report.title}」에서는 이 여덟 글자를 {report.chapters.length}개 장으로 나눠, 어느 글자에서 나온 말인지까지
            붙여 풀어 드려요.
          </p>
        </div>
      )}
    </section>
  );
}
