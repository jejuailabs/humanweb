"use client";

import { useLocale, useTranslations } from "next-intl";
import { Gate } from "@/components/auth/Gate";
import { BackHeader } from "@/components/ui/BackHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { koreanGanzhi } from "@/lib/saju/ko";
import type { Me } from "@/lib/client/types";

const ELEMENTS = ["wood", "fire", "earth", "metal", "water"] as const;
const GODS = ["peer", "output", "wealth", "officer", "resource"] as const;

export function SajuView() {
  const t = useTranslations("analysisDetail.saju");
  return (
    <div className="flex flex-col gap-5">
      <BackHeader href="/analyze" title={t("title")} />
      <Gate>{(me) => <SajuInner me={me} />}</Gate>
    </div>
  );
}

function SajuInner({ me }: { me: Me }) {
  const t = useTranslations("analysisDetail.saju");
  const te = useTranslations("elements");
  const tg = useTranslations("tenGods");
  const tst = useTranslations("stems");
  const locale = useLocale();
  const s = me.analyses.saju!;
  const cols = [
    ["time", s.pillars.time],
    ["day", s.pillars.day],
    ["month", s.pillars.month],
    ["year", s.pillars.year],
  ] as const;

  return (
    <div className="flex flex-col gap-4">
      <GlassCard variant="gold">
        <SectionTitle>{t("pillars")}</SectionTitle>
        <div className="grid grid-cols-4 gap-2 text-center">
          {cols.map(([k, p]) => (
            <div key={k} className={`flex flex-col items-center gap-1 rounded-2xl border p-2 ${k === "day" ? "border-gold shadow-[0_0_14px_-4px_var(--glow-gold)]" : "border-border"}`}>
              <span className="text-[10px] text-muted">{t(k)}</span>
              {p ? (
                <>
                  <span className="font-display text-3xl leading-none text-text">{p[0]}</span>
                  <span className="font-display text-3xl leading-none text-text">{p[1]}</span>
                  {locale === "ko" && <span className="text-[10px] text-muted">{koreanGanzhi(p)}</span>}
                </>
              ) : (
                <span className="py-6 text-xs text-muted">{t("timeUnknown")}</span>
              )}
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-sm text-text">
          {t("dayMaster")}: <span className="font-display text-gold">{s.dayStem} · {tst(s.dayStem)}</span>
        </p>
      </GlassCard>

      <GlassCard>
        <SectionTitle>{t("elements")}</SectionTitle>
        <div className="flex flex-col gap-3">
          {ELEMENTS.map((e) => <ScoreBar key={e} label={te(e)} color={e} value={Math.round(s.elements[e] * 100)} />)}
        </div>
      </GlassCard>

      <GlassCard>
        <SectionTitle>{t("tenGods")}</SectionTitle>
        <div className="grid grid-cols-5 gap-2 text-center">
          {GODS.map((g) => (
            <div key={g} className="flex flex-col gap-1">
              <span className="font-display text-2xl text-gold">{s.tenGods[g] ?? 0}</span>
              <span className="text-[11px] text-muted">{tg(g)}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      <p className="text-xs leading-relaxed text-muted">{t("basisNote")}</p>
    </div>
  );
}
