// 웹툰 컷의 목록.
//
// WebtoonMedia 와 나눠 둔 이유가 있다. WebtoonMedia 는 영상을 재생하느라 "use client" 를
// 달고 있는데, 클라이언트 모듈에서는 컴포넌트 말고 평범한 함수를 서버 컴포넌트가 가져다
// 쓸 수 없다. 가져다 쓰면 런타임에 "is not a function" 으로 터진다 — 타입 검사로는 잡히지
// 않는 경계라, 아예 파일을 나눠 둔다.
import type { GuideId } from "@/lib/story/guides";
import manifest from "@/lib/story/webtoon-manifest.json";

export interface WebtoonAsset {
  image: string;
  video?: string;
}

const MANIFEST = manifest as Record<string, Record<string, WebtoonAsset> | undefined>;

export function getWebtoonAsset(guide: GuideId, key: string | undefined): WebtoonAsset | null {
  if (!key) return null;
  return MANIFEST[guide]?.[key] ?? null;
}
