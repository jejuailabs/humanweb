"use client";

import { ShieldCheck } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { mutate } from "swr";
import { Gate } from "@/components/auth/Gate";
import { BackHeader } from "@/components/ui/BackHeader";
import { BUTTON_CLASS } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { SectionTitle, Sparkle } from "@/components/ui/SectionTitle";
import { api } from "@/lib/client/api";
import { track } from "@/lib/firebase/client";
import type { Me, NameAnalysis } from "@/lib/client/types";

const ELEMENTS = ["wood", "fire", "earth", "metal", "water"] as const;
const GRIDS = ["won", "hyeong", "i", "jeong"] as const;
const INPUT = "w-full rounded-2xl border border-border bg-surface px-4 py-3 text-text placeholder:text-muted focus:border-gold focus:outline-none";

// 이름 풀이: 한글 이름 → 발음오행·획수 4격(코드) + 해석(AI). 이름 원문은 저장하지 않는다
export function NameView() {
  const t = useTranslations("analyses");
  return (
    <div className="flex flex-col gap-5 lg:mx-auto lg:w-full lg:max-w-2xl">
      <BackHeader href="/analyze" title={t("name.title")} />
      <Gate>{(me) => <NameInner me={me} />}</Gate>
    </div>
  );
}

function NameInner({ me }: { me: Me }) {
  const t = useTranslations("analysisDetail.name");
  const tc = useTranslations("common");
  const te = useTranslations("elements");
  const [surname, setSurname] = useState("");
  const [given, setGiven] = useState("");
  const [state, setState] = useState<"idle" | "analyzing" | "error">("idle");
  const [result, setResult] = useState<NameAnalysis | null>(me.analyses.name ?? null);
  const valid = /^[가-힣]{1,2}$/.test(surname) && /^[가-힣]{1,3}$/.test(given);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setState("analyzing");
    try {
      const r = await api<NameAnalysis>("/api/analyses/name", { method: "POST", json: { surname, given } });
      setResult(r);
      setState("idle");
      setSurname("");
      setGiven("");
      track("complete_analysis", { type: "name" });
      mutate((key) => Array.isArray(key) && key[0] === "/api/me");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <GlassCard variant="violet">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <span className="relative size-16 shrink-0 overflow-hidden rounded-full border border-primary">
              <Image src="/assets/analysis/icon-name.webp" alt="" fill sizes="64px" className={`object-cover ${state === "analyzing" ? "animate-pulse" : ""}`} />
            </span>
            <p className="text-sm text-text">{t("guide")}</p>
          </div>
          <div className="grid grid-cols-[5rem_1fr] gap-2">
            <input value={surname} onChange={(e) => setSurname(e.target.value.trim())} maxLength={2} placeholder={t("surname")} aria-label={t("surname")} className={INPUT} />
            <input value={given} onChange={(e) => setGiven(e.target.value.trim())} maxLength={3} placeholder={t("given")} aria-label={t("given")} className={INPUT} />
          </div>
          <p className="text-xs text-muted">{t("hangulOnly")}</p>
          <p className="flex items-start gap-2 text-xs text-muted"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />{t("privacy")}</p>
          <button type="submit" disabled={!valid || state === "analyzing"} className={BUTTON_CLASS.gold}>
            {state === "analyzing" ? <><Sparkle className="size-4 animate-spin" />{t("analyzing")}</> : t("submit")}
          </button>
          {state === "error" && <p role="alert" className="text-center text-sm text-danger">{tc("error")}</p>}
        </form>
      </GlassCard>

      {result && state !== "analyzing" && (
        <>
          <GlassCard variant="gold" className="flex flex-col gap-3">
            <p className="font-display text-xl text-gold">{result.title}</p>
            <p className="text-sm leading-relaxed text-text">{result.summary}</p>
            <ul className="flex flex-col gap-1.5">
              {result.points.map((p) => <li key={p} className="flex gap-2 text-sm text-text"><Sparkle className="mt-1 size-3 shrink-0 text-gold" />{p}</li>)}
            </ul>
          </GlassCard>
          <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2">
            <GlassCard>
              <SectionTitle>{t("soundElements")}</SectionTitle>
              <p className="mb-3 flex flex-wrap gap-2">
                {result.soundElements.map((e, i) => (
                  <span key={i} className="rounded-full border border-border px-3 py-1 text-sm text-text">{te(e)}</span>
                ))}
              </p>
              <div className="flex flex-col gap-2">
                {ELEMENTS.map((e) => <ScoreBar key={e} label={te(e)} color={e} value={Math.round(result.elements[e] * 100)} />)}
              </div>
            </GlassCard>
            <GlassCard>
              <SectionTitle>{t("grids")}</SectionTitle>
              <div className="grid grid-cols-2 gap-2">
                {GRIDS.map((g) => (
                  <div key={g} className="flex flex-col items-center gap-1 rounded-2xl border border-border p-3">
                    <span className="text-xs text-muted">{t(`grid.${g}`)}</span>
                    <span className="font-display text-2xl text-gold">{result.grids[g]}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted">{t("basis")}</p>
            </GlassCard>
          </div>
        </>
      )}
    </div>
  );
}
