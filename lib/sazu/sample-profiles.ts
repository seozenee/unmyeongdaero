// sazu Free 샌드박스 키는 아래 5개 입력과 "정확히 일치"할 때만 응답한다(docs.md · Free 샌드박스).
// 개발/시연 환경에서 입력 폼을 이 값으로 빠르게 채우는 데 쓴다. 클라이언트에서도 import 가능.
import type { BirthProfile } from "../db/types";

export interface SazuSampleProfile {
  id: string;
  label: string;
  profile: BirthProfile;
}

export const SAZU_SAMPLE_PROFILES: readonly SazuSampleProfile[] = [
  {
    id: "strong-male",
    label: "신강 · 남 · 합충 풍부",
    profile: { name: "샘플 하준", birthYear: 1998, birthMonth: 5, birthDay: 19, birthHour: 10, birthMinute: 0, isFemale: false, isLunar: false, birthCity: "서울" },
  },
  {
    id: "weak-female",
    label: "신약 · 여 · 대운 역행",
    profile: { name: "샘플 서윤", birthYear: 1970, birthMonth: 5, birthDay: 5, birthHour: 10, birthMinute: 0, isFemale: true, isLunar: false, birthCity: "서울" },
  },
  {
    id: "unknown-hour",
    label: "출생시간 미상",
    profile: { name: "샘플 도윤", birthYear: 1985, birthMonth: 8, birthDay: 12, birthHour: null, isFemale: false, isLunar: false, birthCity: "서울" },
  },
  {
    id: "balanced",
    label: "중화 · 관계 희소",
    profile: { name: "샘플 지호", birthYear: 1972, birthMonth: 5, birthDay: 19, birthHour: 10, birthMinute: 0, isFemale: false, isLunar: false, birthCity: "서울" },
  },
  {
    id: "rich-sinsal",
    label: "신살 풍부 · 여",
    profile: { name: "샘플 하린", birthYear: 1993, birthMonth: 11, birthDay: 19, birthHour: 10, birthMinute: 0, isFemale: true, isLunar: false, birthCity: "서울" },
  },
];
