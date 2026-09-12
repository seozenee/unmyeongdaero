"use client";

import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from "recharts";
import tokens from "@/design/tokens.json";
import { cn } from "@/lib/cn";
import { ELEMENT_LABEL, FIVE_ELEMENTS } from "@/lib/saju/ganji";
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
              "flex flex-col items-center rounded-lg py-space-sm",
              dominant.includes(item.element) ? "bg-tertiary/10" : "bg-surface-container-high",
            )}
          >
            <span className="font-label-sm text-label-sm text-on-surface-variant">{item.axisLabel}</span>
            <span
              className={cn(
                "font-price-display text-price-display",
                item.count === 0 ? "text-outline" : dominant.includes(item.element) ? "text-tertiary" : "text-on-surface",
              )}
            >
              {item.count}
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
