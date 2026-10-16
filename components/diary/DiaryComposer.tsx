"use client";

import { Globe, Lock, Share2, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { mutate } from "swr";
import { BUTTON_CLASS } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { SEGMENTED_WRAP, segmentedItem } from "@/components/ui/segmented";
import { api, useApi } from "@/lib/client/api";
import { shareCard } from "@/lib/client/share";
import { track } from "@/lib/firebase/client";
import type { DiaryEntry } from "@/lib/client/types";

export const MOODS = [
  { key: "great", emoji: "😆" },
  { key: "good", emoji: "🙂" },
  { key: "calm", emoji: "😐" },
  { key: "low", emoji: "😔" },
  { key: "tired", emoji: "😴" },
] as const;
type Mood = (typeof MOODS)[number]["key"];

// 한 줄 일기 작성·수정 (날짜당 1개, 100자, 기본 비공개)
export function DiaryComposer({ date, isToday, defaultPublic }: { date: string; isToday: boolean; defaultPublic: boolean }) {
  const { data } = useApi<{ entries: DiaryEntry[] }>(`/api/diary?from=${date}&to=${date}`);
  const entry = data?.entries[0];
  // 불러온 뒤 편집기 초기값을 맞추기 위해 key로 다시 마운트
  return <Composer key={`${date}-${entry ? "e" : "n"}-${!!data}`} date={date} isToday={isToday} entry={entry} defaultPublic={defaultPublic} />;
}

function Composer({ date, isToday, entry, defaultPublic }: { date: string; isToday: boolean; entry?: DiaryEntry; defaultPublic: boolean }) {
  const t = useTranslations("pages.diary");
  const tm = useTranslations("moods");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [text, setText] = useState(entry?.text ?? "");
  const [mood, setMood] = useState<Mood | null>((entry?.mood as Mood) ?? null);
  const [visibility, setVisibility] = useState<"private" | "public">(entry?.visibility ?? (defaultPublic ? "public" : "private"));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function save() {
    setStatus("saving");
    try {
      await api(`/api/diary/${date}`, { method: "PUT", json: { text, mood, visibility, isToday } });
      setStatus("saved");
      track("write_diary", { visibility });
      mutate((key) => Array.isArray(key) && String(key[0]).startsWith("/api/diary"));
      mutate((key) => Array.isArray(key) && key[0] === "/api/me");
    } catch {
      setStatus("error");
    }
  }

  async function remove() {
    if (!confirm(t("deleteConfirm"))) return;
    await api(`/api/diary/${date}`, { method: "DELETE" });
    setText("");
    setMood(null);
    setStatus("idle");
    mutate((key) => Array.isArray(key) && String(key[0]).startsWith("/api/diary"));
  }

  return (
    <GlassCard variant="violet" className="flex flex-col gap-4">
      <SectionTitle
        action={
          entry && (
            <span className="flex items-center gap-3">
              <button type="button" onClick={() => shareCard({ kind: "diary", lang: locale, date, text: entry.text }).catch(() => {})} aria-label={t("shareCard")} className="text-muted hover:text-gold">
                <Share2 className="size-4" aria-hidden />
              </button>
              <button type="button" onClick={remove} aria-label={tc("delete")} className="text-muted hover:text-danger">
                <Trash2 className="size-4" aria-hidden />
              </button>
            </span>
          )
        }
      >
        {t("composerLabel")}
      </SectionTitle>
      <div className="relative">
        <textarea
          rows={2}
          maxLength={100}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setStatus("idle");
          }}
          placeholder={t("placeholder")}
          aria-label={t("composerLabel")}
          className="w-full resize-none rounded-2xl border border-border bg-surface p-4 pb-7 font-display text-lg text-text placeholder:text-muted focus:border-primary focus:outline-none"
        />
        <span className="absolute right-3 bottom-3 text-xs text-muted">{t("count", { count: text.length })}</span>
      </div>
      <fieldset className="flex items-center justify-between">
        <legend className="sr-only">{t("moodLabel")}</legend>
        {MOODS.map((m) => (
          <button
            key={m.key}
            type="button"
            aria-label={tm(m.key)}
            aria-pressed={mood === m.key}
            onClick={() => setMood(mood === m.key ? null : m.key)}
            className={`glass flex size-11 items-center justify-center rounded-full text-xl transition-transform ${mood === m.key ? "scale-110 border-gold shadow-[0_0_14px_-4px_var(--glow-gold)]" : "opacity-70"}`}
          >
            {m.emoji}
          </button>
        ))}
      </fieldset>
      <div className="flex items-center gap-2">
        <div className={`${SEGMENTED_WRAP} flex-1 grid-cols-2`}>
          <button type="button" aria-pressed={visibility === "private"} onClick={() => setVisibility("private")} className={`${segmentedItem(visibility === "private")} flex items-center justify-center gap-1`}>
            <Lock className="size-3.5" aria-hidden />
            {t("private")}
          </button>
          <button type="button" aria-pressed={visibility === "public"} onClick={() => setVisibility("public")} className={`${segmentedItem(visibility === "public")} flex items-center justify-center gap-1`}>
            <Globe className="size-3.5" aria-hidden />
            {t("public")}
          </button>
        </div>
        <button type="button" disabled={!text.trim() || status === "saving"} onClick={save} className={BUTTON_CLASS.gold}>
          {status === "saving" ? tc("loading") : t("save")}
        </button>
      </div>
      {visibility === "public" && <p className="text-center text-xs text-muted">{t("publicNotice")}</p>}
      {status === "saved" && <p role="status" className="text-center text-xs text-gold">{t("saveDone")}</p>}
      {status === "error" && <p role="alert" className="text-center text-xs text-danger">{tc("error")}</p>}
    </GlassCard>
  );
}
