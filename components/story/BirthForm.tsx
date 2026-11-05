"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import { koreanLunarToSolar } from "@/lib/manse/calendar";
import type { BirthProfile } from "@/lib/db/types";
import { writeLocalProfile } from "@/lib/me/local-profile";
import birthCities from "@/lib/saju/birth-cities.json";

/**
 * 누구의 생일을 묻는지.
 *
 * 한동안 어느 쪽이든 "이름은…" 한 마디로 물었다. 궁합·재회·부모자녀 상품에서는 같은
 * 양식이 두 번 나오는데, 두 번째 화면에도 "이름은…" 이 떠 있으니 누구 이름을 적으라는
 * 말인지 알 수 없었다. 묻는 대상을 문장에 박아 넣는다.
 */
export type BirthSubject = "self" | "partner" | "child" | "parent";

const SUBJECT_WORDS: Record<BirthSubject, {
  /** 단계 제목 — "그 사람의 이름을 알려 주세요" */
  steps: [string, string, string, string, string];
  nameLabel: string;
  namePlaceholder: string;
  nameHint: string;
  missingName: string;
}> = {
  self: {
    steps: ["이름을 알려 주세요", "태어난 날을 알려 주세요", "성별을 골라 주세요", "태어난 시간을 알려 주세요", "태어난 곳을 알려 주세요"],
    nameLabel: "풀이에서 어떻게 불러 드릴까요",
    namePlaceholder: "내 이름 또는 불리고 싶은 호칭",
    nameHint: "본명이 아니어도 괜찮아요. 풀이에서 당신을 부를 이름이에요.",
    missingName: "이름(또는 불리고 싶은 호칭)을 적어 주세요.",
  },
  partner: {
    steps: ["그 사람의 이름을 알려 주세요", "그 사람이 태어난 날을 알려 주세요", "그 사람의 성별을 골라 주세요", "그 사람이 태어난 시간을 알려 주세요", "그 사람이 태어난 곳을 알려 주세요"],
    nameLabel: "그 사람을 무엇이라고 부를까요",
    namePlaceholder: "그 사람의 이름 또는 부르는 호칭",
    nameHint: "본명을 몰라도 괜찮아요. 풀이에서 그 사람을 가리킬 이름이에요.",
    missingName: "그 사람의 이름(또는 부르는 호칭)을 적어 주세요.",
  },
  child: {
    steps: ["아이의 이름을 알려 주세요", "아이가 태어난 날을 알려 주세요", "아이의 성별을 골라 주세요", "아이가 태어난 시간을 알려 주세요", "아이가 태어난 곳을 알려 주세요"],
    nameLabel: "아이를 무엇이라고 부를까요",
    namePlaceholder: "아이의 이름 또는 부르는 호칭",
    nameHint: "본명이 아니어도 괜찮아요. 풀이에서 아이를 부를 이름이에요.",
    missingName: "아이의 이름(또는 부르는 호칭)을 적어 주세요.",
  },
  parent: {
    steps: ["부모님(나)의 이름을 알려 주세요", "태어난 날을 알려 주세요", "성별을 골라 주세요", "태어난 시간을 알려 주세요", "태어난 곳을 알려 주세요"],
    nameLabel: "풀이에서 어떻게 불러 드릴까요",
    namePlaceholder: "내 이름 또는 불리고 싶은 호칭",
    nameHint: "아이가 아니라, 아이를 보는 부모님의 생일이에요.",
    missingName: "이름(또는 불리고 싶은 호칭)을 적어 주세요.",
  },
};

interface BirthFormProps {
  cinematic?: boolean;
  onStepChange?: (step: number) => void;
  title: string;
  /** 누구의 생일인지 — 묻는 문장과 안내가 이 값에 따라 바뀐다 */
  subject?: BirthSubject;
  submitLabel?: string;
  initial?: Partial<BirthProfile>;
  onSubmit: (profile: BirthProfile) => void;
  onSkip?: () => void;
  /**
   * 이 사람이 "나"인가.
   *
   * 같은 양식으로 아이·상대의 생일도 받는다. 그건 내가 아니므로 기억해 두면 안 된다
   * — 다음에 홈에 들렀을 때 아이의 원국이 내 것인 양 펼쳐지면 곤란하다.
   */
  remember?: boolean;
}

/**
 * 태어난 곳 — 쳐서 찾는다.
 *
 * 229곳을 담은 드롭다운이었다. 데스크톱에서는 그럭저럭이지만 폰에서는 손가락으로
 * 한참을 굴려야 하고, 내가 찾는 곳이 어느 묶음에 있는지도 모른다.
 *
 * 글자를 치면 맞는 곳만 추려 보여 준다. "부"만 쳐도 부산·부천·부여가 나온다. 아무것도
 * 안 치면 많이 쓰는 곳 몇 개를 먼저 보여 줘서, 서울 사람은 한 번에 끝난다.
 *
 * 직접 적게 두지는 않는다. 우리가 경도를 모르는 이름이 들어오면 계산은 서울로 떨어지는데
 * 화면에는 적어 넣은 곳이 그대로 남아, 서울로 계산한 것을 그 도시로 계산한 것처럼
 * 보여 주게 된다. 목록에 없으면 「목록에 없어요」를 고르게 한다.
 */
const POPULAR = ["서울", "부산", "인천", "대구", "대전", "광주", "수원", "제주"];

function CityPicker({ value, onChange }: { value: string; onChange: (city: string) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const all = useMemo(() => birthCities.flatMap((group) => group.cities.map((name) => ({ name, region: group.region }))), []);

  const matches = useMemo(() => {
    const keyword = query.trim();
    if (!keyword) return all.filter((item) => POPULAR.includes(item.name)).slice(0, 8);
    return all.filter((item) => item.name.includes(keyword) || item.region.includes(keyword)).slice(0, 12);
  }, [query, all]);

  return (
    <div className="relative flex flex-col gap-1">
      <span className="font-label-sm text-label-sm text-on-surface-variant">태어난 곳</span>
      <input
        type="text"
        inputMode="search"
        aria-label="태어난 곳"
        value={open ? query : value}
        placeholder="도시 이름을 적어 보세요"
        onFocus={() => {
          setQuery("");
          setOpen(true);
        }}
        onChange={(event) => setQuery(event.target.value)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        className={FIELD}
      />
      {open && (
        <ul className="city-options absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-lg border border-outline-variant/60 bg-surface-container-high shadow-2xl">
          {matches.map((item) => (
            <li key={item.name}>
              <button
                type="button"
                // onBlur 보다 먼저 잡아야 목록이 닫히기 전에 고를 수 있다
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(item.name);
                  setOpen(false);
                }}
                className="flex w-full items-baseline gap-space-sm px-space-md py-2.5 text-left transition-colors hover:bg-surface-bright"
              >
                <span className="font-body-md text-body-md text-on-surface">{item.name}</span>
                <span className="font-label-sm text-label-sm text-outline">{item.region}</span>
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange("서울");
                setOpen(false);
              }}
              className="w-full border-t border-outline-variant/40 px-space-md py-2.5 text-left font-label-sm text-label-sm text-outline transition-colors hover:bg-surface-bright"
            >
              목록에 없어요 — 서울 기준으로 계산
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}

const FIELD =
  "w-full rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-space-sm py-2.5 font-body-md text-body-md text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/60";

export const CINEMATIC_BIRTH_STEPS = 5;

/**
 * "14:25" → { hour: 14, minute: 25 }. 모양이 아니면 null.
 *
 * 전에는 `time.split(":")` 한 뒤 그대로 Number 에 넣었다. 시각 칸이 비어 있으면
 * (<input type="time"> 은 지우면 빈 문자열이 된다) 분이 undefined 가 되고,
 * Number(undefined) 는 NaN 이다. 그 NaN 이 그대로 서버까지 가서 "입력하신 내용을
 * 다시 확인해 주세요"로 돌아왔다 — 어디를 확인하라는 말인지 알 길이 없는 오류였다.
 *
 * 뒤로 갔다 다시 적을 때 특히 잘 났다. 양식이 다시 그려지면서 시각 칸이 비는 자리가
 * 있었기 때문이다. 이제 보내기 전에 여기서 걸러 내고, 어느 칸이 문제인지 말해 준다.
 */
export function parseClockTime(time: string): { hour: number; minute: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;
  const hour = Number.parseInt(match[1]!, 10);
  const minute = Number.parseInt(match[2]!, 10);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

/** 그 해 그 달이 며칠까지 있는지 */
const daysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();

/**
 * "19950312" → { year, month, day }. 달력에 없는 날이면 null.
 *
 * 음력은 달마다 29일이거나 30일이라, 양력 달 길이로 재면 없는 날을 통과시킨다.
 * 음력일 때는 실제 그 달이 며칠까지 있는지 달력에 물어본다.
 */
function parseBirthDate(digits: string, isLunar: boolean, isLeap: boolean) {
  if (digits.length !== 8) return null;
  const year = Number(digits.slice(0, 4));
  const month = Number(digits.slice(4, 6));
  const day = Number(digits.slice(6, 8));
  const thisYear = new Date().getFullYear();
  if (year < 1900 || year > thisYear) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1) return null;

  if (!isLunar) return day <= daysInMonth(year, month) ? { year, month, day } : null;

  const solar = koreanLunarToSolar(year, month, day, isLeap);
  return solar ? { year, month, day, solar: `${solar.year}.${solar.month}.${solar.day}` } : null;
}

/** 적어 둔 여덟 자를 사람이 읽는 말로 */
const describeDigits = (digits: string) =>
  [digits.slice(0, 4), digits.slice(4, 6), digits.slice(6, 8)].filter(Boolean).join(".");

function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-flow-col gap-1 rounded-lg bg-surface-container-lowest p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-md py-2.5 font-label-md text-label-md transition-colors",
            value === option.value ? "bg-surface-container-highest text-on-surface" : "text-on-surface-variant",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/**
 * 생년월일시 입력.
 *
 * 전에는 드롭다운이 여섯 개였다 — 연·월·일·시·분·도시. 아흔여섯 해와 예순 개의 분을
 * 폰에서 굴려 고르게 하는 건 결제 직전에 놓기에 가장 나쁜 모양이다. 2월 31일도 고를 수
 * 있었고, 그 틀림은 결제가 끝난 뒤에야 드러났다.
 *
 * 세 가지를 바꿨다.
 *  · 한 번에 하나씩 묻는다. 여섯 칸이 한꺼번에 깔리면 손이 멈춘다.
 *  · 날짜는 숫자로 바로 친다. 아는 사람은 여덟 자를 치는 게 가장 빠르다.
 *  · 달력에 없는 날은 그 자리에서 막는다. 결제 뒤에 알려 주는 건 늦다.
 */
export function BirthForm({
  cinematic = false,
  onStepChange,
  title,
  subject: subjectRole = "self",
  submitLabel = "다 적었어요",
  initial,
  onSubmit,
  onSkip,
  remember = false,
}: BirthFormProps) {
  const id = useId();
  const words = SUBJECT_WORDS[subjectRole];
  const [step, setStep] = useState(0);
  useEffect(() => { onStepChange?.(step); }, [step, onStepChange]);

  const [name, setName] = useState(initial?.name ?? "");
  const [digits, setDigits] = useState(
    initial?.birthYear
      ? `${initial.birthYear}${String(initial.birthMonth ?? 1).padStart(2, "0")}${String(initial.birthDay ?? 1).padStart(2, "0")}`
      : "",
  );
  const [calendar, setCalendar] = useState<"solar" | "lunar">(initial?.isLunar ? "lunar" : "solar");
  const [leap, setLeap] = useState(initial?.isLeapMonth ?? false);
  const [knowsTime, setKnowsTime] = useState(initial?.birthHour !== null);
  const [time, setTime] = useState(
    initial?.birthHour != null
      ? `${String(initial.birthHour).padStart(2, "0")}:${String(initial.birthMinute ?? 0).padStart(2, "0")}`
      : cinematic ? "" : "12:00",
  );
  const [gender, setGender] = useState<"female" | "male" | "">(initial?.isFemale == null ? (cinematic ? "" : "female") : initial.isFemale ? "female" : "male");
  const [city, setCity] = useState(initial?.birthCity ?? "서울");
  const [error, setError] = useState<string | null>(null);

  const date = useMemo(() => parseBirthDate(digits, calendar === "lunar", leap), [digits, calendar, leap]);
  const dateTyped = digits.length === 8;

  const STEPS = [
    { key: "name", label: "이름" },
    { key: "birth", label: "생년월일" },
    ...(cinematic ? [{ key: "gender", label: "성별" }, { key: "time", label: "태어난 시간" }, { key: "city", label: "태어난 곳" }] : [{ key: "rest", label: "시간·성별" }]),
  ];
  const lastStep = STEPS.length - 1;

  const next = () => {
    if (step === 0) {
      if (!name.trim()) return setError(words.missingName);
      setError(null);
      return setStep(1);
    }
    if (step === 1) {
      if (!dateTyped) return setError("생년월일 여덟 자리를 적어 주세요. (예: 19950312)");
      if (!date) return setError(calendar === "lunar" ? "음력 날짜나 윤달 여부가 맞지 않아요. 다시 확인해 주세요." : "달력에 없는 날이에요. 다시 확인해 주세요.");
      setError(null);
      return setStep(2);
    }
    if (cinematic && step === 2) {
      if (!gender) return setError("성별을 골라 주세요.");
      setError(null);
      return setStep(3);
    }
    if (cinematic && step === 3) {
      if (knowsTime && !parseClockTime(time)) return setError("태어난 시각을 입력해 주세요. 모르시면 ‘몰라요’를 눌러 주세요.");
      setError(null);
      return setStep(4);
    }
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (step < lastStep) return next();
    if (!name.trim() || !date || !gender) {
      setError("빠진 곳이 있어요. 앞으로 돌아가 확인해 주세요.");
      return;
    }
    const clock = parseClockTime(time);
    if (knowsTime && !clock) {
      setError("태어난 시각을 다시 확인해 주세요. 모르시면 ‘몰라요’를 눌러 주세요.");
      return;
    }
    const profile: BirthProfile = {
      name: name.trim(),
      birthYear: date.year,
      birthMonth: date.month,
      birthDay: date.day,
      birthHour: knowsTime ? clock!.hour : null,
      birthMinute: knowsTime ? clock!.minute : undefined,
      isFemale: gender === "female",
      isLunar: calendar === "lunar",
      isLeapMonth: calendar === "lunar" ? leap : undefined,
      birthCity: city,
    };
    // 다음에 홈에 들렀을 때 목록 대신 자기 원국부터 보이게 한다
    if (remember) writeLocalProfile(profile);
    onSubmit(profile);
  };

  return (
    <form
      onSubmit={submit}
      className={cn("flex flex-col gap-space-md motion-safe:animate-fade-up", cinematic ? "intake-form" : "rounded-xl bg-surface-container p-space-lg shadow-lg")}
    >
      <div className="flex items-center justify-between">
        <h3 className={cinematic ? "text-[1.6rem] font-extrabold leading-snug text-white" : "font-label-md text-label-md text-on-surface"}>{cinematic ? words.steps[step] : title}</h3>
        {/* 어디쯤 왔는지 — 세 칸이면 끝이 보인다 */}
        {!(cinematic && onStepChange) && <span className="flex items-center gap-1" aria-label={`${step + 1} / ${STEPS.length} 단계`}>
          {STEPS.map((item, index) => (
            <span
              key={item.key}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                index === step ? "w-5 bg-on-surface" : index < step ? "w-1.5 bg-tertiary" : "w-1.5 bg-outline-variant",
              )}
            />
          ))}
        </span>}
      </div>

      {step === 0 && (
        <label className="flex flex-col gap-1" htmlFor={`${id}-name`}>
          <span className="font-label-sm text-label-sm text-on-surface-variant">{words.nameLabel}</span>
          <input
            id={`${id}-name`}
            className={FIELD}
            value={name}
            maxLength={20}
            autoFocus
            enterKeyHint="next"
            placeholder={words.namePlaceholder}
            onChange={(event) => {
              setName(event.target.value);
              setError(null);
            }}
          />
          <span className="font-body-sm text-body-sm text-outline">{words.nameHint}</span>
        </label>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-space-sm">
          <Segmented
            label="양력 음력"
            value={calendar}
            onChange={setCalendar}
            options={[
              { value: "solar", label: "양력" },
              { value: "lunar", label: "음력" },
            ]}
          />
          <label className="flex flex-col gap-1" htmlFor={`${id}-date`}>
            <span className="font-label-sm text-label-sm text-on-surface-variant">생년월일 여덟 자리</span>
            {/*
              한동안 치는 동안에도 값을 "1995.03.1" 처럼 다시 찍어 보여 줬다. 보기에는 친절한데,
              글자를 칠 때마다 값이 통째로 바뀌는 입력칸이라 폰에서는 커서가 맨 앞으로 튄다.
              그 다음 숫자가 앞에 붙으면서 "입력이 안 된다" 가 된다.
              그래서 칸에는 손이 친 여덟 자를 그대로 두고, 읽는 말은 아래 줄에서 만든다.
            */}
            <input
              id={`${id}-date`}
              className={cn(FIELD, "text-center font-headline-sm text-headline-sm tracking-[0.3em]")}
              value={digits}
              inputMode="numeric"
              // iOS 는 inputMode 만으로는 전체 자판을 띄우는 경우가 있다. pattern 까지 있어야 숫자 키패드로 연다.
              pattern="[0-9]*"
              maxLength={8}
              autoComplete="off"
              autoFocus
              enterKeyHint="next"
              placeholder="19950312"
              aria-describedby={`${id}-date-help`}
              onChange={(event) => {
                setDigits(event.target.value.replace(/\D/g, "").slice(0, 8));
                setError(null);
              }}
            />
            <span id={`${id}-date-help`} className="font-body-sm text-body-sm text-outline">
              {dateTyped && date
                ? calendar === "lunar" && "solar" in date && date.solar
                  ? `음력 ${date.year}.${date.month}.${date.day}${leap ? " (윤달)" : ""} = 양력 ${date.solar}`
                  : `${date.year}년 ${date.month}월 ${date.day}일 (양력)`
                : dateTyped
                  ? calendar === "lunar" ? "한국 음력 기준으로 날짜와 윤달 여부를 확인해 주세요." : "달력에 없는 날짜예요. 다시 확인해 주세요."
                : digits
                  ? `${describeDigits(digits)}… 여덟 자리를 채워 주세요`
                  : "숫자만 눌러 주세요. 1995년 3월 12일이면 19950312"}
            </span>
          </label>
          {calendar === "lunar" && (
            <label className="flex items-center gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
              <input type="checkbox" checked={leap} onChange={(e) => setLeap(e.target.checked)} className="accent-primary" />
              윤달에 태어났어요
            </label>
          )}
        </div>
      )}

      {cinematic && step === 2 && <div className="grid grid-cols-2 gap-space-sm">
        {([{ value: "female", label: "여성이에요" }, { value: "male", label: "남성이에요" }] as const).map(option => <button
          key={option.value} type="button" aria-pressed={gender === option.value}
          onClick={() => { setGender(option.value); setError(null); setStep(3); }}
          className="intake-choice rounded-xl border border-white/20 bg-white/5 px-space-md py-space-lg font-body-md text-body-md text-white hover:border-primary/70 hover:bg-primary/10">
          {option.label}
        </button>)}
      </div>}

      {(cinematic ? step >= 3 : step === lastStep) && (
        <div className="flex flex-col gap-space-md">
          {(!cinematic || step === 3) && <div className="flex flex-col gap-1">
            <span className="font-label-sm text-label-sm text-on-surface-variant">태어난 시간</span>
            <div className="flex gap-space-xs">
              <input
                type="time"
                aria-label="태어난 시각"
                className={cn(FIELD, "flex-1", !knowsTime && "opacity-40")}
                value={time}
                disabled={!knowsTime}
                onChange={(event) => { setTime(event.target.value); setError(null); }}
              />
              <button
                type="button"
                aria-pressed={!knowsTime}
                onClick={() => { setKnowsTime((value) => !value); setError(null); }}
                className={cn(
                  "shrink-0 rounded-lg px-space-md font-label-md text-label-md transition-colors",
                  knowsTime ? "bg-surface-container-lowest text-on-surface-variant" : "bg-surface-container-highest text-on-surface",
                )}
              >
                몰라요
              </button>
            </div>
            <span className="font-body-sm text-body-sm text-outline">
              {knowsTime
                ? "태어난 곳에 맞춰 시간을 보정해 계산해요."
                : "시간과 관련된 부분은 빼고, 알 수 있는 내용부터 읽어요."}
            </span>
          </div>}

          {(!cinematic || step === 4) && <div className={cn(!cinematic && "grid grid-cols-2 gap-space-sm")}>
            {!cinematic && <div className="flex flex-col gap-1">
              <span className="font-label-sm text-label-sm text-on-surface-variant">성별</span>
              <Segmented
                label="성별"
                value={gender}
                onChange={setGender}
                options={[
                  { value: "female", label: "여성" },
                  { value: "male", label: "남성" },
                ]}
              />
            </div>}
            <CityPicker value={city} onChange={setCity} />
          </div>}

          {/* 적은 것을 한 번에 되짚어 준다 — 고치려면 지금이 마지막이다 */}
          {!cinematic && <dl className="flex flex-col gap-1 rounded-lg bg-surface-container-lowest p-space-md font-body-sm text-body-sm">
            <div className="flex gap-space-sm">
              <dt className="w-16 shrink-0 text-outline">{subjectRole === "partner" ? "그 사람" : subjectRole === "child" ? "아이" : "이름"}</dt>
              <dd className="text-on-surface">{name || "—"}</dd>
            </div>
            <div className="flex gap-space-sm">
              <dt className="w-16 shrink-0 text-outline">생년월일</dt>
              <dd className="text-on-surface">
                {date ? `${date.year}.${date.month}.${date.day}` : "—"}
                <span className="ml-1 text-outline">{calendar === "lunar" ? `음력${leap ? " 윤달" : ""}` : "양력"}</span>
              </dd>
            </div>
            <div className="flex gap-space-sm">
              <dt className="w-16 shrink-0 text-outline">시간</dt>
              <dd className="text-on-surface">{knowsTime ? time || "시각을 입력해 주세요" : "모름"} · {gender === "female" ? "여성" : "남성"}</dd>
            </div>
          </dl>}
        </div>
      )}

      {error && <p className="font-body-sm text-body-sm text-error">{error}</p>}

      <div className={cn("flex gap-space-sm", cinematic && "intake-actions")}>
        {step > 0 ? (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setStep((value) => value - 1);
            }}
            className="rounded-xl bg-surface-container-highest px-space-lg py-3 font-label-md text-label-md text-on-surface-variant"
          >
            <Icon name="arrow_back" className="text-[18px]" />
            <span className="sr-only">이전</span>
          </button>
        ) : (
          onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="flex-1 rounded-xl bg-surface-container-highest py-3 font-label-md text-label-md text-on-surface-variant"
            >
              건너뛰기
            </button>
          )
        )}
        {!(cinematic && step === 2) && <button
          type="submit"
          className="product-button flex-[2] rounded-xl bg-on-surface py-3 font-label-md text-label-md text-surface transition-transform active:scale-[0.98]"
        >
          {step < lastStep ? "다음" : submitLabel}
        </button>}
      </div>
    </form>
  );
}
