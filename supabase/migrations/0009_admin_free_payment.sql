-- 운영자 무료 발급(0원 주문)을 허용한다.
--
-- payments.amount 에 `check (amount > 0)` 이 걸려 있었다. 손님 결제만 생각했을 때는
-- 맞는 제약이다 — 0원 주문이 쌓이면 매출이 흐려진다.
--
-- 그런데 운영자가 열여덟 상품을 검수하려면 매번 실제로 결제하거나 FREE_ACCESS 를 켜야
-- 했다. 앞의 것은 돈이 들고, 뒤의 것은 손님에게도 공짜가 된다. 그래서 운영자 계정에만
-- 0원 주문을 내주기로 했는데, 이 제약이 그 입력을 막아 "결제를 준비하지 못했어요"로
-- 돌아왔다.
--
-- 0원을 허용하되 음수는 그대로 막는다. 환불은 결제 취소(status)로 기록하지 금액을
-- 음수로 적지 않는다. 0원 주문은 provider='mock' 과 pg_transaction_id='admin_free_…'
-- 로 남으므로 매출 집계에서 그대로 걸러진다.
--
-- 되돌리려면 0원 주문을 지운 뒤 제약을 다시 `amount > 0` 으로 걸면 된다.
alter table public.payments drop constraint if exists payments_amount_check;

alter table public.payments
  add constraint payments_amount_check
  check (amount >= 0);
