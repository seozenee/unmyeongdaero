// 안내자별 웹툰 배경 장면. 색은 design/tokens.json 에서만 가져오고, 움직임은 tailwind 키프레임으로 준다.
// 장소(place)마다 같은 세트를 다른 화각으로 잘라 보여 준다 — 멀리서 → 길 → 문 앞 → 건물 → 방 안.
import tokens from "@/design/tokens.json";
import { cn } from "@/lib/cn";
import type { GuideId } from "@/lib/story/guides";
import type { Camera, Place } from "@/lib/story/webtoon";

const c = tokens.colors;

interface Palette {
  skyTop: string;
  skyLow: string;
  glow: string;
  lamp: string;
  lampGlow: string;
  accent: string;
}

const PALETTE: Record<GuideId, Palette> = {
  seoha: {
    skyTop: c["on-primary-fixed"],
    skyLow: c["surface-container-lowest"],
    glow: c["primary-fixed"],
    lamp: c["tertiary-fixed"],
    lampGlow: c.tertiary,
    accent: c.primary,
  },
  yunseul: {
    skyTop: c["on-secondary-fixed"],
    skyLow: c["surface-container-lowest"],
    glow: c["secondary-fixed"],
    lamp: c["secondary-fixed-dim"],
    lampGlow: c["secondary-container"],
    accent: c.secondary,
  },
  doham: {
    skyTop: c["on-tertiary-fixed"],
    skyLow: c["surface-container-lowest"],
    glow: c["tertiary-fixed"],
    lamp: c["tertiary-fixed-dim"],
    lampGlow: c["tertiary-container"],
    accent: c.tertiary,
  },
};

// 새로고침해도 같은 자리에 뜨도록 결정적 난수
function seeded(count: number, seed: number) {
  let value = seed;
  const next = () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
  return Array.from({ length: count }, () => ({ x: next() * 390, y: next() * 400, r: next(), delay: next() * 5 }));
}

const STARS = seeded(56, 7);
const MOTES = seeded(22, 42);
const WINDOWS = seeded(26, 3);

const CAMERA: Record<Camera, string> = {
  wide: "motion-safe:animate-ken-burns",
  push: "motion-safe:animate-push-in",
  close: "motion-safe:animate-push-in",
  tilt: "motion-safe:animate-tilt",
};

/** 장소별 화각. 같은 그림을 다르게 잘라 카메라가 다가가는 느낌을 만든다. */
const VIEWBOX: Record<Place, string> = {
  far: "0 0 390 660",
  path: "60 300 270 360",
  gate: "0 0 390 660",
  house: "116 356 158 278",
  room: "0 0 390 660",
};

function Stars() {
  return (
    <g>
      {STARS.map((star, index) => (
        <circle
          key={index}
          cx={star.x}
          cy={star.y * 0.62}
          r={0.5 + star.r * 1.5}
          fill={c["primary-fixed"]}
          className="motion-safe:animate-twinkle"
          style={{ animationDelay: `${star.delay}s` }}
        />
      ))}
    </g>
  );
}

function Moon({ p }: { p: Palette }) {
  return (
    <g>
      <g className="motion-safe:animate-glow" style={{ transformOrigin: "298px 108px" }}>
        <circle cx="298" cy="108" r="126" fill={p.glow} opacity="0.34" filter="url(#sd-soft)" />
      </g>
      {/* 초승달: 큰 원에서 작은 원을 빼서 만든다 */}
      <path
        d="M334 78 A 40 40 0 1 0 334 150 A 32 32 0 1 1 334 78 Z"
        fill={p.glow}
        opacity="0.95"
        transform="rotate(-18 306 114)"
      />
    </g>
  );
}

function Clouds({ p }: { p: Palette }) {
  return (
    <g opacity="0.5">
      <g className="motion-safe:animate-drift" style={{ animationDuration: "26s" }}>
        <ellipse cx="120" cy="140" rx="130" ry="26" fill={p.skyTop} opacity="0.55" filter="url(#sd-soft)" />
        <ellipse cx="300" cy="196" rx="150" ry="22" fill={p.glow} opacity="0.1" filter="url(#sd-soft)" />
      </g>
      <g className="motion-safe:animate-drift" style={{ animationDuration: "34s", animationDelay: "-12s" }}>
        <ellipse cx="250" cy="96" rx="120" ry="20" fill={p.skyTop} opacity="0.45" filter="url(#sd-soft)" />
      </g>
    </g>
  );
}

/** 뒤로 겹쳐지는 산·숲 실루엣. 멀수록 옅게 둬서 깊이를 만든다. */
function Ridges({ p }: { p: Palette }) {
  return (
    <g>
      <path d="M-20 300 C 60 248 120 272 180 250 C 250 224 320 258 410 232 L410 420 L-20 420 Z" fill={p.skyTop} opacity="0.55" />
      <path d="M-20 348 C 70 312 130 334 196 316 C 268 296 330 322 410 300 L410 460 L-20 460 Z" fill={c["surface-container-low"]} opacity="0.8" />
      <path d="M-20 392 C 80 366 150 386 220 372 C 300 356 350 376 410 362 L410 520 L-20 520 Z" fill={c["surface-container-lowest"]} />
    </g>
  );
}

/** 나무 실루엣. 화면 양쪽 끝에 세워 프레임을 만든다. */
function Trees({ p }: { p: Palette }) {
  return (
    <g fill={c["surface-container-lowest"]}>
      <g className="motion-safe:animate-sway" style={{ transformOrigin: "0px 660px" }}>
        <path d="M-10 660 L-10 300 C 26 318 34 360 30 404 C 48 372 64 372 78 386 C 58 402 44 438 42 480 L54 660 Z" />
        <circle cx="26" cy="330" r="7" fill={p.accent} opacity="0.35" />
      </g>
      <g className="motion-safe:animate-sway" style={{ transformOrigin: "390px 660px", animationDelay: "-2.5s" }}>
        <path d="M400 660 L400 268 C 362 290 352 340 358 392 C 336 356 318 356 302 372 C 326 392 344 434 346 484 L340 660 Z" />
        <circle cx="364" cy="306" r="8" fill={p.accent} opacity="0.3" />
      </g>
    </g>
  );
}

function Fog() {
  return (
    <g>
      <g className="motion-safe:animate-drift">
        <path d="M-90 470 C 30 440 140 496 250 462 S 440 474 480 450 L480 540 L-90 540 Z" fill={c["on-surface"]} opacity="0.07" />
      </g>
      <g className="motion-safe:animate-drift" style={{ animationDelay: "-9s", animationDuration: "20s" }}>
        <path d="M-90 528 C 50 500 160 552 280 518 S 450 532 480 512 L480 600 L-90 600 Z" fill={c["on-surface"]} opacity="0.06" />
      </g>
    </g>
  );
}

function Fireflies({ color, count = 12 }: { color: string; count?: number }) {
  return (
    <g>
      {MOTES.slice(0, count).map((mote, index) => (
        <circle
          key={index}
          cx={mote.x}
          cy={500 + (mote.y % 140)}
          r={0.8 + mote.r * 1.4}
          fill={color}
          className="motion-safe:animate-rise"
          style={{ animationDelay: `${mote.delay * 1.6}s`, animationDuration: `${7 + mote.delay}s` }}
        />
      ))}
    </g>
  );
}

/** 불 켜진 창 한 칸. 창살 뒤로 빛이 번져 나온다. */
function Window({ x, y, size, p, seed }: { x: number; y: number; size: number; p: Palette; seed: { r: number; delay: number } }) {
  return (
    <g className="motion-safe:animate-flicker" style={{ animationDelay: `${seed.delay}s` }}>
      <circle cx={x + size / 2} cy={y + size / 2} r={size * 1.5} fill={p.lampGlow} opacity="0.2" filter="url(#sd-soft)" />
      <rect x={x} y={y} width={size} height={size} rx="1" fill={p.lamp} opacity={0.42 + seed.r * 0.4} />
      <path
        d={`M${x + size / 2} ${y} v${size} M${x} ${y + size / 2} h${size}`}
        stroke={c["surface-container-lowest"]}
        strokeWidth="1.4"
        opacity="0.85"
      />
      <rect x={x} y={y} width={size} height={size} rx="1" fill="none" stroke={c["surface-container-lowest"]} strokeWidth="1.6" />
    </g>
  );
}

/** 처마 밑에 거는 등롱 */
function Lantern({ x, y, p, delay = 0 }: { x: number; y: number; p: Palette; delay?: number }) {
  return (
    <g className="motion-safe:animate-float" style={{ animationDelay: `${delay}s` }}>
      <line x1={x} y1={y - 16} x2={x} y2={y - 6} stroke={c.outline} strokeWidth="1.2" />
      <circle cx={x} cy={y + 4} r="26" fill={p.lampGlow} opacity="0.35" filter="url(#sd-soft)" className="motion-safe:animate-flicker" />
      <ellipse cx={x} cy={y + 4} rx="7" ry="10" fill={p.lamp} opacity="0.92" />
    </g>
  );
}

/** 건물. 안내자마다 윤곽이 다르고, 창에서 새어 나온 빛이 앞마당에 떨어진다. */
function Estate({ guide, p }: { guide: GuideId; p: Palette }) {
  const roof = c["surface-container-low"];
  const ridge = c["surface-container-high"];

  return (
    <g>
      {/* 건물 뒤로 번지는 빛 */}
      <ellipse cx="195" cy="450" rx="160" ry="120" fill={p.lampGlow} opacity="0.24" filter="url(#sd-soft)" />

      {guide === "seoha" && (
        <g>
          {/* 한옥: 처마가 들린 지붕 두 겹 */}
          <path d="M104 420 Q 150 384 195 380 Q 240 384 286 420 Q 296 426 306 424 L 84 424 Q 94 426 104 420 Z" fill={roof} />
          <path d="M112 414 Q 152 392 195 389 Q 238 392 278 414" stroke={ridge} strokeWidth="2" fill="none" opacity="0.5" />
          <rect x="116" y="424" width="158" height="46" fill="url(#sd-wall)" />
          <path d="M92 470 Q 148 440 195 438 Q 242 440 298 470 Q 310 476 322 474 L 68 474 Q 80 476 92 470 Z" fill={roof} />
          <path d="M100 464 Q 150 446 195 444 Q 240 446 290 464" stroke={ridge} strokeWidth="2" fill="none" opacity="0.45" />
          <rect x="104" y="474" width="182" height="134" fill="url(#sd-wall)" />
          {/* 처마 그림자 */}
          <rect x="104" y="474" width="182" height="12" fill={c["surface-container-lowest"]} opacity="0.75" />
          {/* 기단 */}
          <rect x="92" y="602" width="206" height="12" fill={roof} />
          <Lantern x={122} y={486} p={p} />
          <Lantern x={268} y={486} p={p} delay={0.8} />
        </g>
      )}

      {guide === "yunseul" && (
        <g>
          {/* 작업실: 낮고 넓은 처마 + 등롱 줄 */}
          <path d="M86 452 Q 195 410 304 452 Q 316 458 328 456 L 62 456 Q 74 458 86 452 Z" fill={roof} />
          <path d="M96 446 Q 195 420 294 446" stroke={ridge} strokeWidth="2" fill="none" opacity="0.5" />
          <rect x="98" y="456" width="194" height="152" fill="url(#sd-wall)" />
          <rect x="98" y="456" width="194" height="10" fill={c["surface-container-lowest"]} opacity="0.75" />
          {[120, 160, 200, 240, 272].map((x, index) => (
            <Lantern key={x} x={x} y={474} p={p} delay={index * 0.4} />
          ))}
          <rect x="88" y="602" width="214" height="12" fill={roof} />
        </g>
      )}

      {guide === "doham" && (
        <g>
          {/* 서고: 높고 좁은 탑 */}
          <path d="M126 396 L195 352 L264 396 Z" fill={roof} />
          <path d="M195 352 L195 396" stroke={ridge} strokeWidth="2" opacity="0.4" />
          <rect x="130" y="396" width="130" height="212" fill="url(#sd-wall)" />
          <rect x="112" y="430" width="18" height="178" fill={roof} opacity="0.85" />
          <rect x="260" y="430" width="18" height="178" fill={roof} opacity="0.85" />
          <rect x="130" y="396" width="130" height="10" fill={c["surface-container-lowest"]} opacity="0.7" />
          <rect x="108" y="602" width="174" height="12" fill={roof} />
          <Lantern x={148} y={412} p={p} />
          <Lantern x={242} y={412} p={p} delay={0.6} />
        </g>
      )}

      {/* 창호 불빛 — 5칸씩 세 줄 */}
      {WINDOWS.slice(0, 15).map((cell, index) => {
        const column = index % 5;
        const row = Math.floor(index / 5);
        const x = 132 + column * 26;
        const y = 502 + row * 28;
        return <Window key={index} x={x} y={y} size={14} p={p} seed={cell} />;
      })}

      {/* 문 — 안에서 빛이 새어 나온다 */}
      <rect x="180" y="556" width="30" height="58" fill={c["surface-container-lowest"]} />
      <rect x="192" y="556" width="5" height="58" fill={p.lamp} opacity="0.55" className="motion-safe:animate-flicker" />

      {/* 앞마당에 떨어진 빛 */}
      <ellipse cx="195" cy="618" rx="120" ry="34" fill="url(#sd-spill)" />
    </g>
  );
}

/** 돌길. path 화각에서 문까지 이어지는 시선을 만든다. */
function Path({ p }: { p: Palette }) {
  return (
    <g>
      <path d="M150 614 L 176 470 L 214 470 L 240 614 Z" fill={c["surface-container-low"]} opacity="0.55" />
      {[0, 1, 2, 3, 4, 5].map((step) => {
        const y = 480 + step * 24;
        const half = 12 + step * 3.4;
        return <rect key={step} x={195 - half} y={y} width={half * 2} height="12" rx="2" fill={c["surface-container-high"]} opacity={0.24 + step * 0.05} />;
      })}
      {[
        [138, 560],
        [252, 548],
      ].map(([x, y]) => (
        <g key={x} className="motion-safe:animate-flicker">
          <circle cx={x} cy={y} r="30" fill={p.lampGlow} opacity="0.3" filter="url(#sd-soft)" />
          <rect x={x! - 5} y={y! - 8} width="10" height="16" rx="2" fill={p.lamp} />
          <line x1={x} y1={y! + 8} x2={x} y2={y! + 46} stroke={c["surface-container-lowest"]} strokeWidth="3" />
        </g>
      ))}
    </g>
  );
}

/** 문 앞 화각 전용 장면. 커다란 대문과 양쪽 석등. */
function Gate({ p }: { p: Palette }) {
  const stone = c["surface-container-lowest"];
  return (
    <g>
      <rect width="390" height="660" fill="url(#sd-sky)" />
      <Stars />
      <Moon p={p} />
      <Clouds p={p} />
      {/* 담장 */}
      <rect x="-10" y="250" width="410" height="410" fill={stone} />
      <rect x="-10" y="250" width="410" height="10" fill={c["surface-container-low"]} />
      {/* 기둥 */}
      <rect x="42" y="212" width="56" height="448" fill={c["surface-container-low"]} />
      <rect x="292" y="212" width="56" height="448" fill={c["surface-container-low"]} />
      <path d="M32 212 L 70 182 L 108 212 Z" fill={c["surface-container-high"]} />
      <path d="M282 212 L 320 182 L 358 212 Z" fill={c["surface-container-high"]} />
      {/* 석등 */}
      {[70, 320].map((x, index) => (
        <g key={x} className="motion-safe:animate-flicker" style={{ animationDelay: `${index * 0.7}s` }}>
          <circle cx={x} cy="300" r="56" fill={p.lampGlow} opacity="0.34" filter="url(#sd-soft)" />
          <rect x={x - 13} y="284" width="26" height="34" rx="3" fill={p.lamp} opacity="0.92" />
          <path d={`M${x - 20} 284 L ${x} 268 L ${x + 20} 284 Z`} fill={c["surface-container-high"]} />
        </g>
      ))}
      {/* 문짝 */}
      <g>
        <rect x="98" y="268" width="194" height="392" fill={c["surface-container-lowest"]} />
        <rect x="98" y="268" width="194" height="392" fill={p.lampGlow} opacity="0.07" />
        {Array.from({ length: 9 }, (_, index) => (
          <rect key={index} x={106 + index * 21} y="276" width="6" height="376" rx="3" fill={c["surface-container-high"]} opacity="0.75" />
        ))}
        <rect x="98" y="392" width="194" height="10" fill={c["surface-container-high"]} opacity="0.8" />
        {/* 문고리 */}
        <circle cx="168" cy="452" r="13" fill="none" stroke={p.lamp} strokeWidth="4" opacity="0.85" />
        <circle cx="222" cy="452" r="13" fill="none" stroke={p.lamp} strokeWidth="4" opacity="0.85" />
        {/* 문틈으로 새는 빛 */}
        <rect x="192" y="268" width="4" height="392" fill={p.lamp} opacity="0.5" className="motion-safe:animate-flicker" />
      </g>
      <Fog />
      <Fireflies color={p.accent} count={8} />
    </g>
  );
}

/** 방 안 화각. 창밖의 달, 등불, 책상 위 명식지. */
function Room({ guide, p }: { guide: GuideId; p: Palette }) {
  return (
    <g>
      <rect width="390" height="660" fill={c["surface-container-lowest"]} />
      {/* 창 */}
      <g>
        <path d="M226 96 q74 0 74 74 v212 h-148 v-212 q0 -74 74 -74 Z" fill="url(#sd-sky)" />
        <g clipPath="url(#sd-window)">
          <Stars />
          <Moon p={p} />
        </g>
        <path
          d="M226 96 q74 0 74 74 v212 h-148 v-212 q0 -74 74 -74 Z"
          fill="none"
          stroke={c["surface-container-low"]}
          strokeWidth="9"
        />
        <path d="M226 96 v286 M152 220 h148 M152 300 h148" stroke={c["surface-container-low"]} strokeWidth="6" />
      </g>
      {/* 등불 */}
      <g className="motion-safe:animate-float">
        <line x1="86" y1="0" x2="86" y2="150" stroke={c.outline} strokeWidth="1.5" />
        <circle cx="86" cy="182" r="66" fill={p.lampGlow} opacity="0.3" filter="url(#sd-soft)" className="motion-safe:animate-flicker" />
        <ellipse cx="86" cy="182" rx="26" ry="32" fill={p.lamp} opacity="0.9" />
        <ellipse cx="86" cy="182" rx="15" ry="26" fill={p.lampGlow} opacity="0.5" />
      </g>
      {/* 책상 */}
      <path d="M0 508 L390 486 L390 660 L0 660 Z" fill={c["surface-container-low"]} />
      <path d="M0 508 L390 486 L390 502 L0 524 Z" fill={c["surface-container-high"]} opacity="0.5" />
      {/* 명식지 */}
      <g className="motion-safe:animate-float" style={{ animationDuration: "7.5s" }}>
        <rect x="52" y="520" width="122" height="82" rx="2" fill={c["inverse-surface"]} opacity="0.9" transform="rotate(-5 113 561)" />
        {[0, 1, 2, 3].map((line) => (
          <path key={line} d={`M70 ${538 + line * 16} h84`} stroke={c.outline} strokeWidth="2" transform="rotate(-5 113 561)" />
        ))}
        <rect x="212" y="514" width="122" height="82" rx="2" fill={c["inverse-surface"]} opacity="0.82" transform="rotate(4 273 555)" />
        <rect x="300" y="560" width="20" height="20" fill={p.accent} opacity="0.8" transform="rotate(4 310 570)" />
      </g>
      {/* 촛불 */}
      <g className="motion-safe:animate-flicker">
        <circle cx="348" cy="486" r="40" fill={p.lampGlow} opacity="0.35" filter="url(#sd-soft)" />
        <rect x="342" y="470" width="12" height="30" rx="3" fill={c["inverse-surface"]} opacity="0.75" />
        <ellipse cx="348" cy="462" rx="5" ry="9" fill={p.lamp} />
      </g>
      {guide === "doham" && (
        // 서고 벽면 책들
        <g opacity="0.5">
          {Array.from({ length: 16 }, (_, index) => (
            <rect
              key={index}
              x={4 + (index % 8) * 15}
              y={index < 8 ? 300 : 366}
              width="12"
              height={index % 3 === 0 ? 56 : 48}
              fill={index % 3 === 1 ? c["tertiary-container"] : c["surface-container-high"]}
            />
          ))}
        </g>
      )}
      <Fireflies color={p.accent} count={6} />
    </g>
  );
}

/** far · path · house 가 공유하는 바깥 전경 */
function Exterior({ guide, p, place }: { guide: GuideId; p: Palette; place: Place }) {
  return (
    <g>
      <rect width="390" height="660" fill="url(#sd-sky)" />
      <Stars />
      <Moon p={p} />
      <Clouds p={p} />
      <Ridges p={p} />
      <Estate guide={guide} p={p} />
      {place !== "house" && <Path p={p} />}
      <Fog />
      <Trees p={p} />
      <Fireflies color={p.accent} />
    </g>
  );
}

export function SceneBackdrop({
  theme,
  camera = "wide",
  place = "far",
  className,
}: {
  theme: GuideId;
  camera?: Camera;
  place?: Place;
  className?: string;
}) {
  const p = PALETTE[theme];

  return (
    <div aria-hidden className={cn("absolute inset-0 overflow-hidden bg-surface-container-lowest", className)}>
      <svg viewBox={VIEWBOX[place]} preserveAspectRatio="xMidYMid slice" className={cn("h-full w-full", CAMERA[camera])}>
        <defs>
          <linearGradient id="sd-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={p.skyTop} />
            <stop offset="52%" stopColor={c["surface-container-low"]} />
            <stop offset="100%" stopColor={p.skyLow} />
          </linearGradient>
          <linearGradient id="sd-wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c["surface-container-low"]} />
            <stop offset="45%" stopColor={c["surface-container-high"]} />
            <stop offset="100%" stopColor={c["surface-container-low"]} />
          </linearGradient>
          <radialGradient id="sd-spill" cx="50%" cy="0%" r="80%">
            <stop offset="0%" stopColor={p.lampGlow} stopOpacity="0.45" />
            <stop offset="100%" stopColor={p.lampGlow} stopOpacity="0" />
          </radialGradient>
          <filter id="sd-soft" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="22" />
          </filter>
          <filter id="sd-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <clipPath id="sd-window">
            <path d="M226 96 q74 0 74 74 v212 h-148 v-212 q0 -74 74 -74 Z" />
          </clipPath>
        </defs>

        {place === "gate" ? <Gate p={p} /> : place === "room" ? <Room guide={theme} p={p} /> : <Exterior guide={theme} p={p} place={place} />}

        {/* 필름 그레인 — 평평한 벡터 면에 질감을 준다 */}
        <rect width="390" height="660" filter="url(#sd-grain)" opacity="0.05" style={{ mixBlendMode: "overlay" }} />
      </svg>
    </div>
  );
}
