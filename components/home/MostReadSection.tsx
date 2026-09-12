import Link from "next/link";
import { STITCH_ASSETS } from "@/components/home/assets";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import { formatKRW } from "@/lib/format";
import { getReport, type ReportSlug } from "@/lib/reports/catalog";

// 평점·후기 수·열람자 수는 실거래 집계가 없으면 표시하지 않는다(표시광고법).
// 대신 상품이 실제로 담고 있는 사실(장수·가격·소장 조건)만 보여 준다.
interface DossierItem {
  slug: ReportSlug;
  badgeClass: string;
  thumbnail: string;
  thumbnailAlt: string;
}

const DOSSIER: DossierItem[] = [
  {
    slug: "reunion",
    badgeClass: "bg-primary/15 text-primary",
    thumbnail: STITCH_ASSETS.thumbReunion,
    thumbnailAlt: "비 내리는 서울 옛 골목의 등불 아래 서로 떨어져 걷는 두 사람",
  },
  {
    slug: "love",
    badgeClass: "bg-secondary-container/30 text-secondary",
    thumbnail: STITCH_ASSETS.thumbLove,
    thumbnailAlt: "따뜻한 황혼빛 속 실루엣 인물 사진",
  },
  {
    slug: "compatibility",
    badgeClass: "bg-tertiary-container/30 text-tertiary",
    thumbnail: STITCH_ASSETS.thumbCompatibility,
    thumbnailAlt: "어두운 테이블 위에 나란히 놓인 두 개의 도자기 찻잔",
  },
  {
    slug: "life",
    badgeClass: "bg-primary/20 text-primary-fixed",
    thumbnail: STITCH_ASSETS.thumbLife,
    thumbnailAlt: "보랏빛 황혼 하늘 아래 산등성이에 홀로 선 소나무",
  },
];

export function MostReadSection() {
  return (
    <section className="mt-space-xl flex flex-col gap-space-md">
      <div className="flex items-end justify-between px-space-xs">
        <div>
          <span className="font-label-sm text-label-sm tracking-widest text-primary">ORIGINAL DOSSIER</span>
          <h3 className="mt-0.5 font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
            운명대로의 대표 풀이
          </h3>
        </div>
        <span className="flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant">
          <Icon name="bolt" className="text-[14px]" /> 단건 결제
        </span>
      </div>

      <div className="flex flex-col gap-space-md">
        {DOSSIER.map((item) => (
          <ReportListCard key={item.slug} item={item} />
        ))}
      </div>
    </section>
  );
}

function ReportListCard({ item }: { item: DossierItem }) {
  const report = getReport(item.slug)!;

  return (
    <article className="relative flex flex-col gap-space-sm overflow-hidden rounded-xl bg-surface-container p-space-lg shadow-sm transition-all active:scale-[0.99]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-space-xs">
          <span className={cn("rounded px-2 py-0.5 font-label-sm text-label-sm", item.badgeClass)}>
            {report.categoryLabel}
          </span>
          <span className="flex items-center gap-1 font-label-sm text-label-sm text-outline">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
            {report.chapters.length}장 구성
          </span>
        </div>
        <span className="flex items-center gap-0.5 font-label-sm text-label-sm text-outline">
          <Icon name="lock_open" className="text-[15px]" /> 영구 소장
        </span>
      </div>

      <div className="mt-1 flex items-start justify-between gap-space-md">
        <div className="flex flex-col">
          <h4 className="font-headline-md text-headline-md leading-snug text-on-surface">{report.title}</h4>
          <p className="mt-1 line-clamp-2 font-body-sm text-body-sm text-on-surface-variant">{report.description}</p>
        </div>
        <div
          role="img"
          aria-label={item.thumbnailAlt}
          className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-cover bg-center"
          style={{ backgroundImage: `url('${item.thumbnail}')` }}
        />
      </div>

      <div className="mt-space-xs flex items-center justify-between pt-space-xs">
        <div className="flex items-center gap-1.5">
          <span className="font-label-md text-label-md font-semibold text-on-surface">{formatKRW(report.price)}</span>
          <span className="font-label-sm text-label-sm text-outline">소장형 리포트</span>
        </div>
        <Link
          href={`/reports/${report.slug}`}
          className="flex items-center gap-1 rounded-lg bg-surface-container-highest px-space-md py-1.5 font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-bright"
        >
          열람하기 <Icon name="chevron_right" className="text-[16px]" />
        </Link>
      </div>
    </article>
  );
}
