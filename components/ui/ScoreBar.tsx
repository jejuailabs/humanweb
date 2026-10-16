import type { ReactNode } from "react";

// 색 막대 (애정·금전·업무, 오행). color는 CSS 변수 이름: "love", "money", "wood" …
export type BarColor =
  | "love"
  | "money"
  | "work"
  | "wood"
  | "fire"
  | "earth"
  | "metal"
  | "water"
  | "primary"
  | "gold";

export function ScoreBar({
  label,
  value,
  max = 100,
  color,
  icon,
}: {
  label: string;
  value?: number;
  max?: number;
  color: BarColor;
  icon?: ReactNode;
}) {
  const pct = value === undefined ? 0 : Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="flex items-center gap-3">
      {icon && (
        <span className="shrink-0 [&>svg]:size-4" style={{ color: `var(--${color})` }}>
          {icon}
        </span>
      )}
      <span className="w-14 shrink-0 text-sm" style={{ color: `var(--${color})` }}>
        {label}
      </span>
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-track">
        <span
          className="block h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, color-mix(in srgb, var(--${color}) 70%, transparent), var(--${color}))`,
            boxShadow: `0 0 10px -2px var(--${color})`,
          }}
        />
      </span>
      <span className="w-8 shrink-0 text-right font-display text-base text-text">
        {value ?? "—"}
      </span>
    </div>
  );
}
