import { CHILD_CHAPTERS, childChapterFor } from "./child-chapters";
import type { ReportSection } from "./report";

export interface BookPage {
  id: string;
  kind: "cover" | "opening" | "character" | "chart" | "chapter" | "section" | "benefactor" | "partnership" | "timing" | "actions" | "closing" | "annual" | "lifetime";
  label: string;
  icon: string;
  sectionIndex?: number;
  chapterNumber?: number;
  outlookIndex?: number;
}

function chapterFor(title: string) {
  const child = childChapterFor(title);
  if (child >= 0) return { id: `child-${child}`, label: CHILD_CHAPTERS[child]!.label, icon: "school" };
  if (/귀인|연애|배우자|인연|궁합|두 사람|재회|속마음/.test(title)) return { id: "people", label: "인연과 사람", icon: "diversity_1" };
  if (/재물|돈|수입|지출/.test(title)) return { id: "money", label: "재물과 살아가는 방식", icon: "savings" };
  if (/직업|사업|간판|밑에서|표현|재능|놓아야/.test(title)) return { id: "work", label: "재능과 일의 방향", icon: "auto_awesome" };
  if (/몸|건강|마음이 기우/.test(title)) return { id: "balance", label: "몸과 마음의 균형", icon: "spa" };
  if (/학업|공부|아이|부모|자녀/.test(title)) return { id: "growth", label: "타고난 기질과 성장", icon: "school" };
  if (/열 해|한가운데|올해|내년|앞으로|말년|언제|시기|흐름/.test(title)) return { id: "timing", label: "삶의 흐름과 다가올 때", icon: "nights_stay" };
  return { id: "nature", label: "타고난 나와 지나온 시간", icon: "person" };
}

/** 표지 → 첫 이야기 → 원국 → 독립된 장 표지 → 해설. 본문 순서와 분량은 보존한다. */
export function buildBookPages(sections: readonly ReportSection[], options: { chart: boolean; character?: boolean; benefactor: boolean; partnership: boolean; annualYears?: number[]; pastYears?: number[]; lifetime?: boolean }): BookPage[] {
  const pages: BookPage[] = [
    { id: "cover", kind: "cover", label: "이름 표지", icon: "auto_stories" },
    { id: "opening", kind: "opening", label: "첫 이야기", icon: "forum" },
    // 본문을 읽기 전에 성격부터. 상품마다 성격 장의 자리가 다르므로 계산값으로 같은 자리에 둔다.
    ...(options.character ? [{ id: "character", kind: "character", label: "읽기 전에 — 내 성격", icon: "person" } as const] : []),
    ...(options.chart ? [{ id: "chart", kind: "chart", label: "나의 사주", icon: "grid_view" } as const] : []),
  ];
  let previous = "";
  let chapterNumber = 0;
  sections.forEach((section, index) => {
    const chapter = chapterFor(section.title);
    if (chapter.id !== previous) { chapterNumber += 1; pages.push({ id: `chapter-${index}`, kind: "chapter", label: chapter.label, icon: chapter.icon, chapterNumber }); }
    pages.push({ id: `section-${index}`, kind: "section", label: section.title, icon: chapter.icon, sectionIndex: index });
    previous = chapter.id;
  });
  if (options.benefactor && !sections.some(section => /귀인/.test(section.title))) pages.push({ id: "benefactor", kind: "benefactor", label: "귀인운이 들어오는 시기", icon: "diversity_1" });
  if (options.partnership && !sections.some(section => /연애|배우자|인연/.test(section.title))) pages.push({ id: "partnership", kind: "partnership", label: "인연이 깊어지는 시기", icon: "favorite" });
  if (options.lifetime) pages.push({ id: "lifetime", kind: "lifetime", label: "평생의 흐름 — 열 해씩 80대까지", icon: "auto_stories" });
  options.pastYears?.forEach((year, outlookIndex) => pages.push({ id: `past-${year}`, kind: "annual", label: `${year}년 — 지나온 흐름`, icon: "history", outlookIndex }));
  options.annualYears?.forEach((year, outlookIndex) => pages.push({ id: `annual-${year}`, kind: "annual", label: `${year}년 — 재물·인연·일`, icon: "event", outlookIndex }));
  pages.push(
    { id: "timing", kind: "timing", label: "기억해 둘 시기", icon: "event" },
    { id: "actions", kind: "actions", label: "오늘의 선택", icon: "check_circle" },
    { id: "closing", kind: "closing", label: "마지막 한마디", icon: "forum" },
  );
  return pages;
}
