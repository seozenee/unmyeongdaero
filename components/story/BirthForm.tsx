"use client";

import { useId, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import type { BirthProfile } from "@/lib/db/types";
import birthCities from "@/lib/saju/birth-cities.json";
import { SAZU_SAMPLE_PROFILES } from "@/lib/sazu/sample-profiles";

interface BirthFormProps {
  title: string;
  submitLabel?: string;
  initial?: Partial<BirthProfile>;
  /** sazu Free 샌드박스면 샘플 명식 칩을 보여준다 */
  sandbox?: boolean;
  onSubmit: (profile: BirthProfile) => void;
  onSkip?: () => void;
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1929 }, (_, index) => CURRENT_YEAR - index);
const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);
const DAYS = Array.from({ length: 31 }, (_, index) => index + 1);
const HOURS = Array.from({ length: 24 }, (_, index) => index);
const MINUTES = Array.from({ length: 60 }, (_, index) => index);

const FIELD =
  "w-full rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-space-sm py-2.5 font-body-md text-body-md text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/60";

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
            "rounded-md py-2 font-label-md text-label-md transition-colors",
            value === option.value ? "bg-surface-container-highest text-on-surface" : "text-on-surface-variant",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function BirthForm({ title, submitLabel = "다 적었어요", initial, sandbox, onSubmit, onSkip }: BirthFormProps) {
  const id = useId();
  const [name, setName] = useState(initial?.name ?? "");
  const [year, setYear] = useState(initial?.birthYear ?? 1995);
  const [month, setMonth] = useState(initial?.birthMonth ?? 1);
  const [day, setDay] = useState(initial?.birthDay ?? 1);
  const [calendar, setCalendar] = useState<"solar" | "lunar">(initial?.isLunar ? "lunar" : "solar");
  const [leap, setLeap] = useState(initial?.isLeapMonth ?? false);
  const [hour, setHour] = useState<number | null>(initial?.birthHour === undefined ? 12 : initial.birthHour);
  const [minute, setMinute] = useState(initial?.birthMinute ?? 0);
  const [gender, setGender] = useState<"female" | "male">(initial?.isFemale === false ? "male" : "female");
  const [city, setCity] = useState(initial?.birthCity ?? "서울");
  const [error, setError] = useState<string | null>(null);

  const fillSample = (profile: BirthProfile) => {
    setName(profile.name);
    setYear(profile.birthYear);
    setMonth(profile.birthMonth);
    setDay(profile.birthDay);
    setCalendar(profile.isLunar ? "lunar" : "solar");
    setLeap(false);
    setHour(profile.birthHour);
    setMinute(profile.birthMinute ?? 0);
    setGender(profile.isFemale ? "female" : "male");
    setCity(profile.birthCity);
    setError(null);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("이름(또는 불리고 싶은 호칭)을 적어 주세요.");
      return;
    }
    onSubmit({
      name: name.trim(),
      birthYear: year,
      birthMonth: month,
      birthDay: day,
      birthHour: hour,
      birthMinute: hour === null ? undefined : minute,
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
        <Icon name="edit_note" className="text-[20px] text-outline" />
      </div>

      {sandbox && (
        <div className="flex flex-col gap-space-xs rounded-lg bg-tertiary/10 p-space-sm">
          <span className="font-label-sm text-label-sm text-tertiary">
            체험용 분석 키 연결 중 · 아래 샘플 명식으로만 풀이할 수 있어요
          </span>
          <div className="no-scrollbar -mx-space-sm flex gap-space-xs overflow-x-auto px-space-sm">
            {SAZU_SAMPLE_PROFILES.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => fillSample(sample.profile)}
                className="shrink-0 rounded-full bg-surface-container-highest px-space-sm py-1 font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface"
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <label className="flex flex-col gap-1" htmlFor={`${id}-name`}>
        <span className="font-label-sm text-label-sm text-on-surface-variant">이름</span>
        <input
          id={`${id}-name`}
          className={FIELD}
          value={name}
          maxLength={20}
          placeholder="이름 또는 불리고 싶은 호칭"
          onChange={(event) => setName(event.target.value)}
        />
      </label>

      <div className="flex flex-col gap-1">
        <span className="font-label-sm text-label-sm text-on-surface-variant">생년월일</span>
        <Segmented
          label="양력 음력"
          value={calendar}
          onChange={setCalendar}
          options={[
            { value: "solar", label: "양력" },
            { value: "lunar", label: "음력" },
          ]}
        />
        <div className="mt-1 grid grid-cols-[1.4fr_1fr_1fr] gap-space-xs">
          <select aria-label="태어난 해" className={FIELD} value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {YEARS.map((value) => (
              <option key={value} value={value}>
                {value}년
              </option>
            ))}
          </select>
          <select aria-label="태어난 달" className={FIELD} value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTHS.map((value) => (
              <option key={value} value={value}>
                {value}월
              </option>
            ))}
          </select>
          <select aria-label="태어난 날" className={FIELD} value={day} onChange={(e) => setDay(Number(e.target.value))}>
            {DAYS.map((value) => (
              <option key={value} value={value}>
                {value}일
              </option>
            ))}
          </select>
        </div>
        {calendar === "lunar" && (
          <label className="mt-1 flex items-center gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
            <input type="checkbox" checked={leap} onChange={(e) => setLeap(e.target.checked)} className="accent-primary" />
            윤달에 태어났어요
          </label>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <span className="font-label-sm text-label-sm text-on-surface-variant">태어난 시간</span>
        <div className="grid grid-cols-2 gap-space-xs">
          <select
            aria-label="태어난 시"
            className={FIELD}
            value={hour ?? "unknown"}
            onChange={(e) => setHour(e.target.value === "unknown" ? null : Number(e.target.value))}
          >
            <option value="unknown">모름</option>
            {HOURS.map((value) => (
              <option key={value} value={value}>
                {value}시
              </option>
            ))}
          </select>
          <select
            aria-label="태어난 분"
            className={FIELD}
            value={minute}
            disabled={hour === null}
            onChange={(e) => setMinute(Number(e.target.value))}
          >
            {MINUTES.map((value) => (
              <option key={value} value={value}>
                {value}분
              </option>
            ))}
          </select>
        </div>
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

      {error && <p className="font-body-sm text-body-sm text-error">{error}</p>}

      <div className="flex gap-space-sm">
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="flex-1 rounded-xl bg-surface-container-highest py-3 font-label-md text-label-md text-on-surface-variant"
          >
            건너뛰기
          </button>
        )}
        <button
          type="submit"
          className="flex-[2] rounded-xl bg-on-surface py-3 font-label-md text-label-md text-surface transition-transform active:scale-[0.98]"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
