"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BirthForm } from "@/components/story/BirthForm";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import type { BirthProfile } from "@/lib/db/types";
import type { HomeChart } from "@/lib/manse/home-chart";
import { readLocalProfile } from "@/lib/me/local-profile";

/** 오행 막대 색. 목은 푸르고 화는 붉고 토는 누렇고 금은 희고 수는 검다 */
const ELEMENT_BAR: Record<string, string> = {
  wood: "bg-[#4fb286]",
  fire: "bg-[#f0522e]",
  earth: "bg-[#d4a017]",
  metal: "bg-[#c9c9c9]",
  water: "bg-[#5b8dd9]",
};

/**
 * 첫 화면에 펼치는 내 원국.
 *
 * 생년월일을 한 번이라도 적은 사람에게 상품 목록만 또 보여 줄 이유가 없다. 그 사람의
 * 여덟 글자는 우리가 바로 계산할 수 있고, 계산해서 펼쳐 놓으면 화면의 성격이 바뀐다 —
 * 고르는 화면이 아니라 자기 것을 확인하는 화면이 된다.
 *
 * 맨 아래 한 줄은 답을 알면서 가려 둔 것이다. 가린 값은 서버에만 있고 여기로 오지 않는다.
 * 화면에서만 가리면 개발자 도구를 연 사람에게는 공짜로 보인다 — 가린 척이 되는 것이다.
 */
export function MyChart() {
  const [profile, setProfile] = useState<BirthProfile | null>(null);
  const [chart, setChart] = useState<HomeChart | null>(null);
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  // 서버에서 받아 오기 전까지는 자리를 비워 둔다. 저장된 생일이 없는 사람에게
  // "내 명식 보기" 버튼이 깜빡 나타났다 사라지면 화면이 흔들린다
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
      setProfile(birth);
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

  // 아직 생일을 모르는 사람 — 적으면 바로 펼쳐 준다는 것만 보여 준다
  if (!chart) {
    return (
      <section className="mt-space-lg px-margin">
        {asking ? (
          <div className="flex flex-col gap-space-sm">
            {failed && (
              <p className="rounded-xl bg-error-container/30 p-space-sm font-body-sm text-body-sm text-on-surface">
                명식을 펼치지 못했어요. 적으신 날짜를 다시 확인해 주세요.
              </p>
            )}
            <BirthForm
              title="내 명식 펼치기"
              submitLabel={busy ? "펼치는 중…" : "무료로 펼쳐 보기"}
              onSubmit={load}
              onSkip={() => setAsking(false)}
              remember
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAsking(true)}
            className="flex w-full items-center gap-space-md rounded-2xl border border-outline-variant/50 bg-surface-container p-space-lg text-left transition-colors hover:bg-surface-container-high"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/15 font-headline-md text-headline-md text-primary">
              命
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="font-label-md text-label-md text-on-surface">내 여덟 글자부터 펼쳐 볼까요</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                생년월일만 적으면 바로 나와요. 돈은 들지 않아요.
              </span>
            </span>
            <Icon name="chevron_right" className="shrink-0 text-[20px] text-outline" />
          </button>
        )}
      </section>
    );
  }

  return (
    <section className="mt-space-lg px-margin">
      <div className="flex flex-col gap-space-md rounded-2xl bg-surface-container p-space-lg">
        {/* 누구의 명식인지 — 일간을 간판처럼 */}
        <div className="flex items-center gap-space-sm">
          {chart.dayMaster && (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 font-headline-md text-headline-md text-primary">
              {chart.dayMaster.hanja}
            </span>
          )}
          <span className="flex min-w-0 flex-col">
            <span className="font-label-md text-label-md text-on-surface">{chart.name}님의 사주 원국</span>
            {chart.dayMaster && (
              <span className="font-body-sm text-body-sm text-on-surface-variant">{chart.dayMaster.ko} 일간</span>
            )}
          </span>
          <button
            type="button"
            onClick={() => {
              setChart(null);
              setAsking(true);
            }}
            className="ml-auto shrink-0 rounded-full px-2.5 py-1 font-label-sm text-label-sm text-outline transition-colors hover:text-on-surface"
          >
            고치기
          </button>
        </div>

        {/* 여덟 글자 — 시·일·월·년 */}
        <ol className="grid grid-cols-4 gap-space-xs">
          {chart.pillars.map((pillar) => (
            <li
              key={pillar.slot}
              className="flex flex-col items-center gap-1 rounded-xl bg-surface-container-lowest py-space-sm"
            >
              <span className="font-label-sm text-label-sm text-outline">{pillar.slot}</span>
              <span className="font-headline-md text-headline-md leading-none text-on-surface">{pillar.stemHanja}</span>
              <span className="font-headline-md text-headline-md leading-none text-on-surface">{pillar.branchHanja}</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                {pillar.stem}
                {pillar.branch}
              </span>
            </li>
          ))}
        </ol>

        {/* 오행 — 한 줄 막대로 */}
        {chart.elements.length > 0 && (
          <div className="flex flex-col gap-space-xs">
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-surface-container-lowest">
              {chart.elements.map((element) => (
                <span
                  key={element.key}
                  className={cn("h-full", ELEMENT_BAR[element.key])}
                  style={{ width: `${element.percent}%` }}
                />
              ))}
            </div>
            <ul className="flex flex-wrap gap-x-space-sm gap-y-0.5">
              {chart.elements.map((element) => (
                <li key={element.key} className="flex items-center gap-1 font-label-sm text-label-sm">
                  <span className={cn("h-2 w-2 rounded-full", ELEMENT_BAR[element.key])} />
                  <span className="text-on-surface-variant">{element.ko}</span>
                  <span className={element.percent === 0 ? "text-outline" : "text-on-surface"}>{element.percent}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 답을 알면서 가려 둔 한 줄 */}
        {chart.masked && (
          <div className="flex flex-col gap-space-sm rounded-xl bg-primary/10 p-space-md">
            <p className="font-body-md text-body-md leading-relaxed text-on-surface">
              {chart.masked.prefix}{" "}
              <span className="rounded bg-on-surface/15 px-1.5 py-0.5 align-middle font-label-md text-label-md tracking-widest text-outline">
                ●●월
              </span>
              {chart.masked.suffix}
            </p>
            <Link
              href="/reports/life"
              className="flex items-center justify-center gap-1 rounded-xl bg-primary py-3 font-label-md text-label-md text-on-primary"
            >
              내 결과 이어 보기
              <Icon name="arrow_forward" className="text-[18px]" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
