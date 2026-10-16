"use client";

import { Droplet, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { Gate } from "@/components/auth/Gate";
import { BackHeader } from "@/components/ui/BackHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { ZODIAC_ELEMENT, type ZodiacSign } from "@/lib/saju/zodiac";

export function ZodiacView() {
  const t = useTranslations("analysisDetail.zodiac");
  const tz = useTranslations("zodiac");
  const tze = useTranslations("zodiacElement");
  const tb = useTranslations("blood");
  return (
    <div className="flex flex-col gap-5">
      <BackHeader href="/analyze" title={t("title")} />
      <Gate>
        {(me) => {
          const sign = me.analyses.zodiac?.sign as ZodiacSign;
          return (
            <div className="flex flex-col gap-4">
              <GlassCard variant="gold" className="flex flex-col items-center gap-2 py-8">
                <Sparkles className="size-8 text-gold" aria-hidden />
                <span className="text-xs text-muted">{t("sign")}</span>
                <span className="font-display text-4xl text-text">{tz(sign)}</span>
                <span className="text-sm text-gold">{t("element", { element: tze(ZODIAC_ELEMENT[sign]) })}</span>
              </GlassCard>
              <GlassCard className="flex flex-col items-center gap-2 py-8">
                <Droplet className="size-8 text-[var(--love)]" aria-hidden />
                <span className="text-xs text-muted">{t("bloodTitle")}</span>
                <span className="font-display text-4xl text-text">{tb(me.analyses.blood?.type ?? "A")}</span>
              </GlassCard>
              <p className="text-xs text-muted">{t("bloodNote")}</p>
            </div>
          );
        }}
      </Gate>
    </div>
  );
}
