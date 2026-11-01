import type { StoredSazu } from "../db/types";
import type { ReadingFocus, ReadingWindow } from "../manse/reading-focus";
import type { ReportProduct } from "../reports/catalog";
import { mergedModules } from "../sazu/readings";
import type { StoryReport, TimelineItem } from "./report";

/** 계산한 사람 운을 완성본에 연결한다. 모델이 월별 자료를 놓쳐도 날짜를 새로 만들지 않는다. */
export function withCalculatedPeopleTiming(report: StoryReport, product: ReportProduct, sazu: StoredSazu, asked: string, today: string): StoryReport {
  const focus = mergedModules(sazu).readingFocus as ReadingFocus | undefined;
  if (!focus) return report;
  const full = ["factbomb", "life", "destiny-full"].includes(product.slug);
  const showBenefactor = full || /귀인|도와줄|도움.*사람/.test(asked);
  const showPartner = full || ["romance", "chemistry"].includes(product.category) || /배우자|인연|결혼|만날/.test(asked);
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7));
  const nearest = (windows: ReadingWindow[]) => {
    const upcoming = windows.filter(w => w.year > year || (w.year === year && (!w.month || w.month >= month)))
      .slice().sort((a, b) => a.year - b.year || (a.month ?? 0) - (b.month ?? 0));
    return [upcoming.find(w => !w.month), upcoming.find(w => w.month)].filter((w): w is ReadingWindow => Boolean(w));
  };
  const blunt = product.guide === "gangho";
  const voice = (polite: string, informal: string) => blunt ? informal : polite;
  const additions: TimelineItem[] = [];
  if (showBenefactor) for (const w of nearest(focus.benefactor)) {
    const unit = w.month ? "이 달" : "이 해";
    additions.push({ period: w.period, tone: w.cautions.length ? "caution" : "neutral", title: "조언과 소개를 살펴볼 귀인운",
      note: voice(`태어난 날을 기준으로 보는 귀인 자리와 ${unit}의 글자가 겹쳐요. 조언·소개·중재처럼 사람을 통해 실마리를 찾는 시기로 읽어요.`, `태어난 날을 기준으로 보는 귀인 자리와 ${unit}의 글자가 겹쳐. 조언·소개·중재처럼 사람을 통해 실마리를 찾는 시기로 읽어.`)
        + (w.cautions.length ? voice(" 가까운 관계에서 긴장을 읽는 단서도 있어, 도움의 내용과 조건을 함께 봐야 해요.", " 가까운 관계에서 긴장을 읽는 단서도 있어. 도움의 내용과 조건을 함께 봐야 해.") : voice(" 특정 사람이 반드시 나타난다는 뜻은 아니에요.", " 특정 사람이 반드시 나타난다는 뜻은 아니야.")) });
  }
  if (showPartner) for (const w of nearest(focus.partnership)) {
    const signals = [
      w.reasons.some(r => r.includes("짝")) && "상대·관계에 관심이 모이는 흐름",
      w.reasons.some(r => r.includes("연결")) && "가까운 사이를 잇는 흐름",
      w.reasons.some(r => r.includes("눈에 띄")) && "사람 사이에서 눈에 띄는 흐름",
    ].filter(Boolean);
    additions.push({ period: w.period, tone: w.cautions.length ? "caution" : "neutral", title: "인연과 관계를 구체화할 때",
      note: `${signals.join("과 ")}${voice("이 겹치는 시기예요.", "이 겹치는 시기야.")} `
        + voice("새 만남뿐 아니라 이미 있는 관계를 구체화하는 때로도 읽어요. 실제 상대의 의사와 약속을 함께 보세요.", "새 만남뿐 아니라 이미 있는 관계를 구체화하는 때로도 읽어. 실제 상대의 의사와 약속을 함께 봐.")
        + (w.cautions.length ? voice(" 끌림과 마찰이 함께 보여 속도나 거리를 맞추는 일이 중요해요.", " 끌림과 마찰이 함께 보여 속도나 거리를 맞추는 일이 중요해.") : "") });
  }
  if (!additions.length) return report;
  const keys = new Set(additions.map(item => `${item.period}:${item.title}`));
  const periodKey = (period: string) => {
    const match = period.match(/(\d{4})년(?:\s*(\d{1,2})월)?/);
    return match ? Number(match[1]) * 12 + Number(match[2] ?? 0) : Number.MAX_SAFE_INTEGER;
  };
  return { ...report, timeline: [...report.timeline.filter(item => !keys.has(`${item.period}:${item.title}`)), ...additions]
    .sort((a, b) => periodKey(a.period) - periodKey(b.period)) };
}
