-- 알림톡 수신 정보와, 카톡으로 보낼 PDF 의 자리.
--
-- 두 가지를 더한다.
--  1) readings.notify_phone — 알림톡은 전화번호로만 간다. 지금까지는 어디에도 없었다.
--  2) readings.pdf_* — 구운 PDF 를 스토리지에 두고, 우리 도메인의 짧은 주소로 열어 준다.
--
-- PDF 를 왜 우리 도메인을 거쳐 여는가: 카카오는 알림톡 버튼의 링크 도메인을 심사한다.
-- 스토리지의 서명 주소(supabase.co)를 그대로 넣으면 등록한 도메인과 달라 반려되고,
-- 서명 주소는 만료되므로 템플릿에 고정할 수도 없다. 그래서 /r/{token} 으로 받아
-- 그때그때 새 서명 주소로 넘긴다.

alter table public.readings
  -- 하이픈 없는 숫자만 담는다 (01012345678)
  add column if not exists notify_phone text,
  -- 전화번호를 받아 둔 시점. 개인정보 수집 동의 시각이기도 하다.
  add column if not exists notify_consent_at timestamptz,
  -- 마지막으로 보낸 알림의 종류 — 같은 알림을 두 번 보내지 않기 위해
  add column if not exists notified_kind text,
  -- 스토리지 안의 경로 (reports/{reading_id}.pdf)
  add column if not exists pdf_path text,
  -- /r/{token} 의 token. 추측할 수 없는 값이어야 한다.
  add column if not exists pdf_token text,
  add column if not exists pdf_created_at timestamptz;

create unique index if not exists readings_pdf_token_idx on public.readings (pdf_token)
  where pdf_token is not null;

-- ─── PDF 를 담을 버킷 ────────────────────────────────────────────────────────
-- 비공개다. 누구도 직접 열 수 없고, 서버가 서명한 주소로만 열린다.
insert into storage.buckets (id, name, public)
values ('reports', 'reports', false)
on conflict (id) do nothing;

-- 버킷에는 서버(service_role)만 쓴다. 로그인한 사용자라도 스토리지를 직접 뒤질 수는 없고,
-- 반드시 /r/{token} 을 거치게 한다. 그래야 "구매한 본인인가"를 앱이 판단할 수 있다.
drop policy if exists "reports 버킷은 서버만" on storage.objects;
create policy "reports 버킷은 서버만"
  on storage.objects for all
  to service_role
  using (bucket_id = 'reports')
  with check (bucket_id = 'reports');
