import { cn } from "@/lib/cn";
import { ELEMENT_LABEL, parseGanji } from "@/lib/saju/ganji";
import type { FourPillarsInput } from "@/lib/saju/modules";

// 명리 관습대로 오른쪽→왼쪽(년·월·일·시)으로 읽히도록 시주를 가장 왼쪽에 둔다.
const COLUMNS = [
  { key: "hour", label: "시주" },
  { key: "day", label: "일주" },
  { key: "month", label: "월주" },
  { key: "year", label: "년주" },
] as const;

const ROWS = [
  { key: "stem", label: "천간" },
  { key: "branch", label: "지지" },
] as const;

export function FourPillarsChart({ pillars, className }: { pillars: FourPillarsInput; className?: string }) {
  return (
    <section className={cn("rounded-lg bg-surface-container-high p-space-md", className)} aria-label="사주 원국 여덟 글자">
      <div className="grid grid-cols-[auto_repeat(4,minmax(0,1fr))] gap-space-xs">
        <span />
        {COLUMNS.map((column) => (
          <span key={column.key} className="text-center font-label-sm text-label-sm text-outline">
            {column.label}
          </span>
        ))}

        {ROWS.map((row) => (
          <Row key={row.key} rowKey={row.key} label={row.label} pillars={pillars} />
        ))}
      </div>
    </section>
  );
}

function Row({ rowKey, label, pillars }: { rowKey: "stem" | "branch"; label: string; pillars: FourPillarsInput }) {
  return (
    <>
      <span className="flex items-center pr-space-xs font-label-sm text-label-sm text-outline [writing-mode:vertical-rl]">
        {label}
      </span>
      {COLUMNS.map((column) => {
        const full = pillars[column.key];
        const ganji = full ? parseGanji(full) : null;
        const char = ganji?.[rowKey];
        const isDayMaster = column.key === "day" && rowKey === "stem";

        if (!char) {
          return (
            <div
              key={column.key}
              className="flex aspect-[3/4] flex-col items-center justify-center rounded-lg bg-surface-container-highest/60"
            >
              <span className="font-headline-lg-mobile text-headline-lg-mobile text-outline">?</span>
              <span className="font-label-sm text-label-sm text-outline">{column.key === "hour" ? "시간 모름" : "-"}</span>
            </div>
          );
        }

        return (
          <div
            key={column.key}
            className={cn(
              "relative flex aspect-[3/4] flex-col items-center justify-center gap-0.5 rounded-lg bg-surface-container-highest",
              isDayMaster && "ring-1 ring-primary/70",
            )}
          >
            {isDayMaster && (
              <span className="absolute -top-2 rounded-full bg-primary px-1.5 font-label-sm text-[10px] leading-4 text-on-primary">
                일간
              </span>
            )}
            <span className="font-headline-lg text-headline-lg leading-none text-on-surface">{char.han}</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              {char.ko}
              <span className="text-tertiary"> · {ELEMENT_LABEL[char.element].ko}</span>
            </span>
          </div>
        );
      })}
    </>
  );
}
