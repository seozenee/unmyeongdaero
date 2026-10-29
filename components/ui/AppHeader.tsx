import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { getCurrentUser } from "@/lib/auth/session";

export async function AppHeader() {
  const user = await getCurrentUser();

  return (
    <header className="pt-safe fixed inset-x-0 top-0 z-50 bg-surface/85 backdrop-blur-xl lg:mx-auto lg:max-w-md lg:rounded-b-xl">
      <div className="mx-auto flex h-16 max-w-md items-center justify-between px-margin">
        {/*
          머리에는 이름과 찾는 자리만 둔다.
          주소(unmyeongdaero.com)를 로고 밑에 붙여 두었었다. 손님은 이미 그 주소에
          들어와 있으므로 알려 줄 것이 없고, 두 줄이 되면서 이름이 작아 보였다.
          이름은 한 줄로 크게, 브랜드 색으로 둔다.
        */}
        <Link href="/" className="flex items-center gap-space-sm">
          <Logo />
          <span className="font-headline-md text-headline-md leading-none tracking-tight text-primary">
            운명대로
          </span>
        </Link>
        <div className="flex items-center gap-space-sm">
          {/*
            여기 종 모양 버튼이 있었다. 누르면 아무 일도 일어나지 않았다 — 눌러 본
            사람에게는 고장 난 화면이다. 실제로 데려다 줄 곳이 있는 것으로 바꾼다.
          */}
          <Link
            href="/search"
            aria-label="풀이 찾기"
            className="flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
          >
            <Icon name="search" className="text-[22px]" />
          </Link>
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
