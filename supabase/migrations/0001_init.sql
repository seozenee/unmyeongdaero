-- 운명대로 초기 스키마
-- 원칙: 크레딧/잔액 없음. 리포트는 사용자당 1회 구매로 영구 언락(purchases), AI 상담은 결제 1건 = 세션 1개(consult_sessions).
-- 쓰기는 모두 서버(service_role)에서만 수행하므로 RLS 는 "본인 행 조회"만 허용한다.

create extension if not exists pgcrypto;

-- ─── 상품 ────────────────────────────────────────────────────────────────────
create table public.reports (
  slug text primary key,
  kind text not null default 'report' check (kind in ('report', 'consult')),
  category text not null,
  title text not null,
  price integer not null check (price > 0),
  original_price integer check (original_price is null or original_price >= price),
  discount_label text,
  description text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ─── 풀이 요청(스토리 입력 + 생성 결과) ──────────────────────────────────────
create table public.readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  report_slug text not null references public.reports (slug),
  subject jsonb not null,
  partner jsonb,
  answers jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'generating', 'ready', 'failed')),
  sazu jsonb,
  script jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  generated_at timestamptz
);
create index readings_user_idx on public.readings (user_id, created_at desc);

-- ─── 결제(PG 거래) ───────────────────────────────────────────────────────────
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  payment_id text not null unique,             -- 서버가 발급해 PortOne 에 넘긴 결제 ID
  provider text not null check (provider in ('portone', 'mock')),
  pg_transaction_id text,
  user_id uuid not null references auth.users (id) on delete cascade,
  report_slug text not null references public.reports (slug),
  reading_id uuid references public.readings (id) on delete set null,
  amount integer not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'cancelled')),
  failure_reason text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index payments_user_idx on public.payments (user_id, created_at desc);

-- ─── 리포트 구매(영구 소장) ──────────────────────────────────────────────────
create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  report_slug text not null references public.reports (slug),
  payment_id uuid not null unique references public.payments (id),
  reading_id uuid references public.readings (id) on delete set null,
  purchased_at timestamptz not null default now(),
  unique (user_id, report_slug)                -- 사용자당 리포트 1회
);

-- ─── AI 상담 ────────────────────────────────────────────────────────────────
create table public.consult_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  payment_id uuid not null unique references public.payments (id),
  subject jsonb not null,
  sazu jsonb,
  turn_limit integer not null default 20 check (turn_limit > 0),
  turns_used integer not null default 0 check (turns_used >= 0 and turns_used <= turn_limit),
  created_at timestamptz not null default now(),
  last_message_at timestamptz
);
create index consult_sessions_user_idx on public.consult_sessions (user_id, created_at desc);

create table public.consult_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.consult_sessions (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);
create index consult_messages_session_idx on public.consult_messages (session_id, created_at);

-- 턴 차감은 원자적으로: 남은 턴이 있을 때만 1 증가, 차감 후 남은 턴 수 반환(없으면 null)
create or replace function public.consume_consult_turn(p_session_id uuid, p_user_id uuid)
returns integer
language sql
security definer
set search_path = public
as $$
  update public.consult_sessions
     set turns_used = turns_used + 1,
         last_message_at = now()
   where id = p_session_id
     and user_id = p_user_id
     and turns_used < turn_limit
  returning turn_limit - turns_used;
$$;
revoke all on function public.consume_consult_turn(uuid, uuid) from public, anon, authenticated;

-- 생성 실패 시 턴 복구
create or replace function public.refund_consult_turn(p_session_id uuid, p_user_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.consult_sessions
     set turns_used = greatest(turns_used - 1, 0)
   where id = p_session_id
     and user_id = p_user_id;
$$;
revoke all on function public.refund_consult_turn(uuid, uuid) from public, anon, authenticated;

-- ─── updated_at ────────────────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger readings_touch before update on public.readings
  for each row execute function public.touch_updated_at();
create trigger payments_touch before update on public.payments
  for each row execute function public.touch_updated_at();

-- ─── RLS ─────────────────────────────────────────────────────────────────────
alter table public.reports enable row level security;
alter table public.readings enable row level security;
alter table public.payments enable row level security;
alter table public.purchases enable row level security;
alter table public.consult_sessions enable row level security;
alter table public.consult_messages enable row level security;

create policy "reports: 누구나 조회" on public.reports
  for select using (true);

create policy "readings: 본인 조회" on public.readings
  for select to authenticated using (user_id = (select auth.uid()));

create policy "payments: 본인 조회" on public.payments
  for select to authenticated using (user_id = (select auth.uid()));

create policy "purchases: 본인 조회" on public.purchases
  for select to authenticated using (user_id = (select auth.uid()));

create policy "consult_sessions: 본인 조회" on public.consult_sessions
  for select to authenticated using (user_id = (select auth.uid()));

create policy "consult_messages: 본인 세션 조회" on public.consult_messages
  for select to authenticated using (
    exists (
      select 1 from public.consult_sessions s
       where s.id = consult_messages.session_id
         and s.user_id = (select auth.uid())
    )
  );
