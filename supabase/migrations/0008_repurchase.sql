-- 같은 풀이를 다시 살 수 있게 한다.
--
-- 처음에는 "사용자당 리포트 1회"로 못 박아 두었다. 같은 것을 두 번 팔지 않겠다는 뜻이었다.
-- 그런데 실제로는 다시 사려는 사람이 있다. 아이가 둘이라 아이 사주를 두 번 보고 싶거나,
-- 상대가 바뀌어 궁합을 다시 보고 싶거나, 해가 바뀌어 신년운을 다시 보고 싶은 경우다.
-- 막아 두면 그 사람은 살 수 없고, 우리는 팔 수 없다.
--
-- 제약만 푼다. 결제 한 건당 구매 한 건(payment_id unique)은 그대로 둔다 — 그건 돈과
-- 물건이 어긋나지 않게 하는 쪽이라 풀면 안 된다.
--
-- 되돌리려면 중복을 정리한 뒤 제약을 다시 걸면 된다.
alter table public.purchases drop constraint if exists purchases_user_id_report_slug_key;

-- 같은 사람이 같은 상품을 여러 번 샀을 때 가장 최근 것을 빨리 찾기 위한 색인.
-- 화면은 늘 "마지막에 산 것"을 연다.
create index if not exists purchases_user_slug_recent_idx
  on public.purchases (user_id, report_slug, purchased_at desc);
