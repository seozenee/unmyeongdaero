-- 상품 카드의 후킹 한 줄.
-- 제목은 간판(짧게), 태그라인은 손님을 붙잡는 줄, 설명은 무엇을 받는지 — 셋을 나눠 둔다.
alter table public.reports
  add column if not exists tagline text;
