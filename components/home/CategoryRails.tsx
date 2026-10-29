"use client";

import Link from "next/link";
import { STITCH_ASSETS } from "@/components/home/assets";
import { getPoster } from "@/components/home/posters";
import { useInView } from "@/components/home/useInView";
import { Icon } from "@/components/ui/Icon";
import { WebtoonMedia } from "@/components/webtoon/WebtoonMedia";
import type { ReportCategory, ReportProduct } from "@/lib/reports/catalog";
import { productFont } from "@/lib/reports/fonts";
import { getPitch } from "@/lib/reports/pitch";

/**
 * 가로 줄의 목록.
 *
 * 분류로만 줄을 만들었더니 연애·궁합·신년·재물·공부가 카드 한 장짜리 줄이 됐다.
 * 한 장만 놓인 줄은 "밀 것이 없는 슬라이드" 라서, 채우려고 만든 줄이 오히려 비어
 * 보인다. 그래서 줄을 분류가 아니라 "그 고민을 가진 사람이 같이 보는 것" 으로 짠다.
 * 한 상품이 여러 줄에 나오는 것은 괜찮다 — 연애를 보는 사람이 궁합도 보는 게 자연스럽다.
 *
 * 제목은 분류명이 아니라 손님의 말이어야 한다. "재회" 보다 "다시 만날 수 있을까" 가
 * 먼저 읽힌다.
 *
 * id 는 위쪽 탭과 고민 바로가기가 내려와 멈추는 자리다.
 */
export const RAILS: ReadonlyArray<{
  id: ReportCategory | "all";
  heading: string;
  caption: string;
  /** 이 줄에 세울 상품. 앞에서부터 순서대로 */
  slugs: readonly string[];
  /**
   * 이 줄에서만 쓰는 한 줄.
   *
   * 상품은 열일곱 개고 줄은 아홉 개다. 겹치지 않을 수가 없다. 그런데 겹친 상품이
   * 어느 줄에서나 똑같은 문구를 달고 있으면, 줄을 여러 개 만든 뜻이 사라진다 —
   * 같은 것을 여러 번 늘어놓은 것처럼 보인다.
   *
   * 「우리 둘은?」에서 만나는 연애사주와 「나의 연애는?」에서 만나는 연애사주는
   * 같은 풀이지만 묻고 온 것이 다르다. 그 줄의 질문에 답하는 말을 여기 적는다.
   */
  hooks?: Readonly<Record<string, string>>;
}> = [
  {
    id: "child",
    heading: "우리 아이는?",
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
    id: "reunion",
    heading: "그 사람은?",
    caption: "속마음과 다시 닿는 때",
    slugs: ["reunion-deep", "reunion", "love", "compatibility"],
    hooks: {
      "reunion-deep": "잘 지내다 갑자기 식었다면, 그 자리가 어디인가",
      "reunion": "먼저 연락해도 될 때가 따로 있을까",
      "love": "그 사람이 아니라면, 다음은 언제 오나",
      "compatibility": "애초에 오래 갈 수 있는 둘이었나",
    },
  },
  {
    id: "romance",
    heading: "나의 연애는?",
    caption: "타고난 연애의 결",
    slugs: ["love", "compatibility", "reunion", "destiny-full"],
    hooks: {
      "love": "올 사람이 어떤 얼굴로 오는지 미리 알 수 있을까",
      "compatibility": "잘 만나다 꼭 같은 데서 틀어지는 이유",
      "reunion": "지난 사람이 다시 걸릴 때가 있다면 언제인가",
      "destiny-full": "연애만 안 풀리는 게 아니라면 — 전체를 본다",
    },
  },
  {
    id: "chemistry",
    heading: "우리 둘은?",
    caption: "부딪히는 자리와 닿는 말",
    slugs: ["compatibility", "parent-child", "love", "reunion-deep"],
    hooks: {
      "compatibility": "싸우는 이유가 성격일까, 기운일까",
      "parent-child": "아이에게 하는 말이 왜 늘 튕겨 나오나",
      "love": "나는 어떤 사람에게 약한 결인가",
      "reunion-deep": "멀어진 건 둘 중 누구의 때였나",
    },
  },
  {
    id: "destiny",
    heading: "내 인생은?",
    caption: "타고난 결과 큰 흐름",
    slugs: ["destiny-full", "life", "health", "yearly"],
    hooks: {
      "destiny-full": "타고난 결부터 말년까지, 끊지 않고 한 번에",
      "life": "지금이 올라가는 중인가, 내려가는 중인가",
      "health": "늘 같은 데가 먼저 지치는 이유",
      "yearly": "내년에 움직여도 되는 해인가",
    },
  },
  {
    id: "year",
    heading: "올해와 내년은?",
    caption: "달마다의 흐름",
    slugs: ["yearly", "destiny-full", "money", "career"],
    hooks: {
      "yearly": "내년 열두 달 중 어느 달이 내 달인가",
      "destiny-full": "한 해만 보지 말고 열 해를 보고 정할 일이라면",
      "money": "올해 들어올 돈과 새는 돈",
      "career": "옮길 거면 올해인가, 내년인가",
    },
  },
  {
    id: "wealth",
    heading: "내 돈은?",
    caption: "들어오는 길목과 새는 구멍",
    slugs: ["money", "business", "career", "life"],
    hooks: {
      "money": "버는데도 안 모이는 자리가 따로 있다",
      "business": "내 돈으로 벌 그릇인가, 남의 일로 벌 그릇인가",
      "career": "연봉이 오를 자리인가, 바꿔야 할 자리인가",
      "life": "돈이 붙는 때가 언제부터 열리나",
    },
  },
  {
    id: "work",
    heading: "내 일은?",
    caption: "적성 · 사업 · 움직일 때",
    slugs: ["career", "business", "money", "study"],
    hooks: {
      "career": "지금 하는 일이 내 결에 맞는 일인가",
      "business": "혼자 밀고 나갈 힘이 얼마나 되나",
      "money": "일을 바꾸면 돈이 따라오는 결인가",
      "study": "자격증·시험이 붙는 시기가 따로 있다",
    },
  },
  {
    id: "study",
    heading: "내 공부는?",
    caption: "붙는 시기와 맞는 방식",
    slugs: ["study", "child-study", "child-admission", "child-talent"],
    hooks: {
      "study": "머리가 아니라 때와 방식이 문제였다면",
      "child-study": "이 아이는 외워야 붙나, 이해해야 붙나",
      "child-admission": "입시가 걸린 해에 기운이 어디 있나",
      "child-talent": "공부 말고 뻗을 쪽이 있는 아이일까",
    },
  },
];

/** 한 줄에 최소 이만큼은 놓는다. 모자라면 같은 분류 → 그 밖의 상품으로 채운다 */
const MIN_PER_RAIL = 3;

/**
 * 주제별 가로 줄.
 *
 * 세로로는 주제만 훑고, 관심 있는 줄에서만 옆으로 민다. 찾는 사람에게도 구경하는
 * 사람에게도 길이 생긴다.
 *
 * 맨 아래 "모든 풀이" 줄은 빠진 상품이 없게 하는 안전망이다. 운영 화면에서 새로 만든
 * 상품은 위의 기획된 줄에 없으므로, 그 줄에서만 만날 수 있다.
 *
 * 카드는 영상이다. 다만 열일곱 장을 한꺼번에 틀면 브라우저가 디코더를 아끼려고
 * 제멋대로 멈춰 세우므로, 화면에 들어온 카드만 재생한다(useInView).
 */
export function CategoryRails({ products }: { products: ReportProduct[] }) {
  const bySlug = new Map(products.map((product) => [product.slug, product]));

  const rails = RAILS.map((rail) => {
    const picked: ReportProduct[] = [];
    const take = (item: ReportProduct | undefined) => {
      if (item && !picked.some((chosen) => chosen.slug === item.slug)) picked.push(item);
    };

    for (const slug of rail.slugs) take(bySlug.get(slug));
    // 기획된 상품이 지워졌거나 아직 없을 때. 줄이 한 장만 남는 것을 막는다
    if (picked.length < MIN_PER_RAIL) {
      for (const item of products.filter((product) => product.category === rail.id)) take(item);
    }
    if (picked.length < MIN_PER_RAIL) {
      for (const item of products) take(item);
    }
    return { ...rail, items: picked };
  }).filter((rail) => rail.items.length > 0);

  return (
    <div className="flex flex-col gap-space-xl">
      {[
        ...rails,
        ...(products.length > 0
          ? [
              {
                id: "all" as const,
                heading: "모든 풀이",
                caption: `${products.length}개 전부`,
                items: products,
                // 안전망 줄이라 따로 쓸 말이 없다 — 상품이 본래 달고 있는 한 줄을 쓴다
                hooks: undefined,
              },
            ]
          : []),
      ].map((rail) => (
        <section key={rail.id} id={`rail-${rail.id}`} className="flex scroll-mt-16 flex-col gap-space-sm">
          <div className="flex items-baseline gap-space-sm px-space-xs">
            <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">{rail.heading}</h3>
            {rail.caption && <span className="font-label-sm text-label-sm text-outline">{rail.caption}</span>}
          </div>

          <ol className="no-scrollbar -mx-margin flex snap-x gap-space-sm overflow-x-auto px-margin pb-1">
            {rail.items.map((report) => (
              <li key={report.slug} className="w-[58vw] max-w-[15rem] shrink-0 snap-start">
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
  const pitch = getPitch(report.slug);
  const font = productFont(report.slug);

  return (
    <Link
      ref={ref}
      href={`/reports/${report.slug}`}
      className="group flex h-full flex-col gap-space-xs transition-transform active:scale-[0.98]"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-surface-container shadow-xl">
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
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-surface-container-lowest/95 via-surface-container-lowest/45 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-0.5 px-space-sm pb-space-sm text-center">
          <span
            className="text-[1.7rem] leading-tight text-on-surface [text-shadow:0_2px_12px_rgb(0_0_0/0.95),0_0_18px_rgb(240_82_46/0.45)]"
            style={font ? { fontFamily: font } : undefined}
          >
            {report.title}
          </span>
        </div>
      </div>

      {/*
        줄 문구가 있으면 그것을 앞세운다. 같은 풀이라도 이 줄에 들른 사람이 묻고 온 것은
        다르다 — 「우리 둘은?」에서 만난 연애사주는 "나는 어떤 사람에게 약한가"를 묻는다.
        없으면 상품이 본래 달고 있는 한 줄로 돌아간다.
      */}
      <span className="line-clamp-2 px-0.5 font-body-md text-body-md leading-snug text-on-surface">
        {hook ?? report.tagline}
      </span>
      {hook ? (
        <span className="line-clamp-1 px-0.5 font-label-sm text-label-sm text-on-surface-variant">
          {report.tagline}
        </span>
      ) : (
        pitch && (
          <span className="flex items-start gap-1 px-0.5 font-label-sm text-label-sm leading-snug text-tertiary">
            <Icon name="check_small" className="mt-[-1px] shrink-0 text-[16px]" />
            <span className="line-clamp-2">{pitch.claims[0]}</span>
          </span>
        )
      )}
      {/*
        값은 여기 적지 않는다. 고르는 자리에서 값부터 보이면 무엇이 궁금한지가 아니라
        무엇이 싼지로 고르게 된다. 값은 결제 직전에 한 번만 보여 준다.
        그 자리에는 "돈 내기 전에 어디까지 보이는지"를 적는다 — 그게 사실이고, 들어올 이유다.
      */}
      <span className="mt-auto flex items-center gap-1 px-0.5 pt-0.5 font-label-sm text-label-sm text-tertiary">
        <Icon name="lock_open_right" className="text-[15px]" />
        명식까지 무료로 보기
        <Icon
          name="chevron_right"
          className="ml-auto text-[16px] text-outline transition-transform duration-200 group-hover:translate-x-0.5"
        />
      </span>
    </Link>
  );
}
