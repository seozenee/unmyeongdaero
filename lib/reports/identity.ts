import { getReport, type ReportProduct } from "./catalog";

// 이전 카탈로그의 질문형 간판. 의도적으로 바꾼 새 상품명이나 가격은 덮어쓰지 않는다.
const LEGACY_TITLES: Record<string, string> = {
  "reunion-deep": "그 사람은 왜 연락을 멈췄을까?",
  "reunion": "우리 다시 만날 수 있을까?",
  "love": "내 사랑은 언제 올까?",
  "compatibility": "우리 둘은 잘 맞을까?",
  "destiny-full": "나는 무얼 가지고 태어났을까?",
  "life": "내 인생은 어떻게 흘러갈까?",
  "yearly": "내년엔 무슨 일이 생길까?",
  "money": "나는 돈을 어떻게 벌까?",
  "career": "나에게 맞는 일은 뭘까?",
  "health": "내 몸은 어디가 약할까?",
  "study": "나는 언제 공부가 터질까?",
  "child-study": "우리 아이는 어떻게 공부해야 할까?",
  "parent-child": "우리 아이와 왜 자꾸 부딪힐까?",
  "business": "나는 사업을 해도 될까?",
  "child-admission": "우리 아이는 어느 대학에 갈까?",
  "child-dream": "우리 아이는 뭐가 되고 싶을까?",
  "child-talent": "우리 아이는 어떤 재능이 있을까?",
};

export function normalizeReportIdentity(product: ReportProduct): ReportProduct {
  const builtIn = getReport(product.slug);
  if (builtIn && product.title === LEGACY_TITLES[product.slug]) return { ...product, title: builtIn.title };
  return product;
}
