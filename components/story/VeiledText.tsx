import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

/**
 * 가린 글.
 *
 * `[[...]]` 로 묶인 자리는 흐려서 내보낸다. 결제하면 열리는 자리가 어디인지,
 * 글을 지우지 않고 그 자리에 둔 채로 보여 주는 방법이다.
 *
 * 통째로 가리면 "뭔가 더 있나 보다"로 끝나지만, 문장 한가운데 한 낱말만 가리면
 * 읽던 사람이 그 자리에서 멈춘다. 앞뒤가 읽히니까 가려진 것이 무엇인지 짐작은
 * 되는데 확인은 안 된다 — 그래서 멈춘다.
 *
 * 가린 글은 복사해 가지 못하게 선택을 막고, 읽어 주는 기계에게도 숨긴다.
 * 흐림은 그림이지 자물쇠가 아니므로, 진짜 본문은 애초에 여기까지 내려오지 않는다 —
 * 미리보기용으로 따로 쓴 글만 온다.
 */
export function VeiledText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/(\[\[[^\]]*\]\])/g).filter(Boolean);

  return (
    <p className={cn("whitespace-pre-line", className)}>
      {parts.map((part, index) => {
        const veiled = part.startsWith("[[") && part.endsWith("]]");
        if (!veiled) return <span key={index}>{part}</span>;
        return (
          <span key={index} aria-hidden className="veil-word">
            {part.slice(2, -2)}
          </span>
        );
      })}
    </p>
  );
}

/** 잠긴 자리라고 말해 두는 배지. 가린 글 옆에 하나만 붙인다 */
export function LockBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border border-[rgb(var(--accent)/0.5)]",
        "bg-[rgb(var(--accent)/0.14)] px-2.5 py-1 font-label-sm text-label-sm text-on-surface",
        className,
      )}
    >
      <Icon name="lock" className="text-[13px] leading-none" />
      결제 후 공개
    </span>
  );
}
