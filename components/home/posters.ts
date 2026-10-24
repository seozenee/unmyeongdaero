// 첫 화면 큰 카드가 쓰는 포스터.
//
// 선반의 작은 표지(STITCH_ASSETS)와 따로 둔다. 작은 카드는 소품 컷이 어울리고,
// 큰 카드는 안내자의 얼굴이 앞에 나오는 세로 포스터라야 손이 멈춘다.
import { getWebtoonAsset, type WebtoonAsset } from "@/components/webtoon/assets";
import type { GuideId } from "@/lib/story/guides";

/** 상품 slug → 포스터 컷 키 */
// 상품 하나에 포스터 하나. 돌려 쓰지 않는다 — 카드가 나란히 놓이는 자리라
// 같은 그림이 두 번 나오면 바로 눈에 띈다.
const POSTER_KEY: Record<string, string> = {
  "reunion-deep": "poster-reunion-deep",
  reunion: "poster-reunion",
  love: "poster-love",
  consult: "poster-consult",
  compatibility: "poster-compatibility",
  "parent-child": "poster-parent-child",
  yearly: "poster-yearly",
  "child-talent": "poster-child-talent",
  "destiny-full": "poster-destiny-full",
  life: "poster-life",
  money: "poster-money",
  career: "poster-career",
  business: "poster-business",
  health: "poster-health",
  study: "poster-study",
  "child-study": "poster-child-study",
  "child-admission": "poster-child-admission",
  "child-dream": "poster-child-dream",
};

/** 포스터가 있으면 그림과(있다면) 영상을, 없으면 null */
export function getPoster(slug: string, guide: GuideId): WebtoonAsset | null {
  const key = POSTER_KEY[slug];
  return key ? getWebtoonAsset(guide, key) : null;
}

export const POSTER_SLUGS = Object.keys(POSTER_KEY);
