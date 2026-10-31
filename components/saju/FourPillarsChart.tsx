import { cn } from "@/lib/cn";
import { voidBranches } from "@/lib/manse/sinsal";
import {
  HIDDEN_STEMS,
  branchTenGod,
  tenGod,
  twelveStage,
  type Branch,
  type Stem,
} from "@/lib/manse/tables";
import { ELEMENT_LABEL, ELEMENT_TEXT, ELEMENT_TINT, parseGanji, type FiveElement } from "@/lib/saju/ganji";
import type { FourPillarsInput } from "@/lib/saju/modules";

// 명리 관습대로 오른쪽→왼쪽(년·월·일·시)으로 읽히도록 시주를 가장 왼쪽에 둔다.
const COLUMNS = [
  { key: "hour", label: "시주" },
  { key: "day", label: "일주" },
  { key: "month", label: "월주" },
  { key: "year", label: "년주" },
] as const;

/**
 * 원국 판.
 *
 * 한동안 이 판에는 여덟 글자와 오행 색만 있었다. 한자 여덟 개가 예쁘게 깔려 있을
 * 뿐이라, 보는 사람은 "내 글자는 이렇게 생겼구나" 에서 멈춘다. 정작 풀이가 "어느
 * 글자에서 나왔는지" 를 말해도 판에서 그 글자를 찾을 수가 없다.
 *
 * 그래서 만세력이 늘 함께 적는 것을 전부 올린다 — 글자마다 일간과의 관계(십성),
 * 지지 속에 숨은 글자(지장간), 일간이 그 자리에서 어떤 기운인지(십이운성). 전부
 * 우리가 이미 계산해 두고 쓰지 않던 값이다. 판 하나로 "근거"가 눈에 보인다.
 *
 * 계산은 전부 여기(브라우저)에서 한다. 여덟 글자만 있으면 나오는 값이라 따로 받아
 * 올 것이 없고, 표가 어긋날 일도 없다 — 같은 표를 쓰는 서버와 같은 답이 나온다.
 */
export function FourPillarsChart({ pillars, className }: { pillars: FourPillarsInput; className?: string }) {
  const day = parseGanji(pillars.day);
  const dayStem = day?.stem.ko as Stem | undefined;
  // 일주가 속한 순(旬)에서 비는 두 지지. 그 자리에 앉은 글자는 힘이 덜 실린다 —
  // 만세력이라면 반드시 표시해 주는 것이라 판에도 적어 둔다.
  const voids = day ? voidBranches(day.stem.ko as Stem, day.branch.ko as Branch) : [];

  return (
    <section
      className={cn("flex flex-col gap-space-sm rounded-lg bg-surface-container-high p-space-md", className)}
      aria-label="사주 원국 여덟 글자"
    >
      <ol className="grid grid-cols-4 gap-space-xs">
        {COLUMNS.map((column) => (
          <Column
            key={column.key}
            label={column.label}
            full={pillars[column.key]}
            dayStem={dayStem}
            voids={voids}
            mine={column.key === "day"}
          />
        ))}
      </ol>
      <p className="font-label-sm text-label-sm leading-snug text-outline">
        위에서부터 나와의 관계 · 윗글자 · 아랫글자 · 그 자리에서 지나는 때 · 아랫글자 속에 숨은 글자.
        테두리 친 칸이 나를 가리키는 자리고, 「비어 있음」은 힘이 덜 실리는 자리다.
      </p>
    </section>
  );
}

function Column({
  label,
  full,
  dayStem,
  voids,
  mine,
}: {
  label: string;
  full: string | null;
  dayStem: Stem | undefined;
  voids: readonly Branch[];
  mine: boolean;
}) {
  const ganji = full ? parseGanji(full) : null;

  if (!ganji) {
    return (
      <li className="flex flex-col items-center gap-1">
        <span className="font-label-sm text-label-sm text-outline">{label}</span>
        <div className="flex w-full flex-1 flex-col items-center justify-center gap-1 rounded-xl bg-surface-container-highest/60 py-space-lg">
          <span className="font-headline-lg-mobile text-headline-lg-mobile text-outline">?</span>
          <span className="text-center font-label-sm text-label-sm leading-snug text-outline">
            시간
            <br />
            모름
          </span>
        </div>
      </li>
    );
  }

  const stemKo = ganji.stem.ko as Stem;
  const branchKo = ganji.branch.ko as Branch;
  // 일간 자신에게는 십성이 없다 — 재는 자가 재어지는 자리다
  const stemGod = dayStem ? (mine ? "일간" : tenGod(dayStem, stemKo)) : null;
  const branchGod = dayStem ? branchTenGod(dayStem, branchKo) : null;
  const stage = dayStem ? twelveStage(dayStem, branchKo) : null;
  const hidden = HIDDEN_STEMS[branchKo];
  const empty = voids.includes(branchKo);

  return (
    <li className="flex flex-col items-center gap-1">
      <span className={cn("font-label-sm text-label-sm", mine ? "text-primary" : "text-outline")}>{label}</span>

      {stemGod && (
        <span
          className={cn(
            "w-full rounded-md py-0.5 text-center font-label-sm text-[10px] leading-4",
            mine ? "bg-primary text-on-primary" : "bg-surface-container-highest text-on-surface-variant",
          )}
        >
          {stemGod}
        </span>
      )}

      <Cell char={ganji.stem} highlight={mine} />
      <Cell char={ganji.branch} />

      {branchGod && (
        <span className="w-full rounded-md bg-surface-container-highest py-0.5 text-center font-label-sm text-[10px] leading-4 text-on-surface-variant">
          {branchGod}
        </span>
      )}

      <span className="font-label-sm text-[10px] leading-4 text-outline">
        {stage}
        {empty && <span className="ml-1 text-tertiary">비어 있음</span>}
      </span>

      <span className="text-center font-label-sm text-[10px] leading-4 text-outline">{hidden.join("·")}</span>
    </li>
  );
}

interface CellChar {
  han: string;
  ko: string;
  element: FiveElement;
}

function Cell({ char, highlight }: { char: CellChar; highlight?: boolean }) {
  return (
    <div
      className={cn(
        // 오행 색을 아주 옅게 깔아, 여덟 글자의 기운이 어디로 쏠렸는지 한눈에 보이게 한다
        "flex w-full flex-col items-center justify-center gap-0.5 rounded-xl bg-surface-container-highest py-space-sm",
        ELEMENT_TINT[char.element],
        highlight && "ring-1 ring-primary/70",
      )}
    >
      <span className={cn("text-[1.5rem] font-extrabold leading-none", ELEMENT_TEXT[char.element])}>{char.han}</span>
      <span className="font-label-sm text-[10px] leading-4 text-on-surface-variant">
        {char.ko}
        <span className={ELEMENT_TEXT[char.element]}> {ELEMENT_LABEL[char.element].ko}</span>
      </span>
    </div>
  );
}
