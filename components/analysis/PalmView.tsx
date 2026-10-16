"use client";

import { Camera, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { mutate } from "swr";
import { Gate } from "@/components/auth/Gate";
import { BackHeader } from "@/components/ui/BackHeader";
import { BUTTON_CLASS } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { Sparkle } from "@/components/ui/SectionTitle";
import { ApiError, api } from "@/lib/client/api";
import { track } from "@/lib/firebase/client";
import { shrinkImage } from "@/lib/client/image";
import type { Me } from "@/lib/client/types";

const FEATURES = ["headLine", "headCurve", "heartLine", "fateLine", "lifeLine", "sunLine", "fingerRatio"] as const;

export function PalmView() {
  const t = useTranslations("analyses");
  return (
    <div className="flex flex-col gap-5 lg:mx-auto lg:w-full lg:max-w-2xl">
      <BackHeader href="/analyze" title={t("palm.title")} />
      <Gate>{(me) => <PalmInner me={me} />}</Gate>
    </div>
  );
}

function PalmInner({ me }: { me: Me }) {
  const t = useTranslations("analysisDetail.palm");
  const tc = useTranslations("common");
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<"idle" | "analyzing" | "retake" | "error" | "tooLarge">("idle");
  const [result, setResult] = useState<{ features: Record<string, number>; summary: string } | null>(me.analyses.palm ?? null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setState("analyzing");
    try {
      const blob = await shrinkImage(file);
      if (blob.size > 4 * 1024 * 1024) return setState("tooLarge");
      const form = new FormData();
      form.append("image", blob, "palm.jpg");
      const r = await api<{ features: Record<string, number>; summary: string }>("/api/analyses/palm", { method: "POST", body: form });
      setResult(r);
      setState("idle");
      track("complete_analysis", { type: "palm" });
      mutate((key) => Array.isArray(key) && key[0] === "/api/me");
    } catch (e) {
      setState(e instanceof ApiError && e.status === 422 ? "retake" : "error");
    } finally {
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <GlassCard variant="violet" className="relative overflow-hidden !p-0">
        <div className="relative aspect-[3/4] w-full">
          <Image src="/assets/analysis/card-palm.webp" alt="" fill sizes="448px" className={`object-cover ${state === "analyzing" ? "animate-pulse" : ""}`} />
          {/* 손 윤곽 가이드 프레임 */}
          <div className="absolute inset-8 rounded-[2rem] border-2 border-dashed border-on-image/40" aria-hidden />
        </div>
        <div className="flex flex-col gap-3 p-5">
          <p className="text-sm text-text">{t("guide")}</p>
          <p className="flex items-center gap-2 text-xs text-muted"><ShieldCheck className="size-4 text-gold" aria-hidden />{t("privacy")}</p>
          <input ref={input} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          <button type="button" disabled={state === "analyzing"} onClick={() => input.current?.click()} className={BUTTON_CLASS.gold}>
            {state === "analyzing" ? <><Sparkle className="size-4 animate-spin" />{t("analyzing")}</> : <><Camera className="size-4" aria-hidden />{t("pick")}</>}
          </button>
          {state === "retake" && <p role="alert" className="text-center text-sm text-danger">{t("retake")}</p>}
          {state === "tooLarge" && <p role="alert" className="text-center text-sm text-danger">{t("tooLarge")}</p>}
          {state === "error" && <p role="alert" className="text-center text-sm text-danger">{tc("error")}</p>}
        </div>
      </GlassCard>

      {result && state !== "analyzing" && (
        <GlassCard variant="gold" className="flex flex-col gap-4">
          <p className="font-display text-xl text-gold">{t("result")}</p>
          <p className="text-sm leading-relaxed text-text">{result.summary}</p>
          <div className="flex flex-col gap-3">
            {FEATURES.map((f) => <ScoreBar key={f} label={t(`features.${f}`)} color="gold" value={result.features[f]} />)}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
