import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

const FREE_ITEMS = [
  {
    href: "/free/today",
    icon: "calendar_today",
    iconClass: "bg-primary/10 text-primary",
    title: "오늘의 무료 운세 & 나의 만세력 명식",
    description: "내 생년월일시로 세운 여덟 글자 기운 표",
  },
  {
    href: "/free/dohwa",
    icon: "favorite",
    iconClass: "bg-secondary/10 text-secondary",
    title: "도화살 테스트 : 내 타고난 매력의 결",
    description: "홍염살, 도화살, 화개살 중 내게 머문 기운",
  },
  {
    href: "/free/mbti",
    icon: "psychology",
    iconClass: "bg-tertiary/10 text-tertiary",
    title: "사주로 보는 성격 유형 & 궁합 MBTI",
    description: "음양오행 10간지로 읽어내는 내 본원 성향",
  },
] as const;

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
        <span className="font-label-sm text-label-sm text-outline">모두 100% 무료</span>
      </div>

      <div className="grid grid-cols-1 gap-space-sm">
        {FREE_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex items-center gap-space-md rounded-xl bg-surface-container-high p-space-md transition-colors hover:bg-surface-bright"
          >
            <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-lg", item.iconClass)}>
              <Icon name={item.icon} className="text-[24px]" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-center gap-1.5">
                <span className="truncate font-label-md text-label-md text-on-surface">{item.title}</span>
                <span className="rounded bg-surface-container-highest px-1.5 font-label-sm text-label-sm font-semibold text-secondary">
                  무료
                </span>
              </div>
              <p className="mt-0.5 truncate font-body-sm text-body-sm text-on-surface-variant">{item.description}</p>
            </div>
            <Icon name="chevron_right" className="text-outline transition-colors group-hover:text-on-surface" />
          </Link>
        ))}
      </div>
    </section>
  );
}
