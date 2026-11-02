import type { ReadingWindow } from "@/lib/manse/reading-focus";

export interface ReadingCardWindow {
  period: string;
  monthly: boolean;
  hasCaution: boolean;
}

export interface ReadingCardWindows {
  benefactor: ReadingCardWindow[];
  partnership: ReadingCardWindow[];
}

/** 날짜를 새로 예측하지 않는다. 원래 계산된 후보 중 앞으로의 시기만 카드로 옮긴다. */
export function readingCardWindows(modules: Record<string, unknown>, today: string, product?: { slug: string; chapters: readonly string[] }): ReadingCardWindows {
  const focus = modules.readingFocus as { benefactor?: ReadingWindow[]; partnership?: ReadingWindow[] } | undefined;
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7));
  const select = (source: ReadingWindow[] | undefined) => {
    if (!Array.isArray(source)) return [];
    const future = source.filter(item => item && Number.isInteger(item.year) && item.year >= year
      && (item.month === undefined || (Number.isInteger(item.month) && item.month >= 1 && item.month <= 12
        && item.year * 12 + item.month >= year * 12 + month)));
    const monthlyYears = new Set(future.filter(item => item.month !== undefined).map(item => item.year));
    const unique = new Map<string, ReadingCardWindow>();
    for (const item of [...future].sort((a, b) => a.year - b.year || (a.month ?? 13) - (b.month ?? 13))) {
      if (item.month === undefined && monthlyYears.has(item.year)) continue;
      const period = `${item.year}년${item.month === undefined ? "" : ` ${item.month}월`}`;
      if (!unique.has(period)) unique.set(period, { period, monthly: item.month !== undefined, hasCaution: Boolean(item.cautions?.length) });
    }
    return Array.from(unique.values()).slice(0, 3);
  };
  const general = !product || ["factbomb", "destiny-full", "life"].includes(product.slug);
  return {
    benefactor: general || product?.chapters.some(title => /귀인/.test(title)) ? select(focus?.benefactor) : [],
    partnership: general || product?.chapters.some(title => /연애|배우자|인연/.test(title)) ? select(focus?.partnership) : [],
  };
}

/** 목차의 의미를 바꾸지 않고 찾기 쉬운 짧은 이름만 붙인다. */
export function readingCardTopic(title: string): { label: string; icon: string } {
  if (/귀인/.test(title)) return { label: "귀인", icon: "diversity_1" };
  if (/과거|지나온/.test(title)) return { label: "지나온 시간", icon: "history" };
  if (/연애|배우자|인연/.test(title)) return { label: "연애와 인연", icon: "favorite" };
  if (/돈|재물/.test(title)) return { label: "돈과 재물", icon: "savings" };
  if (/직업|간판|밑에서|사업/.test(title)) return { label: "일과 사업", icon: "work" };
  if (/표현|말과/.test(title)) return { label: "말과 재능", icon: "forum" };
  if (/언제|시기|흐름/.test(title)) return { label: "앞으로의 시기", icon: "event" };
  if (/성격|어떤 사람|겉과 속/.test(title)) return { label: "타고난 나", icon: "person" };
  if (/놓아야|붙들고/.test(title)) return { label: "지금의 선택", icon: "alt_route" };
  return { label: title, icon: "auto_awesome" };
}
