# 운명대로 (unmyeongdaero.com)

sazu.app 명리 계산 API 위에 **웹툰형 진입 → 안내자와의 대화 입력 → 단건 결제 → AI 브리핑 + 보고서**를 얹은 사주 리포트 서비스.

- Next.js 14 (App Router) · TypeScript · Tailwind (디자인 토큰은 `design/` 원본에서 자동 추출)
- sazu.app v2 · Claude (`@anthropic-ai/sdk`, 기본 `claude-sonnet-5`) · Vercel AI SDK UI 스트리밍
- Supabase (Postgres + Kakao OAuth) · PortOne V2 결제 · Vercel 배포

## 로컬 실행

```bash
nvm use            # Node 24 (.nvmrc)
pnpm install
cp .env.example .env.local   # SAZU_API_KEY 만 넣어도 전체 흐름이 돈다
pnpm dev -p 3001
```

| 명령 | 설명 |
| --- | --- |
| `pnpm test` | vitest (sazu 클라이언트·명식 파서·9개 상품 보고서 생성 품질) |
| `pnpm typecheck` / `pnpm lint` | 타입·린트 |
| `pnpm tokens` | `design/code.html`·`DESIGN.md` → `design/tokens.json` 재생성 |
| `pnpm db:seed` | 카탈로그 → `supabase/migrations/0002_seed_reports.sql` 재생성 |
| `pnpm build` | 토큰·시드 최신 여부 확인 후 빌드 |

### 동작 모드

키가 없는 서비스는 **개발 환경(`NODE_ENV !== production`)에서만** 대체 구현으로 돈다. 프로덕션에서는 설정 누락 시 사용 시점에 에러가 난다(`lib/env.ts`).

| 서비스 | 키 있음 | 키 없음 (개발만) |
| --- | --- | --- |
| DB·로그인 | Supabase + 카카오 | `.data/local-db.json` + 개발용 로그인 |
| 결제 | PortOne V2 | 모의 결제창 |
| 풀이 생성 | Claude 구조화 출력 스트리밍 | 명리 데이터 문장 규칙 조합 보고서 |
| 명리 계산 | sazu Pro: 실제 계산 | sazu Free: 샘플 프로필 5종만 (입력 폼에 샘플 칩 표시) |

## 핵심 흐름

1. `/reports/[slug]` — 웹툰 인트로(코드로 그린 장면·캐릭터·말풍선·효과음·앰비언트 사운드) → 안내자와 대화하며 명식·상대·상황 질문 입력 → 결제 전 manse 로 명식 검증
2. `/checkout/[slug]` — 서버가 금액·결제 ID 확정 → PortOne 결제창 → 서버가 PortOne 에 재조회해 확정(+웹훅) → `purchases` 기록. 이미 소장한 리포트는 결제창 없이 결과로
3. `/reports/[slug]/read` — sazu 토픽 조회 → Claude 가 `{ briefing, headline, summary, sections[evidence], timeline, actions }` 스트리밍 → 말풍선 브리핑 → "보고서 펼쳐 보기" → 표지·목차·근거·시기표·실천 가이드 보고서(PDF 저장). 탭을 닫아도 생성은 끝까지 저장
4. `/consult` — 명식 입력 → 5,900원 세션 결제 → 20턴 채팅(`useChat`), 기록은 DB 기준, 실패 턴 자동 복구
5. `/library` — 소장 리포트·상담 기록
6. `/free/{today,dohwa,mbti}` — 로그인·결제 없는 무료 콘텐츠

## 외부 서비스 연동 절차

### Supabase
1. 프로젝트 생성 → `supabase/migrations/0001_init.sql`, `0002_seed_reports.sql` 을 SQL Editor 에서 순서대로 실행
2. Settings > API 의 URL·anon key·service_role key 를 환경변수에 입력 (service_role 은 서버 전용)
3. Authentication > URL Configuration: Site URL = 배포 도메인, Redirect URLs 에 `https://<도메인>/auth/callback` 추가

### 카카오 로그인
1. [Kakao Developers](https://developers.kakao.com) 앱 생성 → 카카오 로그인 활성화
2. Redirect URI: `https://<supabase-project>.supabase.co/auth/v1/callback`
3. 동의항목: 닉네임·프로필 사진 (이메일은 비즈 앱 전환 필요 — 필요 없으면 Supabase Kakao 설정에서 이메일 없이 사용)
4. REST API 키·Client Secret → Supabase > Authentication > Providers > Kakao 에 입력

### PortOne V2
1. 상점 생성 → 결제대행사 테스트 채널 추가 → Store ID·채널 키 확인
2. V2 API Secret 발급
3. 웹훅 URL `https://<도메인>/api/payments/webhook` 등록 → 웹훅 시크릿 확인

### Anthropic
- `ANTHROPIC_API_KEY` 입력. 거절 시 서버측 폴백(`fallbacks: "default"`)과 시스템 프롬프트 캐시가 켜져 있다.

### sazu.app
- 실고객 계산에는 **Pro 이상 플랜 키**가 필요하다(Free 키는 샘플 5종만 응답).

## 랜딩 전용 임시 배포

Supabase·PortOne 없이 마케팅 화면만 먼저 띄울 때 쓴다.

Vercel 환경변수에 아래 3개만 넣는다.

| 변수 | 값 |
| --- | --- |
| `LANDING_ONLY` | `1` |
| `NEXT_PUBLIC_SITE_URL` | 배포 도메인 |
| `SAZU_API_KEY` | 무료 콘텐츠(오늘의 운세 등)를 열어 둘 때만 |

동작:

- **열림** — 홈, 상품 상세(웹툰 인트로·대화 퍼널 포함), 무료 콘텐츠, 검색, 약관·개인정보·환불, `robots.txt`·`sitemap.xml`, 파비콘·OG 이미지
- **막힘** — 로그인·결제·보관함·상담·리포트 열람은 `/coming-soon` 으로 이동, 관련 API 는 503
- 인증 백엔드가 없으므로 `getCurrentUser()` 는 에러 대신 "비로그인"을 반환한다 (`LANDING_ONLY=1` 일 때만)

정식 오픈 시 `LANDING_ONLY` 를 지우고 Supabase·PortOne 키를 채우면 전체 기능이 열린다.

## 환경변수 체크리스트 (Vercel)

- [ ] `NEXT_PUBLIC_SITE_URL` (배포 도메인)
- [ ] `SAZU_API_KEY` (Pro 키)
- [ ] `ANTHROPIC_API_KEY` (· 선택 `ANTHROPIC_MODEL`)
- [ ] `SUPABASE_URL` · `SUPABASE_ANON_KEY` · `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `PORTONE_STORE_ID` · `PORTONE_CHANNEL_KEY` · `PORTONE_API_SECRET` · `PORTONE_WEBHOOK_SECRET`
- [ ] 카카오 REST API 키·Client Secret → Supabase 대시보드에 입력 (Vercel 환경변수 아님)

## 배포 전 체크리스트

- [x] 에러 바운더리 (`app/error.tsx`, `app/global-error.tsx`)
- [x] 404 페이지 (`app/not-found.tsx`) · 500 화면
- [x] `robots.txt` (`app/robots.ts`) · `sitemap.xml`
- [x] 이용약관·개인정보처리방침·환불규정 페이지와 푸터 링크
- [ ] 약관·개인정보처리방침·환불규정 **법률 검토 후 확정** (현재 초안)
- [x] 푸터·약관·개인정보·환불에 실제 사업자 정보 반영 (르노바 · 656-26-02081 · 제 2026-경기김포-0882 호)
- [x] 홈의 후기·평점·"지금 N명 열람 중" 목업 수치 제거 (표시광고법)
- [ ] 실구매 후기·평점 기능 구현 후 실데이터로 재노출
- [x] 로고를 코드로 그린 심볼로 교체 (`components/ui/Logo.tsx`) · 파비콘·OG 이미지 추가
- [ ] 남은 Stitch 임시 이미지 5장(배너·썸네일)을 자체 스토리지로 이전
- [ ] 웹툰 에셋 마저 생성 (fal.ai 잔액 충전 필요 — 서하 21/21 완료, 윤슬 17/21, 도담 7/21)
- [ ] 카카오톡 채널 1:1 상담 URL 연결
- [ ] PortOne 실채널 전환 · 소액 실결제/환불 테스트 · 웹훅 수신 확인
- [ ] Supabase RLS 정책 점검 · 백업 설정
- [ ] 무료 콘텐츠 API(`/api/free/*`) 호출량 제한(쿼터 보호) 검토
- [ ] 결제 취소 웹훅 수신 시 소장 권한 회수 정책 결정 (현재 미구현)

## 폴더 구조

```
app/(app)         서비스 화면 (홈·리포트·체크아웃·보관함·상담·무료·로그인)
app/(marketing)   약관·개인정보·환불
app/api           readings·checkout·payments·consult·saju·free
components/webtoon 웹툰 장면·캐릭터·말풍선·인트로
components/story   대화 퍼널·브리핑·말풍선
components/report  보고서 문서
components/saju    원국표·오행 레이더·대운 타임라인
lib/sazu           sazu.app 클라이언트(zod 검증·한글 에러)
lib/story          안내자·퍼널·프롬프트·보고서 스키마·템플릿 생성기
lib/db             저장소 인터페이스 (Supabase / 로컬 파일)
supabase/migrations 스키마·시드
```
