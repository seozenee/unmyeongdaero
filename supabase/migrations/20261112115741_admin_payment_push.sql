-- Push subscription endpoints and encryption keys are server-side credentials.
create table public.admin_push_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  email text not null,
  endpoint text not null unique check (char_length(endpoint) <= 2048),
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index admin_push_devices_user_idx on public.admin_push_devices (user_id);

create table public.admin_payment_push_deliveries (
  payment_id uuid not null references public.payments (id) on delete cascade,
  device_id uuid not null references public.admin_push_devices (id) on delete cascade,
  lease_until timestamptz not null default 'epoch',
  sent_at timestamptz,
  primary key (payment_id, device_id)
);

create index admin_payment_push_deliveries_device_idx on public.admin_payment_push_deliveries (device_id);

alter table public.admin_push_devices enable row level security;
alter table public.admin_payment_push_deliveries enable row level security;

revoke all on public.admin_push_devices, public.admin_payment_push_deliveries from public, anon, authenticated;
grant select, insert, update, delete on public.admin_push_devices, public.admin_payment_push_deliveries to service_role;
