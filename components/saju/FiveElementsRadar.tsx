"use client";

import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from "recharts";
import tokens from "@/design/tokens.json";
import { cn } from "@/lib/cn";
import { ELEMENT_FILL, ELEMENT_LABEL, ELEMENT_TEXT, ELEMENT_TINT, FIVE_ELEMENTS } from "@/lib/saju/ganji";
import type { ElementCounts } from "@/lib/saju/modules";

const { colors } = tokens;

export function FiveElementsRadar({ counts, className }: { counts: ElementCounts; className?: string }) {
  const total = FIVE_ELEMENTS.reduce((sum, element) => sum + counts[element], 0);
  const max = Math.max(...FIVE_ELEMENTS.map((element) => counts[element]));
  const data = FIVE_ELEMENTS.map((element) => ({
    element,
    axisLabel: `${ELEMENT_LABEL[element].ko}(${ELEMENT_LABEL[element].han})`,
    count: counts[element],
  }));
  const dominant = FIVE_ELEMENTS.filter((element) => max > 0 && counts[element] === max);
  const missing = FIVE_ELEMENTS.filter((element) => counts[element] === 0);

  return (
    <section className={cn("rounded-xl bg-surface-container p-space-lg", className)} aria-label="오행 분포">
      <div className="flex items-baseline justify-between">
        <h3 className="font-headline-md text-headline-md text-on-surface">오행 분포</h3>
        <span className="font-label-sm text-label-sm text-outline">원국 {total}자 기준</span>
      </div>

      {/*
        레이더는 모양을 보여 주지만 "얼마나 치우쳤는지"는 띠가 더 빠르다.
        다섯 기운을 제 색으로 이어 붙여, 한 줄로 비율을 보여 준다.
      */}
      {total > 0 && (
        <div className="mt-space-sm flex h-3 w-full overflow-hidden rounded-full bg-surface-container-lowest" aria-hidden>
          {FIVE_ELEMENTS.filter((element) => counts[element] > 0).map((element) => (
            <div
              key={element}
              className={cn("h-full", ELEMENT_FILL[element])}
              style={{ width: `${(counts[element] / total) * 100}%` }}
            />
          ))}
        </div>
      )}

      <div className="mt-space-sm h-60 w-full" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="72%">
            <PolarGrid stroke={colors["outline-variant"]} />
            <PolarAngleAxis
              dataKey="axisLabel"
              tick={{ fill: colors["on-surface-variant"], fontSize: 12 }}
              tickLine={false}
            />
            <PolarRadiusAxis domain={[0, Math.max(max, 1)]} tick={false} axisLine={false} />
            <Radar
              dataKey="count"
              stroke={colors.tertiary}
              strokeWidth={1.5}
              fill={colors["tertiary-container"]}
              fillOpacity={0.28}
              dot={{ r: 2.5, fill: colors.tertiary, strokeWidth: 0 }}
              isAnimationActive={false}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <ul className="mt-space-sm grid grid-cols-5 gap-space-xs">
        {data.map((item) => (
          <li
            key={item.element}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-lg py-space-sm transition-colors",
              item.count === 0 ? "bg-surface-container-high" : ELEMENT_TINT[item.element],
              dominant.includes(item.element) && "ring-1 ring-inset ring-on-surface/15",
            )}
          >
            <span className={cn("font-label-sm text-label-sm", item.count === 0 ? "text-outline" : ELEMENT_TEXT[item.element])}>
              {item.axisLabel}
            </span>
            <span
              className={cn(
                "font-price-display text-price-display",
                item.count === 0 ? "text-outline" : ELEMENT_TEXT[item.element],
              )}
            >
              {item.count}
            </span>
            {/* 작은 막대 하나로 칸끼리의 높낮이를 바로 견준다 */}
            <span className="mt-0.5 h-1 w-6 overflow-hidden rounded-full bg-on-surface/10">
              <span
                className={cn("block h-full rounded-full", item.count === 0 ? "" : ELEMENT_FILL[item.element])}
                style={{ width: `${max > 0 ? (item.count / max) * 100 : 0}%` }}
              />
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-space-sm font-body-sm text-body-sm text-on-surface-variant">
        {dominant.length > 0 && (
          <>
            가장 두드러진 기운은{" "}
            <strong className="text-tertiary">{dominant.map((element) => ELEMENT_LABEL[element].ko).join("·")}</strong>
          </>
        )}
        {missing.length > 0 && (
          <>
            {dominant.length > 0 ? ", " : ""}원국에 드러나지 않은 기운은{" "}
            <strong className="text-on-surface">{missing.map((element) => ELEMENT_LABEL[element].ko).join("·")}</strong>
          </>
        )}
        {dominant.length > 0 || missing.length > 0 ? "입니다." : null}
      </p>
    </section>
  );
}
