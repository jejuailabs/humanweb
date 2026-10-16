import { UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { GlassCard } from "@/components/ui/GlassCard";

const FILTERS = ["filterAll", "filterBusiness", "filterRegion", "filterSchool", "filterSimilar"] as const;

// 빈 궤도: 연결 데이터가 생기면 react-force-graph/sigma로 교체 (06_TECH_STACK.md)
const ORBIT_NODES = [
  { x: 18, y: 22, r: 3.2 },
  { x: 80, y: 18, r: 2.6 },
  { x: 88, y: 58, r: 3 },
  { x: 70, y: 86, r: 2.4 },
  { x: 24, y: 80, r: 2.8 },
  { x: 8, y: 52, r: 2.2 },
  { x: 50, y: 8, r: 2 },
];

export default function Page() {
  const t = useTranslations("pages.map");

  return (
    <div className="flex flex-col gap-5">
      <nav aria-label={t("filtersLabel")} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {FILTERS.map((key, i) => (
          <span
            key={key}
            className={`glass shrink-0 rounded-full border px-4 py-2 text-sm ${
              i === 0 ? "border-gold text-gold shadow-[0_0_14px_-4px_var(--glow-gold)]" : "border-border text-muted"
            }`}
          >
            {t(key)}
          </span>
        ))}
      </nav>

      <section className="relative aspect-square w-full">
        <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden>
          {[16, 28, 40].map((r) => (
            <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="var(--line-faint)" strokeWidth="0.3" strokeDasharray="1 1.4" />
          ))}
          {ORBIT_NODES.map((n, i) => (
            <g key={i}>
              <line x1="50" y1="50" x2={n.x} y2={n.y} stroke="var(--line-faint)" strokeWidth="0.25" strokeDasharray="0.8 1.2" />
              <circle cx={n.x} cy={n.y} r={n.r} fill="var(--surface-strong)" stroke="var(--border-strong)" strokeWidth="0.3" />
            </g>
          ))}
        </svg>
        <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
          <span className="flex size-24 items-center justify-center rounded-full border-2 border-gold bg-surface shadow-[0_0_40px_-4px_var(--glow-gold)]">
            <UserRound className="size-10 text-muted" strokeWidth={1} aria-hidden />
          </span>
          <span className="mt-2 font-display text-gold">{t("me")}</span>
        </div>
      </section>

      <GlassCard className="text-center">
        <h1 className="font-display text-2xl text-text">{t("title")}</h1>
        <p className="mt-2 text-sm text-muted">{t("empty")}</p>
      </GlassCard>
    </div>
  );
}
