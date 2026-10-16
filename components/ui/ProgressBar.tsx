// 프로필 완성도 등 진행률 막대
export function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className="h-2 w-full overflow-hidden rounded-full bg-track"
    >
      <span
        className="block h-full rounded-full bg-gradient-to-r from-primary to-gold shadow-[0_0_12px_-2px_var(--glow-gold)]"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// 단계 표시 (분석 허브 "3 of 6")
export function StepDots({ done, total }: { done: number; total: number }) {
  return (
    <ol className="flex items-center" aria-hidden>
      {Array.from({ length: total }, (_, i) => {
        const complete = i < done;
        return (
          <li key={i} className="flex flex-1 items-center last:flex-none">
            <span
              className={`flex size-8 shrink-0 items-center justify-center rounded-full border text-xs ${
                complete
                  ? "border-gold text-gold shadow-[0_0_12px_-2px_var(--glow-gold)]"
                  : "border-border-strong text-muted"
              }`}
            >
              {i + 1}
            </span>
            {i < total - 1 && (
              <span
                className={`h-px flex-1 ${complete && i + 1 < done ? "bg-gold" : "border-t border-dashed border-border-strong"}`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
