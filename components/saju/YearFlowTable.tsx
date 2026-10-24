import { cn } from "@/lib/cn";
import { ELEMENT_TEXT, parseGanji } from "@/lib/saju/ganji";
import type { YearItem } from "@/lib/saju/modules";

interface YearFlowTableProps {
  items: YearItem[];
  /** 지금 해. 표에서 한 줄만 도드라지게 한다 */
  currentYear: number;
  title?: string;
  /** 나이 칸에 함께 적을 말 — 입시 상품이면 "고2" 같은 학년 */
  stageLabel?: (item: YearItem) => string | null;
  className?: string;
}

/**
 * 연도별 흐름표.
 *
 * 대운은 열 해씩이라 가로 띠가 맞지만, 세운은 "올해 어떻고 내년 어떤가"를 나란히
 * 비교하는 표가 맞다. 글로만 늘어놓으면 여섯 해가 머리에 남지 않는다.
 *
 * 힘의 세기는 숫자를 쓰지 않고 막대 길이로만 보여 준다. "7점짜리 해" 같은 말은
 * 점수처럼 읽혀서 보고서 전체가 지키는 규칙(점수 비노출)과 어긋난다.
 */
export function YearFlowTable({ items, currentYear, title = "연도별 흐름", stageLabel, className }: YearFlowTableProps) {
  if (items.length < 2) return null;

  return (
    <section className={cn("rounded-xl bg-surface-container p-space-lg", className)} aria-label={title}>
      <div className="flex items-baseline justify-between">
        <h3 className="font-headline-md text-headline-md text-on-surface">{title}</h3>
        <span className="font-label-sm text-label-sm text-outline">힘이 실리는 정도</span>
      </div>

      <ol className="mt-space-sm flex flex-col">
        {items.map((item) => {
          const current = item.year === currentYear;
          const ganji = parseGanji(item.ganji);
          const strength = Math.min(1, Math.max(0.12, (item.level ?? 6) / 12));
          const tone = (item.level ?? 6) >= 8 ? "good" : (item.level ?? 6) <= 4 ? "caution" : "neutral";
          const label = stageLabel?.(item);

          return (
            <li
              key={item.year}
              aria-current={current ? "true" : undefined}
              className={cn(
                "flex items-center gap-space-sm border-t border-outline-variant/40 py-space-sm first:border-t-0",
                current && "-mx-space-sm rounded-lg bg-surface-container-high px-space-sm",
              )}
            >
              {/* 해와 나이 */}
              <div className="flex w-[4.25rem] shrink-0 flex-col">
                <span className={cn("font-label-md text-label-md", current ? "text-primary" : "text-on-surface")}>
                  {item.year}
                </span>
                <span className="font-label-sm text-label-sm text-outline">
                  {label ?? `${item.age}세`}
                </span>
              </div>

              {/* 간지 — 천간과 지지를 각자의 오행 색으로 */}
              <div className="flex w-[3.25rem] shrink-0 items-baseline gap-0.5">
                {ganji ? (
                  <>
                    <span className={cn("font-headline-sm text-headline-sm", ELEMENT_TEXT[ganji.stem.element])}>
                      {ganji.stem.han}
                    </span>
                    <span className={cn("font-headline-sm text-headline-sm", ELEMENT_TEXT[ganji.branch.element])}>
                      {ganji.branch.han}
                    </span>
                  </>
                ) : (
                  <span className="font-headline-sm text-headline-sm text-on-surface">{item.ganji}</span>
                )}
              </div>

              {/* 힘의 세기 — 숫자 대신 길이로 */}
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-outline-variant/25">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      tone === "good" ? "bg-tertiary" : tone === "caution" ? "bg-secondary" : "bg-outline",
                    )}
                    style={{ width: `${strength * 100}%` }}
                  />
                </div>
                <span className="line-clamp-1 font-body-sm text-body-sm text-on-surface-variant">
                  {item.stage ?? ""}
                  {item.stage && item.note ? " · " : ""}
                  {item.note ?? ""}
                </span>
              </div>
            </li>
          );
        })}
      </ol>

      <p className="mt-space-sm font-body-sm text-body-sm text-outline">
        막대가 길수록 그해에 힘이 실린다는 뜻이에요. 짧은 해는 나쁜 해가 아니라, 벌이기보다 쌓는 쪽이 맞는 해예요.
      </p>
    </section>
  );
}
