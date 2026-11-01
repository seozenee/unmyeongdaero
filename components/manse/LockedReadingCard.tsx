import { Icon } from "@/components/ui/Icon";
import type { LockedTopic } from "@/lib/reports/preview-topics";

/** 값이 채워진 예언처럼 보이지 않게, 실제 숫자 없는 모자이크 자리만 그린다. */
export function LockedReadingCard({ topic, no }: { topic: LockedTopic; no: number }) {
  return <article className="relative overflow-hidden rounded-3xl border border-secondary/25 bg-gradient-to-b from-secondary/10 to-surface-container-low p-space-lg">
    <p className="font-label-sm text-label-sm tracking-widest text-secondary">전체 풀이 미리보기 · {String(no).padStart(2, "0")}</p>
    <h3 className="mt-space-md text-[1.5rem] font-bold leading-snug text-on-surface">{topic.title}</h3>
    <p className="mt-space-sm font-body-sm text-body-sm leading-relaxed text-on-surface-variant">{topic.subtitle}</p>
    <div className="relative my-space-lg overflow-hidden rounded-2xl bg-black/30 px-space-md py-space-xl">
      <div aria-hidden="true" className="pointer-events-none select-none text-center text-[2rem] font-bold tracking-widest text-secondary/70 blur-[6px]">
        {topic.format === "date" ? "20▦▦년 ▦▦월" : topic.format === "money" ? "▦▦억 ▦▦▦▦만원" : "나에게 맞는 답"}
      </div>
      <span className="absolute inset-0 flex items-center justify-center gap-space-xs font-label-sm text-label-sm text-on-surface"><Icon name="lock" className="text-[18px]" /> 전체 풀이에서 이어집니다</span>
    </div>
    <dl className="divide-y divide-outline-variant/30">
      {topic.rows.map(label => <div key={label} className="flex items-center gap-space-md py-space-md">
        <dt className="flex-1 font-body-sm text-body-sm leading-relaxed text-on-surface-variant">{label}</dt>
        <dd aria-label="잠긴 상세 내용" className="flex w-20 shrink-0 gap-1" aria-hidden="true">{[0, 1, 2, 3].map(i => <span key={i} className="h-3 flex-1 rounded-sm bg-on-surface/15 blur-[2px]" />)}</dd>
      </div>)}
    </dl>
    <p className="mt-space-md font-label-sm text-label-sm leading-relaxed text-outline">날짜·숫자는 구성 예시예요. 실제 내용은 결제 후 입력하신 사주와 질문에 맞춰 작성돼요.</p>
  </article>;
}
