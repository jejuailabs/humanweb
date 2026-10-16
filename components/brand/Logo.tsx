// YEON 워드마크. O 자리에 초승달 고리와 별 (목업 기준)
export function Logo({ size = 28, tagline }: { size?: number; tagline?: string }) {
  return (
    <span className="inline-flex flex-col items-start leading-none">
      <span
        className="inline-flex items-center font-logo tracking-[0.18em] text-text"
        style={{ fontSize: size }}
      >
        YE
        <svg
          viewBox="0 0 40 40"
          aria-hidden
          className="mx-[0.06em] text-gold"
          style={{ width: size * 0.92, height: size * 0.92 }}
        >
          <defs>
            <linearGradient id="yeon-o" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="currentColor" stopOpacity="0.25" />
              <stop offset="0.55" stopColor="currentColor" />
              <stop offset="1" stopColor="currentColor" />
            </linearGradient>
          </defs>
          <circle cx="20" cy="20" r="16" fill="none" stroke="url(#yeon-o)" strokeWidth="2.4" />
          <path
            d="M20 12.5 L21.4 18.6 L27.5 20 L21.4 21.4 L20 27.5 L18.6 21.4 L12.5 20 L18.6 18.6 Z"
            fill="currentColor"
          />
        </svg>
        N
      </span>
      {tagline && (
        <span className="mt-1 pl-[0.2em] text-[9px] tracking-[0.4em] text-muted uppercase">
          {tagline}
        </span>
      )}
    </span>
  );
}
