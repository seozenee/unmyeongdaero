import { cn } from "@/lib/cn";

/** 만화 말풍선. 다크 톤 위에서 대비가 나도록 반전 색(inverse-surface) 종이 풍선을 쓴다 */
export function SpeechBalloon({
  children,
  tail = "bottom-left",
  className,
}: {
  children: React.ReactNode;
  tail?: "bottom-left" | "bottom-right" | "top-left" | "top-right" | "none";
  className?: string;
}) {
  const flip = tail === "bottom-right" || tail === "top-right";
  const top = tail === "top-left" || tail === "top-right";
  return (
    // 위치 클래스(absolute 등)는 바깥에, 꼬리 기준점(relative)은 안쪽에 둬서 서로 덮어쓰지 않게 한다
    <div className={cn("max-w-[82%]", className)}>
      <div className="relative motion-safe:animate-pop">
        <div className="rounded-[22px] bg-inverse-surface px-space-lg py-space-md font-body-lg text-body-lg font-semibold leading-snug text-inverse-on-surface shadow-2xl">
          {children}
        </div>
        {tail !== "none" && (
          <svg
            aria-hidden
            viewBox="0 0 30 22"
            className={cn(
              "absolute h-[22px] w-[30px] fill-inverse-surface",
              top ? "-top-[18px] -scale-y-100" : "-bottom-[18px]",
              flip ? "right-8 -scale-x-100" : "left-8",
            )}
          >
            <path d="M2 0 C 8 10 6 18 0 22 C 14 18 24 10 30 0 Z" />
          </svg>
        )}
      </div>
    </div>
  );
}

/**
 * 장면 위에 겹쳐 읽는 대사·내레이션 줄. 한 줄씩 차례로 떠오른다.
 * 배경이 어떤 그림이든 읽히도록 글자에 그림자를 깐다.
 */
export function WhisperLines({ lines, className }: { lines: string[]; className?: string }) {
  if (lines.length === 0) return null;
  return (
    <div className={cn("flex flex-col items-center gap-space-sm text-center", className)}>
      {lines.map((line, index) => (
        <p
          key={line}
          className="font-body-lg text-body-lg font-medium leading-relaxed text-on-surface motion-safe:animate-fade-up"
          style={{ animationDelay: `${index * 700}ms`, textShadow: "0 2px 12px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.9)" }}
        >
          {line}
        </p>
      ))}
    </div>
  );
}

/** 내레이션 캡션 박스 */
export function CaptionBox({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "max-w-[86%] border-l-2 border-tertiary bg-surface-container-lowest/80 px-space-md py-space-sm font-body-md text-body-md leading-relaxed text-on-surface backdrop-blur-sm motion-safe:animate-fade-up",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** 효과음 글자 */
export function SfxText({ children, rotate = -8, className }: { children: React.ReactNode; rotate?: number; className?: string }) {
  return (
    <span
      className={cn("inline-block motion-safe:animate-pop", className)}
      style={{ ["--sfx-rotate" as string]: `${rotate}deg`, transform: `rotate(${rotate}deg)` }}
    >
      <span
        className="block font-headline-xl text-headline-xl font-bold italic tracking-tight text-tertiary-fixed motion-safe:animate-shake"
        style={{ WebkitTextStroke: "1.5px rgba(0,0,0,0.65)", textShadow: "0 4px 0 rgba(0,0,0,0.55)" }}
      >
        {children}
      </span>
    </span>
  );
}
