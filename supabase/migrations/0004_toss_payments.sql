-- 결제 대행을 포트원에서 토스페이먼츠 직접 연동으로 바꾼다.
--
-- payments.provider 에 걸린 체크 제약이 'portone' 만 허용하고 있어, 그대로 두면
-- 새 결제가 들어오는 순간 저장이 막힌다. 과거 행은 그대로 두고 허용값만 넓힌 뒤 옮긴다.

alter table public.payments drop constraint if exists payments_provider_check;

-- 이미 쌓인 포트원 결제 기록은 지우지 않는다. 환불·정산 근거로 남아야 한다.
alter table public.payments
  add constraint payments_provider_check
  check (provider in ('toss', 'portone', 'mock'));
