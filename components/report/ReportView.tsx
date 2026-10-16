"use client";

import { RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { mutate } from "swr";
import { Gate, Loading } from "@/components/auth/Gate";
import { BackHeader } from "@/components/ui/BackHeader";
import { BUTTON_CLASS } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { SectionTitle, Sparkle } from "@/components/ui/SectionTitle";
import { api, useApi } from "@/lib/client/api";
import type { Report } from "@/lib/client/types";

export function ReportView() {
  const t = useTranslations("pages.report");
  return (
    <div className="flex flex-col gap-5">
      <BackHeader href="/" title={t("title")} />
      <Gate>{() => <ReportInner />}</Gate>
    </div>
  );
}

function ReportInner() {
  const t = useTranslations("pages.report");
  const ts = useTranslations("stats");
  const { data, isLoading, mutate: reload } = useApi<{ reports: Report[] }>("/api/report");
  const [selected, setSelected] = useState(0);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function regenerate() {
    setBusy(true);
    setFailed(false);
    try {
      await api("/api/report", { method: "POST" });
      await reload();
      setSelected(0);
      mutate((key) => Array.isArray(key) && key[0] === "/api/me");
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) return <Loading />;
  const reports = data?.reports ?? [];
  const r = reports[selected];

  return (
    <div className="flex flex-col gap-4">
      {busy && <p role="status" className="text-center text-sm text-muted">{t("generating")}</p>}
      {!r ? (
        <GlassCard className="py-8 text-center text-sm text-muted">{t("empty")}</GlassCard>
      ) : (
        <>
          <GlassCard variant="gold" className="flex flex-col items-center gap-2 py-6 text-center">
            <Sparkle className="size-5 text-gold" />
            <p className="font-display text-2xl text-gold glow-text-gold">{r.title}</p>
            <span className="text-xs text-muted">{t("version", { version: r.version, completeness: r.completeness })}</span>
          </GlassCard>
          <Section title={t("identity")}><p>{r.identity}</p></Section>
          <Section title={t("strengths")}>
            <ul className="flex flex-col gap-2">
              {r.strengths.map((s) => (
                <li key={s.stat}><span className="font-display text-gold">{ts(s.stat)}</span> — {s.text}</li>
              ))}
            </ul>
          </Section>
          <Section title={t("growth")}>
            <ul className="flex list-disc flex-col gap-2 pl-4">{r.growth.map((g, i) => <li key={i}>{g}</li>)}</ul>
          </Section>
          <Section title={t("workStyle")}><p>{r.workStyle}</p></Section>
          <Section title={t("relationStyle")}><p>{r.relationStyle}</p></Section>
          <Section title={t("goodMatch")}><p>{r.goodMatch}</p></Section>
          <Section title={t("crossInsights")} violet>
            <ul className="flex flex-col gap-2">{r.crossInsights.map((c, i) => <li key={i}>✦ {c}</li>)}</ul>
          </Section>
        </>
      )}

      {reports.length > 1 && (
        <GlassCard>
          <SectionTitle>{t("versions")}</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {reports.map((x, i) => (
              <button key={x.version} type="button" aria-pressed={i === selected} onClick={() => setSelected(i)} className={`rounded-full border px-3 py-1 text-xs ${i === selected ? "border-gold text-gold" : "border-border text-muted"}`}>
                v{x.version} · {x.completeness}%
              </button>
            ))}
          </div>
        </GlassCard>
      )}

      <button type="button" disabled={busy} onClick={regenerate} className={BUTTON_CLASS.ghost}>
        <RefreshCw className={`size-4 ${busy ? "animate-spin" : ""}`} aria-hidden />
        {t("regenerate")}
      </button>
      {failed && <ErrorLine />}
    </div>
  );
}

function ErrorLine() {
  const tc = useTranslations("common");
  return <p role="alert" className="text-center text-sm text-danger">{tc("error")}</p>;
}

function Section({ title, children, violet }: { title: string; children: React.ReactNode; violet?: boolean }) {
  return (
    <GlassCard variant={violet ? "violet" : "default"}>
      <SectionTitle>{title}</SectionTitle>
      <div className="text-sm leading-relaxed text-text">{children}</div>
    </GlassCard>
  );
}
