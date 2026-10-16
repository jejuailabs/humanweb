"use client";

import { Brain, ChevronRight, FileText, Flame, LogOut, MessageCircle, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import { mutate } from "swr";
import { Gate } from "@/components/auth/Gate";
import { BUTTON_CLASS } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Link, useRouter } from "@/i18n/navigation";
import { api } from "@/lib/client/api";
import { logout } from "@/lib/client/auth";
import type { Me } from "@/lib/client/types";

const INPUT = "w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-muted focus:border-primary focus:outline-none";

export function MeView() {
  const t = useTranslations("pages.me");
  return (
    <div className="flex flex-col gap-5 lg:block lg:columns-2 lg:gap-6 lg:[&>*]:mb-6 lg:[&>*]:break-inside-avoid">
      <Gate>{(me) => <MeInner me={me} />}</Gate>
      {/* 테마·언어는 로그인 없이도 */}
      <GlassCard className="flex flex-col gap-5">
        <SectionTitle>{t("settingsTitle")}</SectionTitle>
        <ThemeToggle />
        <LocaleSwitcher />
      </GlassCard>
    </div>
  );
}

function MeInner({ me }: { me: Me }) {
  const t = useTranslations("pages.me");
  const tc = useTranslations("common");
  const ta = useTranslations("auth");
  const tob = useTranslations("onboarding");
  const router = useRouter();
  const [nickname, setNickname] = useState(me.nickname ?? "");
  const [s, setS] = useState(me.settings);
  const [saved, setSaved] = useState(false);

  async function patch(body: Record<string, unknown>) {
    setSaved(false);
    await api("/api/settings", { method: "PATCH", json: body });
    setSaved(true);
    mutate((key) => Array.isArray(key) && key[0] === "/api/me");
  }
  function toggle<K extends keyof Me["settings"]>(key: K, value: Me["settings"][K]) {
    setS({ ...s, [key]: value });
    patch({ [key]: value });
  }
  async function deleteAccount() {
    if (!confirm(t("deleteConfirm"))) return;
    await api("/api/me", { method: "DELETE" });
    await logout();
    router.replace("/");
  }

  return (
    <>
      <GlassCard className="flex items-center gap-4">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-full border-2 border-gold bg-surface shadow-[0_0_24px_-6px_var(--glow-gold)]">
          <UserRound className="size-8 text-muted" strokeWidth={1} aria-hidden />
        </span>
        <span className="flex flex-col">
          <h1 className="font-display text-2xl text-text">{me.nickname}</h1>
          {me.report && <span className="text-sm text-gold">{me.report.title}</span>}
          <span className="mt-1 flex items-center gap-1 text-xs text-muted"><Flame className="size-3 text-gold" aria-hidden />{t("streak", { count: me.streak.count })}</span>
        </span>
      </GlassCard>

      <div className="grid grid-cols-2 gap-2">
        <Link href="/chat" className={`${BUTTON_CLASS.gold} w-full`}><MessageCircle className="size-4" aria-hidden />{t("chatEntry")}</Link>
        <Link href="/report" className={`${BUTTON_CLASS.ghost} w-full`}><FileText className="size-4" aria-hidden />{t("report")}</Link>
      </div>

      <GlassCard className="flex flex-col gap-3">
        <SectionTitle>{t("profileTitle")}</SectionTitle>
        <label className="flex flex-col gap-1 text-xs text-muted">
          {t("nickname")}
          <div className="flex gap-2">
            <input className={INPUT} value={nickname} maxLength={20} onChange={(e) => setNickname(e.target.value)} />
            <button type="button" disabled={!nickname.trim() || nickname === me.nickname} onClick={() => patch({ nickname: nickname.trim() })} className={`${BUTTON_CLASS.ghost} !h-9 shrink-0`}>{tc("save")}</button>
          </div>
        </label>
        {me.profile && (
          <p className="text-xs text-muted">{t("birth")}: <span className="text-text">{me.profile.birthDate} ({tob(me.profile.calendar)}){me.profile.birthTime ? ` ${me.profile.birthTime}` : ""}</span></p>
        )}
      </GlassCard>

      <GlassCard className="flex flex-col gap-3">
        <SectionTitle>{t("privacyTitle")}</SectionTitle>
        <Toggle label={t("showOnMap")} checked={s.showOnMap} onChange={(v) => toggle("showOnMap", v)} />
        {(["business", "region", "school"] as const).map((f) => (
          <div key={f} className="flex flex-col gap-1">
            <span className="text-xs text-muted">{t(f)}</span>
            <div className="flex items-center gap-2">
              <input className={INPUT} value={s[f]} maxLength={40} onChange={(e) => setS({ ...s, [f]: e.target.value })} onBlur={() => patch({ [f]: s[f] })} />
              <label className="flex shrink-0 items-center gap-1 text-xs text-muted">
                <input type="checkbox" checked={s.publicFields[f]} onChange={(e) => toggle("publicFields", { ...s.publicFields, [f]: e.target.checked })} className="accent-[var(--primary)]" />
                {t("publicToggle")}
              </label>
            </div>
          </div>
        ))}
      </GlassCard>

      <GlassCard className="flex flex-col gap-3">
        <SectionTitle>{t("diaryTitle")}</SectionTitle>
        <Toggle label={t("diaryDefaultPublic")} checked={s.diaryDefaultPublic} onChange={(v) => toggle("diaryDefaultPublic", v)} />
        <Toggle label={t("diaryForAI")} checked={s.diaryForAI} onChange={(v) => toggle("diaryForAI", v)} />
      </GlassCard>

      <GlassCard className="flex flex-col gap-1">
        <SectionTitle>{t("aiTitle")}</SectionTitle>
        <Row href="/me/memory" icon={<Brain className="size-4" />}>{t("memory")}</Row>
      </GlassCard>

      {saved && <p role="status" className="text-center text-xs text-gold">{tc("saved")}</p>}

      <GlassCard className="flex flex-col gap-3">
        <SectionTitle>{t("account")}</SectionTitle>
        <button type="button" onClick={() => logout()} className={BUTTON_CLASS.ghost}><LogOut className="size-4" aria-hidden />{ta("logout")}</button>
        <button type="button" onClick={deleteAccount} className="text-xs text-muted underline hover:text-danger">{t("deleteAccount")}</button>
      </GlassCard>
    </>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm text-text">
      {label}
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-primary" : "bg-track"}`}>
        <span className={`absolute top-0.5 size-5 rounded-full bg-on-accent shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </label>
  );
}

function Row({ href, icon, children }: { href: string; icon: ReactNode; children: ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-3 py-2 text-sm text-text">
      <span className="text-primary">{icon}</span>
      <span className="flex-1">{children}</span>
      <ChevronRight className="size-4 text-muted" aria-hidden />
    </Link>
  );
}
