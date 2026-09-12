import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { getCurrentUser } from "@/lib/auth/session";

export async function AppHeader() {
  const user = await getCurrentUser();

  return (
    <header className="pt-safe fixed inset-x-0 top-0 z-50 bg-surface/85 backdrop-blur-xl lg:mx-auto lg:max-w-md lg:rounded-b-xl">
      <div className="mx-auto flex h-16 max-w-md items-center justify-between px-margin">
        <Link href="/" className="flex items-center gap-space-sm">
          <Logo />
          <div className="flex flex-col">
            <span className="font-headline-md text-headline-md leading-none tracking-tight text-on-surface">
              운명대로
            </span>
            <span className="mt-0.5 font-label-sm text-label-sm lowercase leading-tight tracking-wider text-outline opacity-80">
              unmyeongdaero.com
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-space-sm">
          <button
            type="button"
            aria-label="알림"
            className="flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
          >
            <Icon name="notifications" className="text-[22px]" />
          </button>
          <Link
            href={user ? "/library" : "/login"}
            aria-label={user ? "내 보관함" : "로그인"}
            className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary"
          >
            {user?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <Icon name="person" className="text-[18px] text-on-primary" />
            )}
            {!user && <span className="sr-only">로그인</span>}
          </Link>
        </div>
      </div>
    </header>
  );
}
