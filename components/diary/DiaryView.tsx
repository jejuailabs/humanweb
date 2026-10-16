"use client";

import { CalendarDays, ChevronLeft, ChevronRight, Flag, Globe, Heart, History, List, Lock, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Gate, Loading } from "@/components/auth/Gate";
import { BUTTON_CLASS } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { SEGMENTED_WRAP, segmentedItem } from "@/components/ui/segmented";
import { api, localDateKey, useApi } from "@/lib/client/api";
import type { DiaryEntry, Me } from "@/lib/client/types";
import { DiaryComposer, MOODS } from "./DiaryComposer";

type View = "calendar" | "list" | "explore";

export function DiaryView() {
  return <Gate>{(me) => <DiaryInner me={me} />}</Gate>;
}

function DiaryInner({ me }: { me: Me }) {
  const t = useTranslations("pages.diary");
  const today = localDateKey();
  const [view, setView] = useState<View>("calendar");

  return (
    <div className="flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:items-start lg:gap-8">
      <div className="lg:sticky lg:top-10">
        <DiaryComposer date={today} isToday defaultPublic={me.settings.diaryDefaultPublic} />
      </div>
      <div className="flex flex-col gap-5">
      <OnThisDay date={today} />
      <div className={`${SEGMENTED_WRAP} grid-cols-3`}>
        {([
          ["calendar", CalendarDays, t("viewCalendar")],
          ["list", List, t("viewList")],
          ["explore", Globe, t("explore")],
        ] as const).map(([v, Icon, label]) => (
          <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} className={`${segmentedItem(view === v)} flex items-center justify-center gap-1`}>
            <Icon className="size-4" aria-hidden />
            {label}
          </button>
        ))}
      </div>
      {view === "explore" ? <Explore /> : <Mine view={view} diaryForAI={me.settings.diaryForAI} />}
      </div>
    </div>
  );
}

function monthRange(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  return { from: `${ym}-01`, to: `${ym}-${String(last).padStart(2, "0")}`, days: last, firstWeekday: new Date(y, m - 1, 1).getDay() };
}
function shiftMonth(ym: string, d: number) {
  const [y, m] = ym.split("-").map(Number);
  const dt = new Date(y, m - 1 + d, 1);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
}
const moodEmoji = (m: string | null) => MOODS.find((x) => x.key === m)?.emoji;

function Mine({ view, diaryForAI }: { view: "calendar" | "list"; diaryForAI: boolean }) {
  const t = useTranslations("pages.diary");
  const locale = useLocale();
  const [ym, setYm] = useState(localDateKey().slice(0, 7));
  const r = monthRange(ym);
  const { data, isLoading } = useApi<{ entries: DiaryEntry[]; fortunes: Record<string, { total: number; summary: string }> }>(`/api/diary?from=${r.from}&to=${r.to}`);
  const byDate = Object.fromEntries((data?.entries ?? []).map((e) => [e.date, e]));
  const monthLabel = new Intl.DateTimeFormat(locale, { year: "numeric", month: "long" }).format(new Date(`${ym}-01T12:00:00`));
  const weekdays = Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(locale, { weekday: "narrow" }).format(new Date(2026, 0, 4 + i)));
  const isFuture = ym >= localDateKey().slice(0, 7);

  return (
    <GlassCard className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <button type="button" aria-label={t("monthPrev")} onClick={() => setYm(shiftMonth(ym, -1))} className="text-muted hover:text-text"><ChevronLeft className="size-5" /></button>
        <span className="font-display text-xl text-text">{monthLabel}</span>
        <button type="button" aria-label={t("monthNext")} disabled={isFuture} onClick={() => setYm(shiftMonth(ym, 1))} className="text-muted hover:text-text disabled:opacity-30"><ChevronRight className="size-5" /></button>
      </div>
      {isLoading ? (
        <Loading />
      ) : view === "calendar" ? (
        <div className="grid grid-cols-7 gap-1 text-center">
          {weekdays.map((w, i) => <span key={i} className="text-[10px] text-muted">{w}</span>)}
          {Array.from({ length: r.firstWeekday }, (_, i) => <span key={`b${i}`} />)}
          {Array.from({ length: r.days }, (_, i) => {
            const d = `${ym}-${String(i + 1).padStart(2, "0")}`;
            const e = byDate[d];
            return (
              <span key={d} className={`flex aspect-square flex-col items-center justify-center rounded-xl text-xs ${e ? "bg-surface-strong text-text" : "text-muted"}`} title={e?.text}>
                {i + 1}
                <span className="h-4 text-sm leading-none">{e ? moodEmoji(e.mood) ?? "•" : ""}</span>
              </span>
            );
          })}
        </div>
      ) : data?.entries.length ? (
        <ul className="flex flex-col gap-3">
          {data.entries.map((e) => (
            <li key={e.date} className="flex flex-col gap-1 border-b border-border pb-3 last:border-0">
              <span className="flex items-center gap-2 text-xs text-muted">
                {e.date} {moodEmoji(e.mood)}
                {e.visibility === "public" ? <Globe className="size-3" aria-label={t("public")} /> : <Lock className="size-3" aria-label={t("private")} />}
                {(e.fortuneSnapshot ?? data.fortunes[e.date]) && (
                  <span className="text-gold">{t("fortuneOfDay", { score: (e.fortuneSnapshot ?? data.fortunes[e.date]).total })}</span>
                )}
              </span>
              <span className="font-display text-lg text-text">{e.text}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-6 text-center text-sm text-muted">{t("empty")}</p>
      )}
      <Retro month={ym} monthLabel={monthLabel} entries={data?.entries.length ?? 0} diaryForAI={diaryForAI} />
    </GlassCard>
  );
}

// "N년 전 오늘" (P2)
function OnThisDay({ date }: { date: string }) {
  const t = useTranslations("pages.diary");
  const { data } = useApi<{ items: { years: number; date: string; text: string; mood: string | null }[] }>(`/api/diary/onthisday?date=${date}`);
  if (!data?.items.length) return null;
  return (
    <GlassCard variant="gold" className="flex flex-col gap-3">
      {data.items.map((it) => (
        <div key={it.date} className="flex items-start gap-3">
          <History className="mt-1 size-4 shrink-0 text-gold" aria-hidden />
          <span className="flex flex-col">
            <span className="text-xs text-gold">{t("onThisDay", { years: it.years })} {moodEmoji(it.mood)}</span>
            <span className="font-display text-lg text-text">{it.text}</span>
          </span>
        </div>
      ))}
    </GlassCard>
  );
}

// 월간 회고 (P2) — 일기 AI 사용을 허용한 경우에만 (절대 규칙 10)
function Retro({ month, monthLabel, entries, diaryForAI }: { month: string; monthLabel: string; entries: number; diaryForAI: boolean }) {
  const t = useTranslations("pages.diary");
  const tc = useTranslations("common");
  const { data, mutate } = useApi<{ retro: { title: string; summary: string; highlights: string[] } | null }>(`/api/diary/retro?month=${month}`);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const retro = data?.retro;

  async function make() {
    setBusy(true);
    setFailed(false);
    try {
      await api("/api/diary/retro", { method: "POST", json: { month } });
      await mutate();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-2 border-t border-border pt-4">
      <SectionTitle>{t("retroTitle", { month: monthLabel })}</SectionTitle>
      {retro ? (
        <div className="flex flex-col gap-2">
          <p className="font-display text-lg text-gold">{retro.title}</p>
          <p className="text-sm leading-relaxed text-text">{retro.summary}</p>
          <ul className="flex flex-col gap-1 text-sm text-muted">{retro.highlights.map((h, i) => <li key={i}>✦ {h}</li>)}</ul>
        </div>
      ) : !diaryForAI ? (
        <p className="text-xs text-muted">{t("retroNeedConsent")}</p>
      ) : entries < 3 ? (
        <p className="text-xs text-muted">{t("retroNeedEntries")}</p>
      ) : (
        <button type="button" disabled={busy} onClick={make} className={`${BUTTON_CLASS.ghost} w-full`}>
          <Sparkles className={`size-4 ${busy ? "animate-spin" : ""}`} aria-hidden />
          {busy ? t("retroMaking") : t("retroMake")}
        </button>
      )}
      {failed && <p role="alert" className="mt-2 text-center text-xs text-danger">{tc("error")}</p>}
    </div>
  );
}

type PublicItem = { id: string; nickname: string; text: string; mood: string | null; heartCount: number; hearted: boolean; mine: boolean };

function Explore() {
  const t = useTranslations("pages.diary");
  const locale = useLocale();
  const [all, setAll] = useState(false);
  const date = localDateKey();
  const { data, isLoading, mutate } = useApi<{ items: PublicItem[] }>(`/api/diary/public?date=${date}${all ? "" : `&lang=${locale}`}`);
  const [reported, setReported] = useState<Set<string>>(new Set());

  async function heart(id: string) {
    await api("/api/diary/public/heart", { method: "POST", json: { id } });
    mutate();
  }
  async function report(id: string) {
    await api("/api/moderation", { method: "POST", json: { id, reason: "other" } });
    setReported(new Set(reported).add(id));
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-center justify-end gap-2 text-xs text-muted">
        <input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} className="accent-[var(--primary)]" />
        {t("allLangs")}
      </label>
      {isLoading ? (
        <Loading />
      ) : !data?.items.length ? (
        <GlassCard className="py-8 text-center text-sm text-muted">{t("exploreEmpty")}</GlassCard>
      ) : (
        data.items.map((it) => (
          <GlassCard key={it.id} className="flex flex-col gap-2 !p-4">
            <span className="text-xs text-muted">{it.nickname} {moodEmoji(it.mood)}</span>
            <p className="font-display text-lg text-text">{it.text}</p>
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => heart(it.id)} aria-pressed={it.hearted} aria-label={t("heart")} className={`flex items-center gap-1 text-sm ${it.hearted ? "text-[var(--love)]" : "text-muted"}`}>
                <Heart className="size-4" fill={it.hearted ? "currentColor" : "none"} aria-hidden />
                {it.heartCount}
              </button>
              {!it.mine && (
                <button type="button" disabled={reported.has(it.id)} onClick={() => report(it.id)} className="flex items-center gap-1 text-xs text-muted hover:text-danger disabled:opacity-50">
                  <Flag className="size-3" aria-hidden />
                  {reported.has(it.id) ? t("reportDone") : t("report")}
                </button>
              )}
            </div>
          </GlassCard>
        ))
      )}
    </div>
  );
}
