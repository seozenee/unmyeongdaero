// 코드로 그린 안내자 — 얼굴을 그리지 않고 역광 실루엣으로 세운다.
// 벡터로 이목구비를 흉내 내면 만화 캐릭터처럼 어색해지므로, 윤곽·머리칼·장신구와 림라이트로만 존재감을 준다.
// fal.ai 로 만든 일러스트가 준비되면 artSrc 로 교체한다.
import tokens from "@/design/tokens.json";
import { cn } from "@/lib/cn";
import type { Guide } from "@/lib/story/guides";

const c = tokens.colors;
const ACCENT = { primary: c.primary, secondary: c.secondary, tertiary: c.tertiary } as const;

const INK = c["surface-container-lowest"];

/** 어깨선 — 안쪽(검은 실루엣)과 바깥쪽(빛이 걸리는 테두리) */
const BODY = "M22 300 C 32 240 66 212 110 194 C 154 212 188 240 198 300 Z";
const BODY_RIM = "M15 300 C 26 235 63 206 110 187 C 157 206 194 235 205 300 Z";

/** 안내자마다 다른 머리 모양. 검은 머리 위에 장신구만 색으로 얹는다. */
function Hair({ guide, accent }: { guide: Guide; accent: string }) {
  switch (guide.id) {
    case "seoha":
      return (
        <>
          {/* 어깨 아래까지 흘러내린 긴 머리 */}
          <g className="motion-safe:animate-sway" style={{ transformOrigin: "110px 96px" }}>
            <path d="M62 140 C 52 198 50 250 44 300 L 90 300 C 84 240 78 188 80 152 Z" fill={INK} />
            <path d="M158 140 C 168 198 170 250 176 300 L 130 300 C 136 240 142 188 140 152 Z" fill={INK} />
          </g>
          {/* 정수리에서 내려오는 머리 */}
          <path d="M110 74 C 148 74 164 104 162 140 C 158 122 150 108 138 100 C 128 110 92 110 82 100 C 70 108 62 122 58 140 C 56 104 72 74 110 74 Z" fill={INK} />
          {/* 쪽진 머리 */}
          <circle cx="152" cy="88" r="15" fill={INK} />
          {/* 달 비녀 */}
          <g className="motion-safe:animate-sway" style={{ transformOrigin: "152px 88px" }}>
            <path d="M143 82 L 172 92" stroke={accent} strokeWidth="2.6" strokeLinecap="round" opacity="0.9" />
            <path d="M172 92 m-5 -3 a 7.5 7.5 0 1 0 9 -6 a 5.5 5.5 0 1 1 -9 6 Z" fill={accent} opacity="0.9" />
          </g>
        </>
      );
    case "yunseul":
      return (
        <>
          {/* 단발 */}
          <path d="M110 74 C 150 74 166 106 164 144 C 164 170 160 188 156 200 L 136 200 C 142 172 144 140 142 116 C 130 124 90 124 78 116 C 76 140 78 172 84 200 L 64 200 C 60 188 56 170 56 144 C 54 106 70 74 110 74 Z" fill={INK} />
          {/* 댕기 */}
          <g className="motion-safe:animate-sway" style={{ transformOrigin: "150px 150px" }}>
            <path d="M150 150 C 172 194 166 238 178 278" stroke={accent} strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.8" />
            <path d="M172 264 L 190 296 L 168 290 Z" fill={accent} opacity="0.8" />
          </g>
        </>
      );
    case "doham":
      return (
        <>
          <path d="M110 78 C 142 78 154 100 152 124 C 146 110 130 102 110 102 C 90 102 74 110 68 124 C 66 100 78 78 110 78 Z" fill={INK} />
          {/* 갓 */}
          <g className="motion-safe:animate-float" style={{ animationDuration: "6.5s" }}>
            <path d="M84 76 C 84 44 136 44 136 76 Z" fill={INK} />
            <ellipse cx="110" cy="76" rx="84" ry="11" fill={INK} />
            <path d="M86 66 H134" stroke={accent} strokeWidth="1.8" opacity="0.45" />
          </g>
        </>
      );
  }
}

export function GuideFigure({ guide, className, artSrc }: { guide: Guide; className?: string; artSrc?: string }) {
  if (artSrc) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={artSrc} alt={guide.title} className={cn("h-full w-auto object-contain", className)} />;
  }

  const accent = ACCENT[guide.accent];
  const id = `gf-${guide.id}`;

  return (
    <svg viewBox="0 0 220 300" className={cn("h-full w-auto overflow-visible", className)} role="img" aria-label={guide.title}>
      <defs>
        <radialGradient id={`${id}-aura`} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.3" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}-rim`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4.5" />
        </filter>
      </defs>

      {/* 뒤에서 번지는 빛 — 인물이 역광으로 서 있게 만든다 */}
      <ellipse
        cx="110"
        cy="140"
        rx="116"
        ry="146"
        fill={`url(#${id}-aura)`}
        className="motion-safe:animate-glow"
        style={{ transformOrigin: "110px 140px" }}
      />

      <g className="motion-safe:animate-breathe" style={{ transformOrigin: "110px 300px" }}>
        {/* 테두리 빛 — 검은 실루엣보다 한 겹 크게 깔고 흐린다 */}
        <g fill={accent} opacity="0.5" filter={`url(#${id}-rim)`}>
          <path d={BODY_RIM} />
          <ellipse cx="110" cy="132" rx="54" ry="62" />
        </g>

        {/* 불투명한 실루엣 — 여기서부터는 빛이 비치지 않는다 */}
        <path d={BODY} fill={INK} />
        <path d="M97 172 h26 v34 c0 10 -26 10 -26 0 Z" fill={INK} />
        <ellipse cx="110" cy="132" rx="50" ry="58" fill={INK} />

        <Hair guide={guide} accent={accent} />

        {/* 깃 — 옷의 결만 희미하게 */}
        <path d="M92 218 L 110 258 L 128 218" stroke={accent} strokeWidth="2.4" fill="none" strokeLinejoin="round" opacity="0.38" />

        {guide.id === "yunseul" && (
          // 붓
          <g transform="rotate(-24 168 256)">
            <rect x="164" y="200" width="8" height="88" rx="4" fill={INK} />
            <path d="M162 288 Q 168 310 174 288 Z" fill={accent} opacity="0.7" />
          </g>
        )}
      </g>
    </svg>
  );
}
