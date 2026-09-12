// PC 에서 좁은 모바일 컬럼만 가운데 뜨고 양옆이 비는 것을 메운다.
// 모바일(lg 미만)에서는 아무것도 그리지 않는다.
import tokens from "@/design/tokens.json";
import { Logo } from "@/components/ui/Logo";
import { GUIDES } from "@/lib/story/guides";

const c = tokens.colors;

const POINTS = [
  { title: "정통 명리 계산", body: "만세력 엔진으로 뽑은 여덟 글자 위에 풀이를 얹습니다." },
  { title: "구독 없는 단건 결제", body: "매달 빠져나가는 결제가 없고, 산 풀이는 보관함에 영구 소장됩니다." },
  { title: "근거를 밝히는 해석", body: "무엇을 보고 그렇게 읽었는지 명식의 근거를 함께 적습니다." },
];

export function DesktopFrame() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 hidden lg:block">
      {/* 배경 — 밤하늘 결 */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(1200px 700px at 18% 12%, ${c["on-primary-fixed"]} 0%, transparent 60%),
                       radial-gradient(900px 600px at 82% 78%, ${c["on-secondary-fixed"]} 0%, transparent 62%),
                       ${c["surface-container-lowest"]}`,
        }}
      />

      {/* 왼쪽 — 브랜드 소개 */}
      <div className="absolute left-0 top-1/2 hidden w-[clamp(18rem,26vw,26rem)] -translate-y-1/2 flex-col gap-space-lg pl-[clamp(2rem,5vw,5rem)] xl:flex">
        <div className="flex items-center gap-space-sm">
          <Logo className="h-10 w-10" />
          <div className="flex flex-col">
            <span className="font-headline-lg text-headline-lg leading-none text-on-surface">운명대로</span>
            <span className="mt-1 font-label-sm text-label-sm tracking-wider text-outline">unmyeongdaero.com</span>
          </div>
        </div>

        <p className="font-body-lg text-body-lg leading-relaxed text-on-surface-variant">
          현대인을 위한
          <br />
          가장 명쾌하고 솔직한
          <br />
          <span className="text-secondary">운명 리포트</span>
        </p>

        <ul className="flex flex-col gap-space-md border-t border-outline-variant/40 pt-space-lg">
          {POINTS.map((point, index) => (
            <li key={point.title} className="flex gap-space-sm">
              <span className="font-label-sm text-label-sm text-tertiary">{String(index + 1).padStart(2, "0")}</span>
              <span className="flex flex-col gap-0.5">
                <span className="font-label-md text-label-md text-on-surface">{point.title}</span>
                <span className="font-body-sm text-body-sm leading-relaxed text-outline">{point.body}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* 오른쪽 — 안내자 소개. 장식보다 실제 상품 내용으로 채운다 */}
      <div className="absolute right-0 top-1/2 hidden w-[clamp(17rem,23vw,23rem)] -translate-y-1/2 flex-col gap-space-lg pr-[clamp(2rem,5vw,5rem)] xl:flex">
        <div
          className="absolute -right-16 -top-24 h-56 w-56 rounded-full opacity-20 blur-3xl"
          style={{ background: c["primary-fixed"] }}
        />
        <span className="relative font-label-sm text-label-sm tracking-[0.25em] text-tertiary">GUIDES</span>
        <ul className="relative flex flex-col gap-space-lg">
          {Object.values(GUIDES).map((guide) => (
            <li key={guide.id} className="flex gap-space-sm">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-headline-md text-headline-md"
                style={{
                  background: c["surface-container-high"],
                  color: guide.accent === "primary" ? c.primary : guide.accent === "secondary" ? c.secondary : c.tertiary,
                }}
              >
                {guide.seal}
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="font-label-md text-label-md text-on-surface">{guide.title}</span>
                <span className="font-body-sm text-body-sm leading-relaxed text-outline">{guide.tagline}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
