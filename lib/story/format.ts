import type { BirthProfile } from "../db/types";

const pad = (value: number) => String(value).padStart(2, "0");

/** "1998.05.19 (양력) 10:00 · 남 · 서울" */
export function describeBirth(profile: BirthProfile) {
  const calendar = profile.isLunar ? `음력${profile.isLeapMonth ? "·윤달" : ""}` : "양력";
  const time = profile.birthHour === null ? "시간 모름" : `${pad(profile.birthHour)}:${pad(profile.birthMinute ?? 0)}`;
  return `${profile.birthYear}.${pad(profile.birthMonth)}.${pad(profile.birthDay)} (${calendar}) ${time} · ${
    profile.isFemale ? "여" : "남"
  } · ${profile.birthCity}`;
}

export function fillName(text: string, name: string | undefined) {
  return text.replaceAll("{name}", name || "당신");
}
