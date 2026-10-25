"use client";

import { useId, useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import type { BirthProfile } from "@/lib/db/types";
import birthCities from "@/lib/saju/birth-cities.json";

interface BirthFormProps {
  title: string;
  submitLabel?: string;
  initial?: Partial<BirthProfile>;
  onSubmit: (profile: BirthProfile) => void;
  onSkip?: () => void;
}

const FIELD =
  "w-full rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-space-sm py-2.5 font-body-md text-body-md text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/60";

/** 그 해 그 달이 며칠까지 있는지 */
const daysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();

/** "19950312" → { year, month, day }. 달력에 없는 날이면 null */
function parseBirthDate(digits: string) {
  if (digits.length !== 8) return null;
  const year = Number(digits.slice(0, 4));
  const month = Number(digits.slice(4, 6));
  const day = Number(digits.slice(6, 8));
  const thisYear = new Date().getFullYear();
  if (year < 1900 || year > thisYear) return null;
  if (month < 1 || month > 12) return null;
  // 음력은 윤달 때문에 양력 달력보다 하루 모자랄 수 있어 30일까지는 받아 준다
  if (day < 1 || day > Math.max(daysInMonth(year, month), 30)) return null;
  return { year, month, day };
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
export function BirthForm({ title, submitLabel = "다 적었어요", initial, onSubmit, onSkip }: BirthFormProps) {
  const id = useId();
  const [step, setStep] = useState(0);

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
      : "12:00",
  );
  const [gender, setGender] = useState<"female" | "male">(initial?.isFemale === false ? "male" : "female");
  const [city, setCity] = useState(initial?.birthCity ?? "서울");
  const [error, setError] = useState<string | null>(null);

  const date = useMemo(() => parseBirthDate(digits), [digits]);
  const dateTyped = digits.length === 8;

  const STEPS = [
    { key: "name", label: "이름" },
    { key: "birth", label: "생년월일" },
    { key: "rest", label: "시간·성별" },
  ] as const;

  const next = () => {
    if (step === 0) {
      if (!name.trim()) return setError("이름(또는 불리고 싶은 호칭)을 적어 주세요.");
      setError(null);
      return setStep(1);
    }
    if (step === 1) {
      if (!dateTyped) return setError("생년월일 여덟 자리를 적어 주세요. (예: 19950312)");
      if (!date) return setError("달력에 없는 날이에요. 다시 확인해 주세요.");
      setError(null);
      return setStep(2);
    }
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (step < 2) return next();
    if (!name.trim() || !date) {
      setError("빠진 곳이 있어요. 앞으로 돌아가 확인해 주세요.");
      return;
    }
    const [hourText, minuteText] = time.split(":");
    onSubmit({
      name: name.trim(),
      birthYear: date.year,
      birthMonth: date.month,
      birthDay: date.day,
      birthHour: knowsTime ? Number(hourText) : null,
      birthMinute: knowsTime ? Number(minuteText) : undefined,
      isFemale: gender === "female",
      isLunar: calendar === "lunar",
      isLeapMonth: calendar === "lunar" ? leap : undefined,
      birthCity: city,
    });
  };

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-space-md rounded-xl bg-surface-container p-space-lg shadow-lg motion-safe:animate-fade-up"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-label-md text-label-md text-on-surface">{title}</h3>
        {/* 어디쯤 왔는지 — 세 칸이면 끝이 보인다 */}
        <span className="flex items-center gap-1" aria-label={`${step + 1} / ${STEPS.length} 단계`}>
          {STEPS.map((item, index) => (
            <span
              key={item.key}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                index === step ? "w-5 bg-on-surface" : index < step ? "w-1.5 bg-tertiary" : "w-1.5 bg-outline-variant",
              )}
            />
          ))}
        </span>
      </div>

      {step === 0 && (
        <label className="flex flex-col gap-1" htmlFor={`${id}-name`}>
          <span className="font-label-sm text-label-sm text-on-surface-variant">어떻게 불러 드릴까요</span>
          <input
            id={`${id}-name`}
            className={FIELD}
            value={name}
            maxLength={20}
            autoFocus
            enterKeyHint="next"
            placeholder="이름 또는 불리고 싶은 호칭"
            onChange={(event) => {
              setName(event.target.value);
              setError(null);
            }}
          />
          <span className="font-body-sm text-body-sm text-outline">본명이 아니어도 괜찮아요. 풀이에서 부를 이름이에요.</span>
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
                ? `${date.year}년 ${date.month}월 ${date.day}일 (${calendar === "lunar" ? "음력" : "양력"})`
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

      {step === 2 && (
        <div className="flex flex-col gap-space-md">
          <div className="flex flex-col gap-1">
            <span className="font-label-sm text-label-sm text-on-surface-variant">태어난 시간</span>
            <div className="flex gap-space-xs">
              <input
                type="time"
                aria-label="태어난 시각"
                className={cn(FIELD, "flex-1", !knowsTime && "opacity-40")}
                value={time}
                disabled={!knowsTime}
                onChange={(event) => setTime(event.target.value)}
              />
              <button
                type="button"
                aria-pressed={!knowsTime}
                onClick={() => setKnowsTime((value) => !value)}
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
                ? "태어난 지역의 실제 태양 시각으로 바로잡아 계산해요."
                : "시간을 몰라도 괜찮아요. 시주를 뺀 세 기둥으로 읽어 드려요."}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-space-sm">
            <div className="flex flex-col gap-1">
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
            </div>
            <label className="flex flex-col gap-1">
              <span className="font-label-sm text-label-sm text-on-surface-variant">태어난 곳</span>
              <select aria-label="태어난 곳" className={FIELD} value={city} onChange={(e) => setCity(e.target.value)}>
                {birthCities.map((group) => (
                  <optgroup key={group.region} label={group.region}>
                    {group.cities.map((cityName) => (
                      <option key={cityName} value={cityName}>
                        {cityName}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
          </div>

          {/* 적은 것을 한 번에 되짚어 준다 — 고치려면 지금이 마지막이다 */}
          <dl className="flex flex-col gap-1 rounded-lg bg-surface-container-lowest p-space-md font-body-sm text-body-sm">
            <div className="flex gap-space-sm">
              <dt className="w-16 shrink-0 text-outline">이름</dt>
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
              <dd className="text-on-surface">{knowsTime ? time : "모름"}</dd>
            </div>
          </dl>
        </div>
      )}

      {error && <p className="font-body-sm text-body-sm text-error">{error}</p>}

      <div className="flex gap-space-sm">
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
        <button
          type="submit"
          className="flex-[2] rounded-xl bg-on-surface py-3 font-label-md text-label-md text-surface transition-transform active:scale-[0.98]"
        >
          {step < 2 ? "다음" : submitLabel}
        </button>
      </div>
    </form>
  );
}
