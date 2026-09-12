import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-space-md px-margin text-center">
      <span className="font-headline-xl text-headline-xl font-bold text-outline-variant">404</span>
      <h1 className="font-headline-md text-headline-md text-on-surface">찾으시는 페이지가 없어요</h1>
      <p className="font-body-md text-body-md text-on-surface-variant">주소가 바뀌었거나 사라진 페이지예요.</p>
      <Link href="/" className="rounded-xl bg-on-surface px-space-lg py-3 font-label-md text-label-md text-surface">
        홈으로 가기
      </Link>
    </main>
  );
}
