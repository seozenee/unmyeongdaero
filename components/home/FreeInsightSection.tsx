import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

const FREE_ITEMS = [
  {
    href: "/free/today",
    icon: "calendar_today",
    iconClass: "bg-primary/15 text-primary",
    title: "오늘의 운세 & 내 여덟 글자",
    description: "내 생년월일시로 세운 여덟 글자 기운 표",
  },
  {
    href: "/free/dohwa",
    icon: "favorite",
    iconClass: "bg-secondary/15 text-secondary",
    title: "도화살 테스트",
    description: "홍염살·도화살·화개살 중 내게 머문 기운",
  },
  {
    href: "/free/mbti",
    icon: "psychology",
    iconClass: "bg-tertiary/15 text-tertiary",
    title: "사주로 보는 성격 유형",
    description: "음양오행 10간지로 읽어내는 내 본원 성향",
  },
] as const;

/**
 * 가볍게 보는 무료 풀이.
 *
 * 세로로 쌓아 두면 유료 카드 줄 사이에 끼어 목록처럼 읽힌다. 같은 모양의 미는 줄로
 * 두어, 이것도 "구경거리" 로 읽히게 한다.
 */
export function FreeInsightSection() {
  return (
    <section className="mt-space-xl flex flex-col gap-space-md">
      <div className="flex items-baseline justify-between px-space-xs">
        <div>
          <span className="font-label-sm text-label-sm tracking-wider text-secondary">FREE INSIGHT</span>
          <h3 className="mt-0.5 font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
            가볍게 확인하는 사주 잼
          </h3>
        </div>
        <span className="font-label-sm text-label-sm text-outline">모두 무료</span>
      </div>

      <ol className="no-scrollbar -mx-margin flex snap-x gap-space-sm overflow-x-auto px-margin pb-1">
        {FREE_ITEMS.map((item) => (
          <li key={item.href} className="w-[58vw] max-w-[14rem] shrink-0 snap-start">
            <Link
              href={item.href}
              className="group flex h-full flex-col gap-space-sm rounded-2xl bg-surface-container-high p-space-lg transition-colors hover:bg-surface-bright active:scale-[0.98]"
            >
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", item.iconClass)}>
                <Icon name={item.icon} className="text-[24px]" />
              </div>
              <span className="flex items-center gap-1.5">
                <span className="font-label-md text-label-md text-on-surface">{item.title}</span>
                <span className="rounded bg-surface-container-highest px-1.5 font-label-sm text-label-sm font-semibold text-secondary">
                  무료
                </span>
              </span>
              <p className="font-body-sm text-body-sm leading-snug text-on-surface-variant">{item.description}</p>
              <span className="mt-auto flex items-center gap-1 font-label-sm text-label-sm text-outline">
                보러 가기
                <Icon
                  name="chevron_right"
                  className="text-[16px] transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
