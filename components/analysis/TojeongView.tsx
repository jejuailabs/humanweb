"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { ErrorCard, Gate, Loading } from "@/components/auth/Gate";
import { BackHeader } from "@/components/ui/BackHeader";
import { BUTTON_CLASS } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { SectionTitle, Sparkle } from "@/components/ui/SectionTitle";
import { api, useApi } from "@/lib/client/api";
import { track } from "@/lib/firebase/client";
import type { TojeongResponse } from "@/lib/client/types";

// 토정비결: 괘·월별 점수는 서버 코드로 계산, 문장은 AI. 음력 연 1회
export function TojeongView() {
  const t = useTranslations("analyses");
  return (
    <div className="flex flex-col gap-5 lg:mx-auto lg:w-full lg:max-w-3xl">
      <BackHeader href="/analyze" title={t("tojeong.title")} />
      <Gate>{() => <TojeongInner />}</Gate>
    </div>
  );
}

function TojeongInner() {
  const t = useTranslations("analysisDetail.tojeong");
  const tc = useTranslations("common");
  const { data, error, isLoading, mutate } = useApi<TojeongResponse>("/api/tojeong");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  if (isLoading) return <Loading />;
  if (error || !data) return <ErrorCard />;

  async function generate() {
    setBusy(true);
    setFailed(false);
    try {
      const r = await api<TojeongResponse>("/api/tojeong", { method: "POST" });
      mutate(r, { revalidate: false });
      track("complete_analysis", { type: "tojeong" });
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  const tj = data.tojeong;
  if (!tj)
    return (
      <GlassCard variant="violet" className="flex flex-col items-center gap-4 py-8 text-center">
        <p className="font-display text-xl text-text">{t("intro", { year: data.year })}</p>
        <p className="text-sm text-muted">{t("introDesc")}</p>
        <button type="button" disabled={busy} onClick={generate} className={BUTTON_CLASS.gold}>
          {busy ? <><Sparkle className="size-4 animate-spin" />{t("generating")}</> : t("generate")}
        </button>
        {failed && <p role="alert" className="text-sm text-danger">{tc("error")}</p>}
      </GlassCard>
    );

  return (
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start">
      <div className="flex flex-col gap-4 lg:sticky lg:top-10">
        <GlassCard variant="gold" className="flex flex-col gap-3">
          <p className="text-xs text-muted">{t("yearLabel", { year: tj.year, ganzhi: tj.yearGanzhi, age: tj.age })}</p>
          <p className="font-display text-2xl text-gold">{tj.title}</p>
          <p className="text-sm leading-relaxed text-text">{tj.overview}</p>
        </GlassCard>
        <GlassCard>
          <SectionTitle>{t("gua")}</SectionTitle>
          <div className="grid grid-cols-3 gap-2 text-center">
            {(["upper", "middle", "lower"] as const).map((k) => (
              <div key={k} className="flex flex-col items-center gap-1 rounded-2xl border border-border p-3">
                <span className="text-xs text-muted">{t(k)}</span>
                <span className="font-display text-2xl text-gold">{tj[k]}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted">{t("basis")}</p>
        </GlassCard>
      </div>
      <GlassCard className="flex flex-col gap-4">
        <SectionTitle>{t("monthly")}</SectionTitle>
        {tj.months.map((m, i) => (
          <div key={i} className={`flex flex-col gap-1.5 rounded-2xl p-3 ${i + 1 === data.month ? "border border-gold" : ""}`}>
            <ScoreBar label={t("month", { m: i + 1 }) + (i + 1 === data.month ? ` · ${t("now")}` : "")} color={i + 1 === data.month ? "gold" : "primary"} value={tj.scores[i]} />
            <p className="text-sm leading-relaxed text-text">{m}</p>
          </div>
        ))}
      </GlassCard>
    </div>
  );
}
