"use client";

import Link from "next/link";
import { STITCH_ASSETS } from "@/components/home/assets";
import { getPoster } from "@/components/home/posters";
import { useInView } from "@/components/home/useInView";
import { WebtoonMedia } from "@/components/webtoon/WebtoonMedia";
import type { ReportCategory, ReportProduct } from "@/lib/reports/catalog";
import { productFont } from "@/lib/reports/fonts";

/**
 * 주제별 묶음.
 *
 * 한동안 한 상품을 여러 줄에 넣었다. 줄은 아홉 개인데 상품은 열일곱 개라, 겹치지
 * 않으면 한 장짜리 줄이 생긴다는 이유였다. 그런데 내려가다 보면 궁합사주를 다섯 번
 * 만난다. 많아 보이려고 한 것이 오히려 "볼 게 없구나" 로 읽혔다 — 같은 카드를 또
 * 보는 순간 사람은 끝까지 다 봤다고 느낀다.
 *
 * 이제 상품은 한 번씩만 나온다. 묶음이 여섯 개로 줄고, 어떤 묶음은 한 장뿐이다.
 * 한 장이면 한 장으로 둔다 — 옆으로 밀 것이 없는데 미는 줄로 만들 이유가 없다.
 *
 * 그래서 가로로 미는 줄을 걷어내고 세로로 쌓는다. 카드가 화면 폭을 다 쓰면 그림이
 * 제대로 보이고, 미는 손짓 없이 내려가기만 하면 된다.
 *
 * id 는 위쪽 탭과 고민 바로가기가 내려와 멈추는 자리다.
 */
export const RAILS: ReadonlyArray<{
  id: ReportCategory | "all";
  heading: string;
  caption: string;
  /** 이 묶음에 둘 상품. 어느 상품도 두 묶음에 들어가지 않는다 */
  slugs: readonly string[];
  /** 카드마다 붙는 한 줄. 이 묶음에 들른 사람이 묻고 온 것을 쓴다 */
  hooks?: Readonly<Record<string, string>>;
}> = [
  {
    id: "destiny",
    heading: "내 인생, 지금 어디쯤일까",
    caption: "타고난 결과 큰 흐름",
    slugs: ["destiny-full", "life", "yearly", "health"],
    hooks: {
      "destiny-full": "타고난 결부터 말년까지, 끊지 않고 한 번에",
      life: "지금이 올라가는 중인가, 내려가는 중인가",
      yearly: "내년 열두 달 중 어느 달이 내 달인가",
      health: "늘 같은 데가 먼저 지치는 이유",
    },
  },
  {
    id: "romance",
    heading: "내 연애는 언제 시작될까",
    caption: "타고난 연애의 결",
    slugs: ["love", "compatibility"],
    hooks: {
      love: "올 사람이 어떤 얼굴로 오는지 미리 알 수 있을까",
      compatibility: "잘 만나다 꼭 같은 데서 틀어지는 이유",
    },
  },
  {
    id: "reunion",
    heading: "끝난 인연에도 다음이 있을까",
    caption: "속마음과 다시 닿는 때",
    slugs: ["reunion-deep", "reunion"],
    hooks: {
      "reunion-deep": "잘 지내다 갑자기 식었다면, 그 자리가 어디인가",
      reunion: "먼저 연락해도 될 때가 따로 있을까",
    },
  },
  {
    id: "work",
    heading: "돈도 일도, 내 길을 찾고 싶을 때",
    caption: "적성 · 사업 · 돈의 길목",
    slugs: ["money", "business", "career"],
    hooks: {
      money: "버는데도 안 모이는 자리가 따로 있다",
      business: "혼자 밀고 나갈 힘이 얼마나 되나",
      career: "지금 하는 일이 내 결에 맞는 일인가",
    },
  },
  {
    id: "child",
    heading: "우리 아이는 어떤 가능성을 품었을까",
    caption: "입시 · 공부 · 진로 · 재능",
    slugs: ["child-admission", "child-study", "child-dream", "child-talent", "parent-child"],
    hooks: {
      "child-admission": "올해 고3이면, 어느 해에 기운이 차오르나",
      "child-study": "학원을 바꿀 게 아니라 방식을 바꿔야 하는 아이",
      "child-dream": "하고 싶은 게 없다는 아이, 정말 없는 걸까",
      "child-talent": "잘하는 게 뭔지 몰라 못 밀어 준 건 아닐까",
      "parent-child": "같은 말을 왜 이 아이만 저렇게 받아들일까",
    },
  },
  {
    id: "study",
    heading: "공부는 언제 터질까",
    caption: "붙는 시기와 맞는 방식",
    slugs: ["study"],
    hooks: {
      study: "머리가 아니라 때와 방식이 문제였다면",
    },
  },
];

/**
 * 주제별 묶음을 세로로 쌓는다.
 *
 * 맨 아래 "그 밖의 풀이" 묶음은 빠진 상품이 없게 하는 안전망이다. 운영 화면에서 새로
 * 만든 상품은 위의 기획된 묶음에 없으므로 거기서만 만날 수 있다. 위에 이미 나온 것은
 * 넣지 않는다 — 안전망이 중복을 다시 만들면 안 된다.
 *
 * 카드는 영상이다. 다만 열일곱 장을 한꺼번에 틀면 브라우저가 디코더를 아끼려고
 * 제멋대로 멈춰 세우므로, 화면에 들어온 카드만 재생한다(useInView).
 */
export function CategoryRails({ products }: { products: ReportProduct[] }) {
  const bySlug = new Map(products.map((product) => [product.slug, product]));
  const placed = new Set<string>();

  const groups = RAILS.map((rail) => {
    const items = rail.slugs.flatMap((slug) => {
      const item = bySlug.get(slug);
      if (!item || placed.has(slug)) return [];
      placed.add(slug);
      return [item];
    });
    return { ...rail, items };
  }).filter((rail) => rail.items.length > 0);

  const leftover = products.filter((product) => !placed.has(product.slug));

  return (
    <div className="flex flex-col gap-space-xl">
      {[
        ...groups,
        ...(leftover.length > 0
          ? [{ id: "all" as const, heading: "그 밖의 풀이", caption: "", items: leftover, hooks: undefined }]
          : []),
      ].map((rail) => (
        <section key={rail.id} id={`rail-${rail.id}`} className="flex scroll-mt-20 flex-col gap-space-md">
          <div className="flex flex-col gap-0.5 px-space-xs">
            <h3 className="font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-on-surface">
              {rail.heading}
            </h3>
            {rail.caption && <span className="font-body-sm text-body-sm text-outline">{rail.caption}</span>}
          </div>

          <ol className="flex flex-col gap-space-md">
            {rail.items.map((report) => (
              <li key={report.slug}>
                <RailCard report={report} hook={rail.hooks?.[report.slug]} />
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

function RailCard({ report, hook }: { report: ReportProduct; hook?: string }) {
  // 화면에 들어온 카드만 재생한다 (useInView 가 그 이유를 적어 두었다)
  const { ref, inView } = useInView<HTMLAnchorElement>();
  const poster = getPoster(report.slug, report.guide);
  const font = productFont(report.slug);

  return (
    <Link
      ref={ref}
      href={`/reports/${report.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-surface-container ring-1 ring-inset ring-white/[0.06] transition-transform duration-200 active:scale-[0.99]"
    >
      <div className="relative aspect-[5/3] w-full overflow-hidden bg-surface-container-low">
        {poster ? (
          <WebtoonMedia asset={poster} active={inView} className="absolute inset-0" />
        ) : (
          <div
            role="img"
            aria-label=""
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${STITCH_ASSETS[report.cover]}')` }}
          />
        )}
        <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

        <span
          className="absolute inset-x-space-lg bottom-space-md text-[2rem] leading-[1.1] tracking-tight text-white [text-shadow:0_1px_14px_rgb(0_0_0/0.6)]"
          style={font ? { fontFamily: font } : undefined}
        >
          {report.title}
        </span>
      </div>

      {/*
        카드 아래에는 한 줄만 둔다.
        전에는 세 줄이었다 — 줄 문구, 상품 한 줄, 그리고 「명식까지 무료로 보기」. 글자가
        세 줄이면 그림이 글에 눌린다. 내려가며 보는 사람은 세 줄을 읽지 않는다.
      */}
      <span className="line-clamp-2 px-space-lg py-space-md font-body-md text-body-md leading-relaxed text-on-surface-variant">
        {hook ?? report.tagline}
      </span>
    </Link>
  );
}
