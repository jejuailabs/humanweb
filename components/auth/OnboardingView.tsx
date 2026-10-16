"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Loading } from "@/components/auth/Gate";
import { BUTTON_CLASS } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SEGMENTED_WRAP, segmentedItem } from "@/components/ui/segmented";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/client/api";
import { useAuth } from "@/lib/client/auth";
import { useMe } from "@/lib/client/me";

const BLOODS = ["A", "B", "O", "AB"] as const;
const GENDERS = ["female", "male", "other"] as const;
const INPUT = "w-full rounded-2xl border border-border bg-surface px-4 py-3 text-text placeholder:text-muted focus:border-primary focus:outline-none";

// 02_SCREENS.md 온보딩: 닉네임 → 생년월일(양/음력) → 혈액형 → 태어난 시간·성별
export function OnboardingView() {
  const t = useTranslations("onboarding");
  const tc = useTranslations("common");
  const tb = useTranslations("blood");
  const locale = useLocale();
  const router = useRouter();
  const { user, ready } = useAuth();
  const { data: me } = useMe();

  const [step, setStep] = useState(0);
  const [nickname, setNickname] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [calendar, setCalendar] = useState<"solar" | "lunar">("solar");
  const [isLeapMonth, setLeap] = useState(false);
  const [bloodType, setBlood] = useState<(typeof BLOODS)[number] | null>(null);
  const [birthTime, setBirthTime] = useState("");
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [gender, setGender] = useState<(typeof GENDERS)[number] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
    if (me?.onboarded) router.replace("/");
  }, [ready, user, me, router]);

  if (!ready || !user) return <Loading />;

  const steps = [
    { valid: nickname.trim().length > 0 },
    { valid: /^\d{4}-\d{2}-\d{2}$/.test(birthDate) },
    { valid: !!bloodType },
    { valid: timeUnknown || /^\d{2}:\d{2}$/.test(birthTime) },
  ];

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await api("/api/onboarding", {
        method: "POST",
        json: {
          nickname: nickname.trim(),
          birthDate,
          calendar,
          isLeapMonth,
          bloodType,
          birthTime: timeUnknown ? null : birthTime,
          gender,
          lang: locale,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      });
      router.replace("/today");
    } catch {
      setError(t("invalidDate"));
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 pt-4">
      <div>
        <p className="text-xs text-muted">{t("stepOf", { step: step + 1, total: steps.length })}</p>
        <div className="mt-2">
          <ProgressBar value={step + 1} max={steps.length} label={t("title")} />
        </div>
      </div>

      <GlassCard variant="violet" className="flex flex-col gap-4">
        {step === 0 && (
          <label className="flex flex-col gap-3">
            <span className="font-display text-2xl text-text">{t("nickname")}</span>
            <input className={INPUT} value={nickname} maxLength={20} onChange={(e) => setNickname(e.target.value)} placeholder={t("nicknamePlaceholder")} autoFocus />
          </label>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-3">
            <span className="font-display text-2xl text-text">{t("birth")}</span>
            <div className={`${SEGMENTED_WRAP} grid-cols-2`}>
              {(["solar", "lunar"] as const).map((c) => (
                <button key={c} type="button" aria-pressed={calendar === c} onClick={() => setCalendar(c)} className={segmentedItem(calendar === c)}>
                  {t(c)}
                </button>
              ))}
            </div>
            <input type="date" className={INPUT} value={birthDate} min="1900-01-01" max={new Date().toISOString().slice(0, 10)} onChange={(e) => setBirthDate(e.target.value)} aria-label={t("birth")} />
            {calendar === "lunar" && (
              <label className="flex items-center gap-2 text-sm text-text">
                <input type="checkbox" checked={isLeapMonth} onChange={(e) => setLeap(e.target.checked)} className="size-4 accent-[var(--primary)]" />
                {t("leapMonth")}
              </label>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-3">
            <span className="font-display text-2xl text-text">{t("blood")}</span>
            <div className="grid grid-cols-4 gap-2">
              {BLOODS.map((b) => (
                <button key={b} type="button" aria-pressed={bloodType === b} onClick={() => setBlood(b)} className={`h-14 rounded-2xl border text-sm ${bloodType === b ? "border-gold text-gold shadow-[0_0_14px_-4px_var(--glow-gold)]" : "border-border text-text"}`}>
                  {tb(b)}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-3">
            <span className="font-display text-2xl text-text">{t("time")}</span>
            <span className="text-xs text-muted">{t("timeHint")}</span>
            <input type="time" className={INPUT} value={birthTime} disabled={timeUnknown} onChange={(e) => setBirthTime(e.target.value)} aria-label={t("time")} />
            <label className="flex items-center gap-2 text-sm text-text">
              <input type="checkbox" checked={timeUnknown} onChange={(e) => setTimeUnknown(e.target.checked)} className="size-4 accent-[var(--primary)]" />
              {t("timeUnknown")}
            </label>
            <span className="mt-2 text-sm text-text">{t("gender")}</span>
            <div className={`${SEGMENTED_WRAP} grid-cols-3`}>
              {GENDERS.map((g) => (
                <button key={g} type="button" aria-pressed={gender === g} onClick={() => setGender(gender === g ? null : g)} className={segmentedItem(gender === g)}>
                  {t(g)}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted">{t("privacy")}</p>
          </div>
        )}
      </GlassCard>

      {error && <p role="alert" className="text-center text-sm text-danger">{error}</p>}

      <div className="flex gap-2">
        {step > 0 && (
          <button type="button" onClick={() => setStep(step - 1)} className={`${BUTTON_CLASS.ghost} flex-1`}>
            {tc("prev")}
          </button>
        )}
        {step < steps.length - 1 ? (
          <button type="button" disabled={!steps[step].valid} onClick={() => setStep(step + 1)} className={`${BUTTON_CLASS.violet} flex-1`}>
            {tc("next")}
          </button>
        ) : (
          <button type="button" disabled={!steps[step].valid || busy} onClick={submit} className={`${BUTTON_CLASS.gold} flex-1`}>
            {busy ? tc("loading") : t("finish")}
          </button>
        )}
      </div>
    </div>
  );
}
