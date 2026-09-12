import { cn } from "@/lib/cn";

interface IconProps {
  /** Material Symbols Outlined 리거처 이름 (예: "star", "chevron_right") */
  name: string;
  className?: string;
  filled?: boolean;
}

export function Icon({ name, className, filled }: IconProps) {
  return (
    <span
      aria-hidden
      className={cn("material-symbols-outlined", className)}
      style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
    >
      {name}
    </span>
  );
}
