"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

const NAV_ITEMS = [
  { href: "/", label: "홈", icon: "home" },
  { href: "/search", label: "검색", icon: "search" },
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
