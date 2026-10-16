"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { BUTTON_CLASS } from "@/components/ui/Button";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/client/api";
import { signInWithGoogle, useAuth } from "@/lib/client/auth";
import type { Me } from "@/lib/client/types";

export function LoginView() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const { user, ready } = useAuth();
  const router = useRouter();
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  // 로그인되면 가입 여부에 따라 이동
  useEffect(() => {
    if (!ready || !user) return;
    api<Me>("/api/me")
      .then((me) => router.replace(me.onboarded ? "/" : "/onboarding"))
      .catch(() => router.replace("/onboarding"));
  }, [ready, user, router]);

  async function google() {
    setBusy(true);
    setError(false);
    try {
      await signInWithGoogle();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col items-center justify-end gap-6 pb-6 text-center">
      <Logo size={44} />
      <div>
        <h1 className="font-display text-3xl text-text">{t("loginTitle")}</h1>
        <p className="mt-2 text-sm text-muted">{t("loginDesc")}</p>
      </div>
      <div className="flex w-full flex-col gap-3">
        <button type="button" onClick={google} disabled={busy} className={`${BUTTON_CLASS.gold} w-full`}>
          <GoogleMark />
          {t("google")}
        </button>
        {/* Apple·카카오는 개발자 계정 연동 후 연다 (01_FEATURES.md, 카카오 커스텀 토큰 [확인 필요]) */}
        <button type="button" disabled className={`${BUTTON_CLASS.ghost} w-full`}>
          {t("apple")} · {tc("comingSoon")}
        </button>
        <button type="button" disabled className={`${BUTTON_CLASS.ghost} w-full`}>
          {t("kakao")} · {tc("comingSoon")}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {t("loginFailed")}
        </p>
      )}
      <p className="text-xs text-muted">{t("disclaimer")}</p>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="currentColor" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3Z" />
      <path fill="currentColor" opacity=".8" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z" />
      <path fill="currentColor" opacity=".6" d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2L6.4 14Z" />
      <path fill="currentColor" opacity=".9" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.4L6.4 10C7.2 7.7 9.4 6 12 6Z" />
    </svg>
  );
}
