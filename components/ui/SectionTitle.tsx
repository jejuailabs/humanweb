import type { ReactNode } from "react";

// 반짝이 + 세리프 제목 (목업의 "My Personality Map" 스타일)
export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Sparkle className="size-4 text-gold" />
      <h2 className="font-display text-lg text-text">{children}</h2>
      <span className="h-px flex-1 bg-gradient-to-r from-border-strong to-transparent" />
      {action}
    </div>
  );
}

export function Sparkle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M12 2 L13.6 10.4 L22 12 L13.6 13.6 L12 22 L10.4 13.6 L2 12 L10.4 10.4 Z" />
    </svg>
  );
}

// 가운데 장식이 있는 구분선
export function OrnamentDivider() {
  return (
    <div className="my-5 flex items-center gap-3 text-gold" aria-hidden>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-border-strong" />
      <Sparkle className="size-3" />
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-border-strong" />
    </div>
  );
}
