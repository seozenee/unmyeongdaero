import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ManseConfirm } from "@/components/manse/ManseConfirm";
import { ManseSheet, type ManseFact } from "@/components/manse/ManseSheet";
import { Icon } from "@/components/ui/Icon";
import { getCurrentUser, loginUrl } from "@/lib/auth/session";
import { getRepository } from "@/lib/db";
import { GLOSSARY } from "@/lib/manse/glossary";
import { loadReport } from "@/lib/reports/store";
import { findCurrentDecadeIndex, internationalAge, parseDecadeFortune, parseElementCounts, parseFourPillars } from "@/lib/saju/modules";
import { mergedModules } from "@/lib/sazu/readings";
import { describeBirth } from "@/lib/story/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "만세력 확인", robots: { index: false } };

type Json = unknown;
const at = (value: Json, path: string): Json =>
  path.split(".").reduce<Json>(
    (current, key) => (current && typeof current === "object" ? (current as Record<string, Json>)[key] : undefined),
    value,
  );
const str = (value: Json) => (typeof value === "string" && value.trim() ? value.trim() : null);

/**
 * 결제 전에 계산된 만세력만 보여 주는 화면.
 *
 * 여기에는 해석이 없다. 사주가 이렇게 나왔다는 사실만 보여 주고, 그 뜻은 결제 뒤에 읽는다.
 * 사는 사람 입장에서는 "내 정보가 제대로 들어갔는지" 확인하는 자리이기도 하다 —
 * 생년월일을 잘못 넣고 결제까지 가 버리는 일을 막는다.
 */
export default async function MansePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const self = `/readings/${params.id}/manse`;
  const user = await getCurrentUser();
  if (!user) redirect(loginUrl(self));

  const repo = getRepository();
  const reading = await repo.getReading(params.id);
  if (!reading || reading.userId !== user.id) notFound();

  const report = await loadReport(reading.reportSlug);
  if (!report) notFound();

  // 이미 산 사람은 여기 머물 이유가 없다
  if (report.kind === "report" && (await repo.getPurchase(user.id, report.slug))) {
    redirect(`/reports/${report.slug}/read`);
  }

  const modules = mergedModules(reading.sazu ?? {});
  const pillars = parseFourPillars(modules);
  const counts = parseElementCounts(modules);
  const decadeData = parseDecadeFortune(modules);
  const age = internationalAge(
    { year: reading.subject.birthYear, month: reading.subject.birthMonth, day: reading.subject.birthDay },
    (() => {
      const now = new Date();
      return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
    })(),
  );

  const facts: ManseFact[] = [];
  const dayStem = str(at(modules, "fourPillars.day.sky"));
  if (dayStem) {
    facts.push({ label: "일간", value: `${dayStem} · ${str(at(modules, "fourPillars.day.skyFull")) ?? ""}`.trim(), hint: GLOSSARY.일간 });
  }
  const strength = str(at(modules, "sinStrength.strength"));
  if (strength) facts.push({ label: "신강약", value: strength, hint: GLOSSARY[strength] });
  const gyeokguk = str(at(modules, "gyeokguk.name"));
  if (gyeokguk) facts.push({ label: "격국", value: gyeokguk, hint: GLOSSARY.격국 });
  const yong = str(at(modules, "yongsin.yongsin.ko"));
  if (yong) {
    const hui = str(at(modules, "yongsin.huisin.ko"));
    const gi = str(at(modules, "yongsin.gisin.ko"));
    facts.push({
      label: "용신",
      value: [`용신 ${yong}`, hui && `희신 ${hui}`, gi && `기신 ${gi}`].filter(Boolean).join(" · "),
      hint: GLOSSARY.용신,
    });
  }
  const sinsal = [
    ...((at(modules, "sinsal.angels") as Array<{ name?: string }> | undefined) ?? []),
    ...((at(modules, "sinsal.devils") as Array<{ name?: string }> | undefined) ?? []),
  ]
    .map((item) => item.name)
    .filter((name): name is string => Boolean(name));
  if (sinsal.length > 0) facts.push({ label: "신살", value: sinsal.join(", "), hint: GLOSSARY.신살 });

  // 계산 기준을 사람이 읽을 문장으로 옮긴다. 진태양시 보정처럼 "왜 이 글자가 나왔는지"를
  // 설명해 주는 값이라, 명식이 예상과 다를 때 확인할 수 있어야 한다.
  const raw = (at(modules, "basis") ?? {}) as {
    solarDate?: string;
    clockTime?: string | null;
    trueSolarTime?: string | null;
    solarTimeOffsetMinutes?: number;
    city?: string;
    dayChangedByNightZi?: boolean;
  };
  const basis = [
    raw.solarDate ? `양력 ${raw.solarDate}${raw.clockTime ? ` ${raw.clockTime}` : " (시간 미상)"} 기준` : null,
    raw.trueSolarTime && typeof raw.solarTimeOffsetMinutes === "number"
      ? `${raw.city ?? "서울"} 진태양시 ${raw.solarTimeOffsetMinutes}분 보정 → ${raw.trueSolarTime}`
      : null,
    raw.dayChangedByNightZi ? "23시 이후 출생이라 야자시로 보아 다음 날로 넘겼습니다" : null,
    "연주·월주는 절기로, 일주·시주는 현지 시각으로 가릅니다",
  ].filter((line): line is string => Boolean(line));

  return (
    <div className="flex w-full flex-col gap-space-lg py-space-md">
      <Link
        href={`/reports/${report.slug}`}
        className="flex items-center gap-1 font-label-md text-label-md text-on-surface-variant transition-colors hover:text-on-surface"
      >
        <Icon name="chevron_left" className="text-[18px]" /> 입력 정보 수정
      </Link>

      {searchParams.error === "payment" && (
        <p className="rounded-lg bg-error-container/30 p-space-sm font-body-sm text-body-sm text-on-surface">
          결제를 마치지 못했어요. 다시 시도해 주세요.
        </p>
      )}

      <ManseSheet
        name={reading.subject.name}
        birthLine={`${describeBirth(reading.subject)} · 만 ${age}세`}
        entered={[
          { label: "이름", value: reading.subject.name },
          {
            label: "생년월일",
            value: `${reading.subject.birthYear}년 ${reading.subject.birthMonth}월 ${reading.subject.birthDay}일 (${
              reading.subject.isLunar ? `음력${reading.subject.isLeapMonth ? " 윤달" : ""}` : "양력"
            })`,
          },
          {
            label: "태어난 시각",
            value:
              reading.subject.birthHour === null
                ? "모름 — 시주를 뺀 세 기둥으로 읽어요"
                : `${String(reading.subject.birthHour).padStart(2, "0")}:${String(reading.subject.birthMinute ?? 0).padStart(2, "0")}`,
          },
          { label: "성별", value: reading.subject.isFemale ? "여성" : "남성" },
          { label: "태어난 곳", value: reading.subject.birthCity },
        ]}
        editHref={`/reports/${report.slug}`}
        pillars={pillars}
        counts={counts}
        decade={
          decadeData
            ? {
                items: decadeData.items,
                currentIndex: findCurrentDecadeIndex(decadeData.items, age),
                direction: decadeData.direction ?? null,
              }
            : null
        }
        facts={facts}
        basis={basis}
      />

      <ManseConfirm
        readingId={reading.id}
        slug={report.slug}
        title={report.title}
        categoryLabel={report.categoryLabel}
        price={report.price}
        originalPrice={report.originalPrice ?? null}
        chapterCount={report.chapters.length}
      />
    </div>
  );
}
