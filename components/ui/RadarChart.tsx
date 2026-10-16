import { Lock } from "lucide-react";
import { useId } from "react";

// 10축 레이더 (05_STATS_AND_AI.md). 값이 없는 축은 잠금 표시.
// 값은 코드로 계산된 스탯만 넣는다.
export type RadarAxis = { key: string; label: string; value?: number };

export function RadarChart({ axes, size = 320 }: { axes: RadarAxis[]; size?: number }) {
  const id = useId();
  const c = 50;
  const R = 32;
  const n = axes.length;
  const point = (i: number, r: number) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [c + r * Math.cos(a), c + r * Math.sin(a)] as const;
  };
  const known = axes.every((a) => a.value !== undefined);
  const poly = axes
    .map((a, i) => point(i, ((a.value ?? 0) / 100) * R).join(","))
    .join(" ");

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="size-full" aria-hidden>
        <defs>
          <radialGradient id={`${id}-fill`} cx="0.3" cy="0.4" r="0.9">
            <stop offset="0" stopColor="var(--primary)" stopOpacity="0.55" />
            <stop offset="1" stopColor="var(--gold)" stopOpacity="0.45" />
          </radialGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((s) => (
          <circle key={s} cx={c} cy={c} r={R * s} fill="none" stroke="var(--line-faint)" strokeWidth="0.25" />
        ))}
        {axes.map((a, i) => {
          const [x, y] = point(i, R);
          return (
            <line
              key={a.key}
              x1={c}
              y1={c}
              x2={x}
              y2={y}
              stroke="var(--line-faint)"
              strokeWidth="0.25"
              strokeDasharray={a.value === undefined ? "0.8 0.8" : undefined}
            />
          );
        })}
        {axes.some((a) => a.value !== undefined) && (
          <>
            <polygon
              points={poly}
              fill={`url(#${id}-fill)`}
              stroke="var(--gold)"
              strokeWidth="0.5"
              opacity={known ? 1 : 0.6}
            />
            {axes.map((a, i) =>
              a.value === undefined ? null : (
                <circle
                  key={a.key}
                  cx={point(i, (a.value / 100) * R)[0]}
                  cy={point(i, (a.value / 100) * R)[1]}
                  r="0.9"
                  fill="var(--gold-soft)"
                />
              ),
            )}
          </>
        )}
      </svg>
      {axes.map((a, i) => {
        const [x, y] = point(i, R + 11);
        return (
          <div
            key={a.key}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center leading-tight"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <span className={`whitespace-nowrap text-[11px] ${a.value === undefined ? "text-muted" : "text-text"}`}>
              {a.label}
            </span>
            {a.value === undefined ? (
              <Lock className="mt-0.5 size-3 text-muted" aria-hidden />
            ) : (
              <span className="font-display text-base text-gold">{a.value}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
