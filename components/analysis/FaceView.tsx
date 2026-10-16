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
import { shrinkImage } from "@/lib/client/image";
import { track } from "@/lib/firebase/client";
import type { Me } from "@/lib/client/types";

const FEATURES = ["forehead", "brows", "eyes", "nose", "mouth", "jaw"] as const;

// 관상: 동의 체크 후에만 촬영 가능. 사진은 서버에서 분석 후 버리고 결과만 남긴다
export function FaceView() {
  const t = useTranslations("analyses");
  return (
    <div className="flex flex-col gap-5 lg:mx-auto lg:w-full lg:max-w-2xl">
      <BackHeader href="/analyze" title={t("face.title")} />
      <Gate>{(me) => <FaceInner me={me} />}</Gate>
    </div>
  );
}

function FaceInner({ me }: { me: Me }) {
  const t = useTranslations("analysisDetail.face");
  const tc = useTranslations("common");
  const input = useRef<HTMLInputElement>(null);
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "analyzing" | "retake" | "error" | "tooLarge">("idle");
  const [result, setResult] = useState<{ features: Record<string, number>; summary: string } | null>(me.analyses.face ?? null);

  async function onFile(file: File | undefined) {
    if (!file || !consent) return;
    setState("analyzing");
    try {
      const blob = await shrinkImage(file);
      if (blob.size > 4 * 1024 * 1024) return setState("tooLarge");
      const form = new FormData();
      form.append("image", blob, "face.jpg");
      form.append("consent", "1");
      const r = await api<{ features: Record<string, number>; summary: string }>("/api/analyses/face", { method: "POST", body: form });
      setResult(r);
      setState("idle");
      track("complete_analysis", { type: "face" });
      mutate((key) => Array.isArray(key) && key[0] === "/api/me");
    } catch (e) {
      setState(e instanceof ApiError && e.status === 422 ? "retake" : "error");
    } finally {
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <GlassCard variant="violet" className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <span className="relative size-20 shrink-0 overflow-hidden rounded-full border border-primary">
            <Image src="/assets/analysis/icon-face.webp" alt="" fill sizes="80px" className={`object-cover ${state === "analyzing" ? "animate-pulse" : ""}`} />
          </span>
          <p className="text-sm text-text">{t("guide")}</p>
        </div>
        <ul className="flex flex-col gap-1.5 text-xs text-muted">
          <li className="flex items-start gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />{t("privacy")}</li>
          <li className="flex items-start gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />{t("noJudge")}</li>
          <li className="flex items-start gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />{t("selfOnly")}</li>
        </ul>
        <label className="flex items-center gap-2 text-sm text-text">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="size-4 accent-[var(--gold)]" />
          {t("consent")}
        </label>
        <input ref={input} type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        <button type="button" disabled={!consent || state === "analyzing"} onClick={() => input.current?.click()} className={BUTTON_CLASS.gold}>
          {state === "analyzing" ? <><Sparkle className="size-4 animate-spin" />{t("analyzing")}</> : <><Camera className="size-4" aria-hidden />{t("pick")}</>}
        </button>
        {state === "retake" && <p role="alert" className="text-center text-sm text-danger">{t("retake")}</p>}
        {state === "tooLarge" && <p role="alert" className="text-center text-sm text-danger">{t("tooLarge")}</p>}
        {state === "error" && <p role="alert" className="text-center text-sm text-danger">{tc("error")}</p>}
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
