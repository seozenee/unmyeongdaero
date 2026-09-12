import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-margin py-space-lg">
      <Link href="/" className="mb-space-lg flex items-center gap-1 font-label-md text-label-md text-on-surface-variant">
        <Icon name="chevron_left" className="text-[18px]" /> 운명대로 홈
      </Link>
      <article className="flex flex-col gap-space-md font-body-md text-body-md leading-relaxed text-on-surface-variant [&_h1]:font-headline-lg-mobile [&_h1]:text-headline-lg-mobile [&_h1]:text-on-surface [&_h2]:mt-space-md [&_h2]:font-headline-md [&_h2]:text-headline-md [&_h2]:text-on-surface [&_li]:ml-space-md [&_li]:list-disc">
        {children}
      </article>
    </div>
  );
}
