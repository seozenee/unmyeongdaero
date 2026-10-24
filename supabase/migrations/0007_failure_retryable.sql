-- 실패가 다시 눌러서 풀릴 종류인지.
--
-- 키가 거부당했거나 설정이 빠졌을 때는 몇 번을 눌러도 같은 자리에서 멈춘다.
-- 그 사실을 화면이 알아야, 되지 않을 일을 손님에게 권하지 않는다.
-- null 은 '모름' — 예전에 실패한 기록들은 지금까지처럼 재시도를 보여 준다.
alter table public.readings
  add column if not exists error_retryable boolean;
