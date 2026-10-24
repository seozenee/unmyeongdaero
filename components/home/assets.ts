// 상품 표지. 우리가 만든 웹툰 컷을 쓴다.
//
// 처음에는 design/code.html 에 들어 있던 Stitch 호스팅 이미지를 그대로 썼는데, 그건 임시
// 주소라 언제 만료될지 모른다. 어느 날 첫 화면의 그림이 통째로 사라지는 종류의 빚이다.
// 같은 세계관으로 만든 그림이 public/webtoon 에 있으므로 그쪽으로 옮긴다.
//
// 컷은 상품의 뜻에 맞춰 골랐다. 궁합은 나란히 놓인 두 명식표, 평생은 펼쳐지는 운명
// 두루마리처럼, 그림이 상품을 설명하게 둔다.
export const STITCH_ASSETS = {
  /** 월령의 밤 — 달빛 아래 한옥 대문 */
  highlightReunion: "/webtoon/seoha/intro-0.webp",
  /** 재회 — 입구로 이어지는 돌길 끝의 따뜻한 빛 */
  thumbReunion: "/webtoon/seoha/intro-1.webp",
  /** 연애 — 촛불 번짐 속의 안내자 */
  thumbLove: "/webtoon/yunseul/intro-5.webp",
  /** 궁합 — 나란히 놓인 두 장의 명식표 */
  thumbCompatibility: "/webtoon/yunseul/panel-second.webp",
  /** 평생 — 펼쳐지는 운명의 두루마리 */
  thumbLife: "/webtoon/doham/panel-unfold.webp",
  /** 공부 — 붓끝이 글자를 짚는 순간 */
  thumbStudy: "/webtoon/doham/panel-brush.webp",
  /** 우리 아이 — 등불을 든 안내자 */
  thumbChild: "/webtoon/yunseul/intro-3.webp",
  /** 입시 — 새벽 책상, 붉게 동그라미 친 달력 */
  thumbAdmission: "/webtoon/doham/cover-admission.webp",
  /** 진로 — 갈라지는 빛의 길 앞에 선 작은 신발 */
  thumbDream: "/webtoon/doham/cover-dream.webp",
  /** 영재 — 저마다 다른 빛을 품은 아이의 물건들 */
  thumbTalent: "/webtoon/yunseul/cover-talent.webp",
  /** 사업 — 장부와 저울이 놓인 한밤의 계산대 */
  thumbWork: "/webtoon/doham/cover-business.webp",
  /** ─ 상품 포스터 (첫 화면 큰 카드) ─ */
  posterDestinyFull: "/webtoon/doham/poster-destiny-full.webp",
  posterReunionDeep: "/webtoon/seoha/poster-reunion-deep.webp",
  posterChildAdmission: "/webtoon/doham/poster-child-admission.webp",
  posterCompatibility: "/webtoon/yunseul/poster-compatibility.webp",
  posterBusiness: "/webtoon/doham/poster-business.webp",
} as const;
