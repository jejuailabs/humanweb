import { useId } from "react";

// 빛나는 점수 링. 점수는 코드로 계산된 값만 넣는다 (절대 규칙 3). value가 없으면 "—"
export function ScoreRing({
  value,
  max = 100,
  size = 200,
  caption,
  showMax = true,
}: {
  value?: number;
  max?: number;
  size?: number;
  caption?: string;
  showMax?: boolean;
}) {
  const id = useId();
  const r = 44;
  const circumference = 2 * Math.PI * r;
  const ratio = value === undefined ? 0 : Math.max(0, Math.min(1, value / max));

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full -rotate-90" aria-hidden>
        <defs>
          <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--primary)" />
            <stop offset="0.6" stopColor="var(--gold)" />
            <stop offset="1" stopColor="var(--gold-soft)" />
          </linearGradient>
          <filter id={`${id}-f`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.2" />
          </filter>
        </defs>
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--track)" strokeWidth="2" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={`url(#${id}-g)`}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${circumference * ratio} ${circumference}`}
          filter={`url(#${id}-f)`}
          opacity="0.7"
        />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={`url(#${id}-g)`}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeDasharray={`${circumference * ratio} ${circumference}`}
        />
      </svg>
      <div className="relative flex flex-col items-center">
        {caption && (
          <span className="mb-1 text-[10px] tracking-[0.35em] text-muted uppercase">{caption}</span>
        )}
        <span
          className="font-display leading-none text-gold glow-text-gold"
          style={{ fontSize: size * 0.32 }}
        >
          {value ?? "—"}
        </span>
        {showMax && value !== undefined && (
          <span className="mt-1 font-display text-muted" style={{ fontSize: size * 0.08 }}>
            / {max}
          </span>
        )}
      </div>
    </div>
  );
}
