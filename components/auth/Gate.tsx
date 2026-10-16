"use client";

import { LogIn } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { BUTTON_CLASS } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Sparkle } from "@/components/ui/SectionTitle";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/client/auth";
import { useMe } from "@/lib/client/me";
import type { Me } from "@/lib/client/types";

// 로그인·가입 여부에 따라 안내 카드 또는 내용
export function Gate({ children }: { children: (me: Me) => ReactNode }) {
  const { user, ready } = useAuth();
  const { data: me, error } = useMe();
  const t = useTranslations("auth");

  if (!ready || (user && !me && !error)) return <Loading />;
  if (!user) {
    return (
      <GlassCard variant="violet" className="flex flex-col items-center gap-4 py-8 text-center">
        <Sparkle className="size-6 text-gold" />
        <p className="font-display text-xl text-text">{t("needLogin")}</p>
        <Link href="/login" className={BUTTON_CLASS.violet}>
          <LogIn className="size-4" aria-hidden />
          {t("login")}
        </Link>
      </GlassCard>
    );
  }
  if (error) return <ErrorCard />;
  if (me && !me.onboarded) {
    return (
      <GlassCard variant="violet" className="flex flex-col items-center gap-4 py-8 text-center">
        <p className="font-display text-xl text-text">{t("needOnboarding")}</p>
        <Link href="/onboarding" className={BUTTON_CLASS.violet}>
          {t("startOnboarding")}
        </Link>
      </GlassCard>
    );
  }
  return <>{children(me!)}</>;
}

export function Loading() {
  const t = useTranslations("common");
  return (
    <div className="flex justify-center py-16" role="status">
      <Sparkle className="size-6 animate-pulse text-gold" />
      <span className="sr-only">{t("loading")}</span>
    </div>
  );
}

export function ErrorCard({ message }: { message?: string }) {
  const t = useTranslations("common");
  return (
    <GlassCard className="py-8 text-center text-sm text-muted" role="alert">
      {message ?? t("error")}
    </GlassCard>
  );
}
