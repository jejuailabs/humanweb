"use client";

import { Brain, SendHorizontal } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Gate, Loading } from "@/components/auth/Gate";
import { GlassCard } from "@/components/ui/GlassCard";
import { Sparkle } from "@/components/ui/SectionTitle";
import { Link } from "@/i18n/navigation";
import { ApiError, api, localDateKey, useApi } from "@/lib/client/api";
import { track } from "@/lib/firebase/client";
import type { DailyResponse, Me } from "@/lib/client/types";

type Msg = { id: string; role: "user" | "assistant"; text: string };

export function ChatView() {
  const t = useTranslations("pages.chat");
  return (
    <div className="flex min-h-[calc(100dvh-11rem)] flex-col gap-4">
      <header className="flex flex-col items-center pt-2 text-center">
        <span className="flex size-16 items-center justify-center rounded-full border border-gold text-gold shadow-[0_0_30px_-6px_var(--glow-gold)]">
          <Sparkle className="size-7" />
        </span>
        <h1 className="mt-3 font-display text-2xl text-text">{t("title")}</h1>
      </header>
      <Gate>{(me) => <ChatInner me={me} />}</Gate>
    </div>
  );
}

function ChatInner({ me }: { me: Me }) {
  const t = useTranslations("pages.chat");
  const locale = useLocale();
  const date = localDateKey();
  const { data, isLoading } = useApi<{ messages: Msg[]; remaining: number }>(`/api/chat?date=${date}`);
  const { data: daily } = useApi<DailyResponse>(`/api/daily?date=${date}&lang=${locale}`);
  const [local, setLocal] = useState<Msg[] | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [limit, setLimit] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const seq = useRef(0);
  const nextId = (p: string) => `${p}${++seq.current}`;
  const msgs = local ?? data?.messages ?? [];
  const left = remaining ?? data?.remaining ?? 0;

  useEffect(() => bottom.current?.scrollIntoView({ behavior: "smooth" }), [msgs.length, busy]);

  const personal = daily?.items.daymaster ?? daily?.items.zodiac;
  const ctx = [
    me.stats && "ctxStats",
    me.analyses.mbti && "ctxMbti",
    me.analyses.saju && "ctxSaju",
    personal && "ctxToday",
    me.settings.diaryForAI && "ctxDiary",
  ].filter(Boolean) as string[];

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy) return;
    const base = msgs;
    setLocal([...base, { id: nextId("u"), role: "user", text: message }]);
    setInput("");
    setBusy(true);
    try {
      const r = await api<{ reply: string; remaining: number }>("/api/chat", {
        method: "POST",
        json: { message, date, today: personal ? { total: personal.scores.total, summary: personal.summary } : null },
      });
      setLocal([...base, { id: nextId("u"), role: "user", text: message }, { id: nextId("a"), role: "assistant", text: r.reply }]);
      setRemaining(r.remaining);
      track("chat_message");
    } catch (e) {
      if (e instanceof ApiError && e.status === 429) setLimit(true);
      setLocal(base);
      setInput(message);
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) return <Loading />;

  return (
    <>
      <section aria-label={t("contextLabel")} className="flex flex-wrap items-center justify-center gap-2">
        {ctx.map((key) => (
          <span key={key} className="glass rounded-full border border-border px-3 py-1 text-xs text-muted">{t(key)}</span>
        ))}
        <Link href="/me/memory" className="flex items-center gap-1 rounded-full border border-primary/40 px-3 py-1 text-xs text-primary">
          <Brain className="size-3" aria-hidden />
          {t("memoryLink")}
        </Link>
      </section>

      <GlassCard className="flex flex-1 flex-col gap-3 overflow-y-auto">
        {msgs.length === 0 && <p className="mt-6 text-center text-sm text-muted">{me.stats ? t("q2") : t("empty")}</p>}
        {msgs.map((m) => (
          <div key={m.id} className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "self-end bg-gradient-to-r from-primary-deep to-primary text-on-accent" : "self-start border border-border bg-surface-strong text-text"}`}>
            {m.text}
          </div>
        ))}
        {busy && <span className="self-start text-xs text-muted" role="status"><Sparkle className="mr-1 inline size-3 animate-spin text-gold" />{t("thinking")}</span>}
        <div ref={bottom} />
      </GlassCard>

      {msgs.length === 0 && (
        <section aria-label={t("suggestionsLabel")} className="flex flex-wrap gap-2">
          {(["q1", "q2"] as const).map((key) => (
            <button key={key} type="button" onClick={() => send(t(key))} className="glass rounded-full border border-primary/50 px-4 py-2 text-sm text-text">
              {t(key)}
            </button>
          ))}
        </section>
      )}

      <p className="text-center text-xs text-muted">{limit || left === 0 ? t("limitReached") : t("remaining", { count: left })}</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="glass flex items-center gap-2 rounded-full p-1.5 pl-5"
      >
        <input
          value={input}
          maxLength={500}
          onChange={(e) => setInput(e.target.value)}
          disabled={busy || left === 0}
          placeholder={t("inputPlaceholder")}
          aria-label={t("inputPlaceholder")}
          className="flex-1 bg-transparent text-sm text-text placeholder:text-muted focus:outline-none"
        />
        <button type="submit" disabled={busy || !input.trim() || left === 0} aria-label={t("send")} className="flex size-10 items-center justify-center rounded-full bg-gradient-to-r from-primary-deep to-primary text-on-accent disabled:opacity-50">
          <SendHorizontal className="size-4" aria-hidden />
        </button>
      </form>
    </>
  );
}
