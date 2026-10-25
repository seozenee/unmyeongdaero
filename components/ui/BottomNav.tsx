"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

// 가운데 자리를 검색이 쓰고 있었다. 상품이 열일곱 개뿐이고 첫 화면이 주제별 줄로
// 깔려 있어, 검색어를 치러 들어오는 사람보다 "물어볼 데가 없나" 하고 누르는 사람이
// 훨씬 많다. 그 자리를 안내자에게 직접 묻는 채팅에 내준다.
const NAV_ITEMS = [
  { href: "/", label: "홈", icon: "home" },
  { href: "/consult", label: "채팅", icon: "chat" },
  { href: "/library", label: "보관함", icon: "auto_stories" },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-50 bg-surface/90 backdrop-blur-xl lg:mx-auto lg:max-w-md lg:rounded-t-xl">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around px-gutter">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-[44px] min-w-[56px] flex-col items-center justify-center gap-space-xs transition-colors",
                active ? "font-label-md text-primary" : "text-on-surface-variant hover:text-on-surface",
              )}
            >
              <Icon name={item.icon} className="text-[24px]" />
              <span className="font-label-sm text-label-sm">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
