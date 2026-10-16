"use client";

import { UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Gate, Loading } from "@/components/auth/Gate";
import { BUTTON_CLASS } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Link } from "@/i18n/navigation";
import { useApi } from "@/lib/client/api";

const FILTERS = [
  ["all", "filterAll"],
  ["business", "filterBusiness"],
  ["region", "filterRegion"],
  ["school", "filterSchool"],
  ["similar", "filterSimilar"],
] as const;

type Node = {
  uid: string;
  nickname: string;
  title: string | null;
  score: number;
  line: "faint" | "strong" | "fate";
  reasons: { business: string | null; region: string | null; school: string | null };
};
type MapResp = { nodes: Node[]; needsOptIn?: boolean; needsAnalysis?: boolean; me?: { nickname: string } };

// 선 색: 흐린 선 / 진한 선 / 빨간 선(특별한 인연 전용) — 09_MATCHING.md
const LINE = {
  faint: { stroke: "var(--line-faint)", width: 0.3 },
  strong: { stroke: "var(--line-strong)", width: 0.5 },
  fate: { stroke: "var(--fate-red)", width: 0.7 },
};

export function MapView() {
  return <Gate>{() => <MapInner />}</Gate>;
}

function MapInner() {
  const t = useTranslations("pages.map");
  const [filter, setFilter] = useState<(typeof FILTERS)[number][0]>("all");
  const [picked, setPicked] = useState<Node | null>(null);
  const { data, isLoading } = useApi<MapResp>(`/api/map?filter=${filter === "similar" ? "all" : filter}`);

  return (
    <div className="flex flex-col gap-5">
      <nav aria-label={t("filtersLabel")} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {FILTERS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-pressed={filter === key}
            onClick={() => setFilter(key)}
            className={`glass shrink-0 rounded-full border px-4 py-2 text-sm ${filter === key ? "border-gold text-gold shadow-[0_0_14px_-4px_var(--glow-gold)]" : "border-border text-muted"}`}
          >
            {t(label)}
          </button>
        ))}
      </nav>

      {isLoading ? (
        <Loading />
      ) : data?.needsOptIn ? (
        <GlassCard variant="violet" className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="font-display text-xl text-text">{t("optInTitle")}</p>
          <p className="text-sm text-muted">{t("optInDesc")}</p>
          <Link href="/me" className={BUTTON_CLASS.violet}>{t("optInCta")}</Link>
        </GlassCard>
      ) : data?.needsAnalysis ? (
        <GlassCard className="py-8 text-center text-sm text-muted">{t("needAnalysis")}</GlassCard>
      ) : (
        <Orbit nodes={data?.nodes ?? []} meName={data?.me?.nickname ?? t("me")} onPick={setPicked} />
      )}

      {picked ? (
        <GlassCard variant={picked.line === "fate" ? "default" : "violet"} className={picked.line === "fate" ? "border-fate-red/60" : ""}>
          <p className="font-display text-2xl text-text">{picked.nickname}</p>
          {picked.title && <p className="text-sm text-gold">{picked.title}</p>}
          <p className="mt-2 text-sm text-text">{t("score", { score: picked.score })}{picked.line === "fate" && <span className="ml-2 text-fate-red">{t("fate")}</span>}</p>
          <ul className="mt-2 flex flex-col gap-1 text-xs text-muted">
            <li>✦ {t("reasonStats")}</li>
            {picked.reasons.business && <li>✦ {t("reasonBusiness", { value: picked.reasons.business })}</li>}
            {picked.reasons.region && <li>✦ {t("reasonRegion", { value: picked.reasons.region })}</li>}
            {picked.reasons.school && <li>✦ {t("reasonSchool", { value: picked.reasons.school })}</li>}
          </ul>
          <p className="mt-3 text-xs text-muted">{t("connectSoon")}</p>
        </GlassCard>
      ) : (
        !data?.needsOptIn && !data?.needsAnalysis && !isLoading && (
          <GlassCard className="text-center">
            <h1 className="font-display text-2xl text-text">{t("title")}</h1>
            {!data?.nodes.length && <p className="mt-2 text-sm text-muted">{t("empty")}</p>}
          </GlassCard>
        )
      )}
    </div>
  );
}

// 나를 가운데 두고 점수가 높을수록 가까운 궤도에 배치
function Orbit({ nodes, meName, onPick }: { nodes: Node[]; meName: string; onPick: (n: Node) => void }) {
  const placed = nodes.map((n, i) => {
    const angle = (i / Math.max(nodes.length, 1)) * Math.PI * 2 - Math.PI / 2 + (i % 2) * 0.25;
    const r = 18 + ((100 - n.score) / 50) * 24;
    return { n, x: 50 + r * Math.cos(angle), y: 50 + r * Math.sin(angle) };
  });
  return (
    <section className="relative aspect-square w-full">
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden>
        {[16, 28, 40].map((r) => (
          <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="var(--line-faint)" strokeWidth="0.3" strokeDasharray="1 1.4" />
        ))}
        {placed.map(({ n, x, y }) => (
          <line key={n.uid} x1="50" y1="50" x2={x} y2={y} stroke={LINE[n.line].stroke} strokeWidth={LINE[n.line].width} strokeDasharray={n.line === "faint" ? "0.8 1.2" : undefined} />
        ))}
      </svg>
      {placed.map(({ n, x, y }) => (
        <button
          key={n.uid}
          type="button"
          onClick={() => onPick(n)}
          className={`absolute flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 bg-surface-strong text-xs text-text ${n.line === "fate" ? "border-fate-red shadow-[0_0_16px_-2px_var(--fate-red)]" : n.line === "strong" ? "border-gold" : "border-border-strong"}`}
          style={{ left: `${x}%`, top: `${y}%` }}
          aria-label={n.nickname}
        >
          {n.nickname.slice(0, 2)}
        </button>
      ))}
      <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
        <span className="flex size-24 items-center justify-center rounded-full border-2 border-gold bg-surface shadow-[0_0_40px_-4px_var(--glow-gold)]">
          <UserRound className="size-10 text-muted" strokeWidth={1} aria-hidden />
        </span>
        <span className="mt-2 font-display text-gold">{meName}</span>
      </div>
    </section>
  );
}
