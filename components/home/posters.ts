// 첫 화면 큰 카드가 쓰는 포스터.
//
// 선반의 작은 표지(STITCH_ASSETS)와 따로 둔다. 작은 카드는 소품 컷이 어울리고,
// 큰 카드는 안내자의 얼굴이 앞에 나오는 세로 포스터라야 손이 멈춘다.
import { getWebtoonAsset, type WebtoonAsset } from "@/components/webtoon/assets";
import type { GuideId } from "@/lib/story/guides";

/** 상품 slug → 포스터 컷 키 */
const POSTER_KEY: Record<string, string> = {
  "destiny-full": "poster-destiny-full",
  "reunion-deep": "poster-reunion-deep",
  "child-admission": "poster-child-admission",
  compatibility: "poster-compatibility",
  business: "poster-business",
};

/** 포스터가 있으면 그림과(있다면) 영상을, 없으면 null */
export function getPoster(slug: string, guide: GuideId): WebtoonAsset | null {
  const key = POSTER_KEY[slug];
  return key ? getWebtoonAsset(guide, key) : null;
}

export const POSTER_SLUGS = Object.keys(POSTER_KEY);
