import { CATEGORIES, COVERS, GUIDE_IDS, PARTNERS } from "@/lib/admin/products";
import { GUIDES } from "@/lib/story/guides";
import { SAZU_TOPICS } from "@/lib/sazu/schemas";

/** 폼의 선택지. 서버에서 만들어 클라이언트 폼으로 내려 준다 */
const CATEGORY_LABEL: Record<string, string> = {
  reunion: "재회", romance: "연애", chemistry: "궁합", destiny: "평생",
  year: "신년", wealth: "직업·재물", study: "학업",
};
const PARTNER_LABEL: Record<string, string> = {
  none: "받지 않음", optional: "선택 입력", required: "반드시 입력",
};
const TOPIC_LABEL: Record<string, string> = {
  manse: "만세력", today: "오늘", yearly: "올해", decade: "대운", life: "평생",
  compatibility: "궁합", love: "인연", money: "재물", health: "건강", consult: "상담",
};
const COVER_LABEL: Record<string, string> = {
  highlightReunion: "재회(큰 카드)", thumbReunion: "재회", thumbLove: "연애",
  thumbCompatibility: "궁합", thumbLife: "평생",
};

export const PRODUCT_FORM_OPTIONS = {
  categories: CATEGORIES.map((value) => ({ value, label: CATEGORY_LABEL[value] ?? value })),
  guides: GUIDE_IDS.map((value) => ({ value, label: GUIDES[value as keyof typeof GUIDES]?.name ?? value })),
  partners: PARTNERS.map((value) => ({ value, label: PARTNER_LABEL[value] ?? value })),
  covers: COVERS.map((value) => ({ value, label: COVER_LABEL[value] ?? value })),
  // manse 는 항상 함께 계산되므로 고를 필요가 없다
  topics: SAZU_TOPICS.filter((value) => value !== "manse").map((value) => ({
    value,
    label: TOPIC_LABEL[value] ?? value,
  })),
};
