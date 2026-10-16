"use client";

import { ClipboardList, Grid3x3 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { mutate } from "swr";
import { Gate } from "@/components/auth/Gate";
import { BackHeader } from "@/components/ui/BackHeader";
import { BUTTON_CLASS } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { api } from "@/lib/client/api";
import { track } from "@/lib/firebase/client";
import { MBTI_QUESTIONS } from "@/lib/mbti/questions";
import { MBTI_TYPES } from "@/lib/saju/zodiac";
import type { Me } from "@/lib/client/types";

type Mode = "choose" | "test" | "input" | "result";
type Axes = { E: number; N: number; T: number; J: number };

export function MbtiView() {
  const t = useTranslations("analyses");
  return (
    <div className="flex flex-col gap-5 lg:mx-auto lg:w-full lg:max-w-2xl">
      <BackHeader href="/analyze" title={t("mbti.title")} />
      <Gate>{(me) => <MbtiInner me={me} />}</Gate>
    </div>
  );
}

function MbtiInner({ me }: { me: Me }) {
  const t = useTranslations("analysisDetail.mbti");
  const tq = useTranslations("mbtiTest");
  const tc = useTranslations("common");
  const existing = me.analyses.mbti;
  const [mode, setMode] = useState<Mode>(existing ? "result" : "choose");
  const [result, setResult] = useState<{ type: string; axes: Axes } | null>(existing ?? null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [idx, setIdx] = useState(0);
  const [busy, setBusy] = useState(false);

  async function submit(body: object) {
    setBusy(true);
    try {
      const r = await api<{ type: string; axes: Axes }>("/api/analyses/mbti", { method: "POST", json: body });
      setResult(r);
      setMode("result");
      track("complete_analysis", { type: "mbti" });
      mutate((key) => Array.isArray(key) && key[0] === "/api/me");
    } finally {
      setBusy(false);
    }
  }

  if (mode === "choose")
    return (
      <div className="flex flex-col gap-3">
        <p className="font-display text-xl text-text">{t("chooseTitle")}</p>
        <button type="button" onClick={() => setMode("test")} className="text-left">
          <GlassCard variant="violet" className="flex items-center gap-4">
            <ClipboardList className="size-7 text-primary" aria-hidden />
            <span className="flex flex-col"><span className="font-display text-lg text-text">{t("takeTest")}</span><span className="text-xs text-muted">{t("takeTestDesc")}</span></span>
          </GlassCard>
        </button>
        <button type="button" onClick={() => setMode("input")} className="text-left">
          <GlassCard className="flex items-center gap-4">
            <Grid3x3 className="size-7 text-gold" aria-hidden />
            <span className="flex flex-col"><span className="font-display text-lg text-text">{t("inputType")}</span><span className="text-xs text-muted">{t("inputTypeDesc")}</span></span>
          </GlassCard>
        </button>
        <p className="text-xs text-muted">{t("nameNote")}</p>
      </div>
    );

  if (mode === "input")
    return (
      <GlassCard className="grid grid-cols-4 gap-2">
        {MBTI_TYPES.map((ty) => (
          <button key={ty} type="button" disabled={busy} onClick={() => submit({ type: ty })} className="h-12 rounded-xl border border-border text-sm text-text hover:border-gold hover:text-gold">
            {ty}
          </button>
        ))}
      </GlassCard>
    );

  if (mode === "test") {
    const q = MBTI_QUESTIONS[idx];
    const last = idx === MBTI_QUESTIONS.length - 1;
    return (
      <div className="flex flex-col gap-4">
        <ProgressBar value={idx + 1} max={MBTI_QUESTIONS.length} label={t("question", { n: idx + 1, total: MBTI_QUESTIONS.length })} />
        <p className="text-xs text-muted">{t("question", { n: idx + 1, total: MBTI_QUESTIONS.length })}</p>
        <GlassCard variant="violet" className="flex min-h-40 items-center justify-center text-center">
          <p className="font-display text-xl text-text">{tq(`q${q.id}`)}</p>
        </GlassCard>
        <div className="flex items-center justify-between gap-2">
          {[1, 2, 3, 4, 5].map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={answers[q.id] === v}
              aria-label={String(v)}
              onClick={() => {
                const next = { ...answers, [q.id]: v };
                setAnswers(next);
                if (!last) setIdx(idx + 1);
              }}
              className={`rounded-full border transition-all ${answers[q.id] === v ? "border-gold bg-gold/20" : "border-border-strong"}`}
              style={{ width: 28 + Math.abs(v - 3) * 8, height: 28 + Math.abs(v - 3) * 8 }}
            />
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-muted"><span>{t("scale1")}</span><span>{t("scale5")}</span></div>
        <div className="flex gap-2">
          {idx > 0 && <button type="button" onClick={() => setIdx(idx - 1)} className={`${BUTTON_CLASS.ghost} flex-1`}>{tc("prev")}</button>}
          {last && (
            <button type="button" disabled={busy || Object.keys(answers).length < MBTI_QUESTIONS.length} onClick={() => submit({ answers })} className={`${BUTTON_CLASS.gold} flex-1`}>
              {busy ? tc("loading") : tc("done")}
            </button>
          )}
        </div>
      </div>
    );
  }

  // 결과
  const axes = result!.axes;
  const rows: [string, string, number][] = [["axisE", "axisI", axes.E], ["axisN", "axisS", axes.N], ["axisT", "axisF", axes.T], ["axisJ", "axisP", axes.J]];
  return (
    <div className="flex flex-col gap-4">
      <GlassCard variant="gold" className="flex flex-col items-center gap-2 py-8">
        <span className="text-xs tracking-[0.3em] text-muted">{t("result")}</span>
        <span className="font-display text-6xl text-gold glow-text-gold">{result!.type}</span>
      </GlassCard>
      <GlassCard className="flex flex-col gap-4">
        {rows.map(([a, b, v]) => (
          <div key={a} className="flex items-center gap-3 text-xs">
            <span className={`w-14 text-right ${v >= 50 ? "text-gold" : "text-muted"}`}>{t(a)}</span>
            <span className="relative h-1.5 flex-1 rounded-full bg-track">
              <span className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold shadow-[0_0_10px_var(--glow-gold)]" style={{ left: `${100 - v}%` }} />
            </span>
            <span className={`w-14 ${v < 50 ? "text-gold" : "text-muted"}`}>{t(b)}</span>
          </div>
        ))}
      </GlassCard>
      <button type="button" onClick={() => { setAnswers({}); setIdx(0); setMode("choose"); }} className={BUTTON_CLASS.ghost}>{t("retake")}</button>
    </div>
  );
}
