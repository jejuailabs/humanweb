import type { ReactNode } from "react";

// 배지 칩 (MBTI·별자리·띠·혈액형). sub = 아래 작은 설명
export function Chip({
  icon,
  label,
  sub,
  tone = "default",
}: {
  icon?: ReactNode;
  label: string;
  sub?: string;
  tone?: "default" | "fate";
}) {
  const toneClass =
    tone === "fate" ? "border-fate-red/60 text-fate-red" : "border-border-strong text-text";
  return (
    <span
      className={`glass inline-flex items-center gap-2 rounded-full border px-3 py-1.5 ${toneClass}`}
    >
      {icon && <span className="shrink-0 [&>svg]:size-4">{icon}</span>}
      <span className="flex flex-col leading-tight">
        <span className="text-sm">{label}</span>
        {sub && <span className="text-[10px] text-muted">{sub}</span>}
      </span>
    </span>
  );
}
