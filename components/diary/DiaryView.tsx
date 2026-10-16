"use client";

import { CalendarDays, ChevronLeft, ChevronRight, Flag, Globe, Heart, List, Lock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Gate, Loading } from "@/components/auth/Gate";
import { GlassCard } from "@/components/ui/GlassCard";
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
    <div className="flex flex-col gap-5">
      <DiaryComposer date={today} isToday defaultPublic={me.settings.diaryDefaultPublic} />
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
      {view === "explore" ? <Explore /> : <Mine view={view} />}
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

function Mine({ view }: { view: "calendar" | "list" }) {
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
    </GlassCard>
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
