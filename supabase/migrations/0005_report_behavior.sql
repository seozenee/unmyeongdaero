-- 상품을 코드가 아니라 DB 에서도 정의할 수 있게 넓힌다.
--
-- 지금까지 상품은 lib/reports/catalog.ts 에만 있었고, reports 테이블은 제목·가격 같은
-- 표시용 값만 들고 있었다. 그래서 새 상품을 팔려면 배포를 해야 했다.
--
-- 상품의 '행동'(목차, 질문, 쓰는 토픽, 안내자)도 결국 글자와 목록이라 데이터로 적을 수 있다.
-- 그 칸을 더해, 운영 화면에서 만든 상품이 코드 수정 없이 팔리게 한다.
--
-- 코드에 있는 열넷은 그대로 둔다(built-in). DB 행은 그 위에 덧씌우거나 새로 더한다.

alter table public.reports
  -- 카드에 붙는 배지 문구. 없으면 카테고리 이름을 쓴다
  add column if not exists category_label text,
  -- 안내자 (seoha | yunseul | doham)
  add column if not exists guide text,
  -- 명식 계산에 쓸 토픽 목록
  add column if not exists topics jsonb,
  -- none | optional | required
  add column if not exists partner text,
  -- 보고서 목차. AI 가 이 순서·제목으로 장을 쓴다
  add column if not exists chapters jsonb,
  -- 입력 대화에서 묻는 선택형 질문 [{ id, question, options[] }]
  add column if not exists questions jsonb,
  -- 자유 서술 질문 { prompt, placeholder }
  add column if not exists detail jsonb,
  -- 표지 이미지 키 (components/home/assets 의 키)
  add column if not exists cover text,
  -- 화면과 풀이에 반드시 붙일 고지
  add column if not exists disclaimer text,
  -- 운영 화면에서 만든 상품인지. 코드에 있는 상품과 구분해 수정 가능 여부를 가른다
  add column if not exists is_custom boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

create trigger reports_touch_updated_at
  before update on public.reports
  for each row execute function public.touch_updated_at();

-- 운영 화면만 쓰고 고객 화면은 서버에서 service_role 로 읽는다.
-- 누구나 읽을 수 있게 열어 두면 아직 공개하지 않은 상품까지 보이므로 열지 않는다.
