"use client";

import { RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Gate, Loading } from "@/components/auth/Gate";
import { GlassCard } from "@/components/ui/GlassCard";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { ApiError, api, useApi } from "@/lib/client/api";

type Summary = {
  totals: { users: number; publicDiary: number };
  metrics: Record<string, number | string>[];
  content: Record<string, Record<string, string>>;
  reports: { id: string; targetId: string; reason: string; text: string }[];
  funnel: { key: string; count: number }[];
};

const FUNNEL_LABEL: Record<string, string> = { signup: "funnelSignup", signup_time_known: "funnelTime", analysis_mbti: "funnelMbti", analysis_palm: "funnelPalm" };

const METRIC_KEYS = ["signup", "diary_private", "diary_public", "analysis_mbti", "analysis_palm", "analysis_face", "analysis_name", "analysis_tojeong", "ai_daily", "ai_report", "ai_chat", "ai_palm"];

// 08_ADMIN.md — 집계 수치만, 비공개 원문은 보지 않는다
export function AdminView() {
  return <Gate>{() => <AdminInner />}</Gate>;
}

function AdminInner() {
  const t = useTranslations("admin");
  const { data, error, isLoading, mutate } = useApi<Summary>("/api/admin/summary");
  const [busy, setBusy] = useState<string | null>(null);

  if (isLoading) return <Loading />;
  if (error instanceof ApiError && error.status === 403) return <GlassCard className="py-8 text-center text-sm text-muted">{t("forbidden")}</GlassCard>;
  if (!data) return null;

  async function regen(key: string) {
    const [date, lang, category] = key.split("|");
    setBusy(key);
    try {
      await api("/api/admin/regenerate", { method: "POST", json: { action: "daily", date, lang, category } });
      mutate();
    } finally {
      setBusy(null);
    }
  }
  async function moderate(id: string, action: "hide" | "restore") {
    await api("/api/admin/regenerate", { method: "POST", json: { action, id } });
    mutate();
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-3xl text-text">{t("title")}</h1>
      <div className="grid grid-cols-2 gap-3">
        <GlassCard className="text-center"><p className="text-xs text-muted">{t("users")}</p><p className="font-display text-3xl text-gold">{data.totals.users}</p></GlassCard>
        <GlassCard className="text-center"><p className="text-xs text-muted">{t("publicDiary")}</p><p className="font-display text-3xl text-gold">{data.totals.publicDiary}</p></GlassCard>
      </div>

      <GlassCard>
        <SectionTitle>{t("funnel")}</SectionTitle>
        <div className="flex flex-col gap-2">
          {data.funnel.map((f) => {
            const top = Math.max(1, data.funnel[0]?.count ?? 1);
            return (
              <div key={f.key} className="flex items-center gap-3 text-xs">
                <span className="w-28 shrink-0 text-muted">{t(FUNNEL_LABEL[f.key])}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-track">
                  <span className="block h-full rounded-full bg-gradient-to-r from-primary to-gold" style={{ width: `${Math.min(100, (f.count / top) * 100)}%` }} />
                </span>
                <span className="w-16 text-right text-text">{f.count} ({Math.round((f.count / top) * 100)}%)</span>
              </div>
            );
          })}
        </div>
      </GlassCard>

      <GlassCard className="overflow-x-auto">
        <SectionTitle>{t("metrics")}</SectionTitle>
        <table className="w-full text-xs">
          <thead><tr className="text-muted"><th className="text-left">date</th>{METRIC_KEYS.map((k) => <th key={k} className="px-1 font-normal">{k}</th>)}</tr></thead>
          <tbody>
            {data.metrics.map((m) => (
              <tr key={String(m.date)} className="border-t border-border text-text">
                <td className="py-1">{String(m.date).slice(5)}</td>
                {METRIC_KEYS.map((k) => <td key={k} className="text-center">{m[k] ?? 0}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>

      <GlassCard>
        <SectionTitle>{t("content")}</SectionTitle>
        {Object.entries(data.content).map(([date, status]) => (
          <div key={date} className="mb-3">
            <p className="mb-1 text-xs text-muted">{date}</p>
            <div className="flex flex-wrap gap-2">
              {["ko", "en"].flatMap((lang) =>
                ["daymaster", "zodiac", "animal", "blood", "mbti"].map((c) => {
                  const st = status[`${lang}_${c}`] ?? "—";
                  const key = `${date}|${lang}|${c}`;
                  return (
                    <button key={key} type="button" disabled={busy === key} onClick={() => regen(key)} title={t("regenerate")} className={`flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] ${st === "ok" ? "border-border text-text" : st === "backup" ? "border-danger text-danger" : "border-border text-muted"}`}>
                      {lang}/{c}: {st}
                      <RefreshCw className={`size-3 ${busy === key ? "animate-spin" : ""}`} aria-hidden />
                    </button>
                  );
                }),
              )}
            </div>
          </div>
        ))}
      </GlassCard>

      <GlassCard>
        <SectionTitle>{t("reports")}</SectionTitle>
        {data.reports.length === 0 ? (
          <p className="text-sm text-muted">{t("noReports")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {data.reports.map((r) => (
              <li key={r.id} className="flex items-center gap-2 border-b border-border pb-2 text-sm">
                <span className="flex-1 text-text">{r.text}</span>
                <span className="text-xs text-muted">{r.reason}</span>
                <button type="button" onClick={() => moderate(r.targetId, "hide")} className="text-xs text-danger">{t("hide")}</button>
                <button type="button" onClick={() => moderate(r.targetId, "restore")} className="text-xs text-muted">{t("restore")}</button>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}
