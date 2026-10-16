import { SendHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { GlassCard } from "@/components/ui/GlassCard";
import { Sparkle } from "@/components/ui/SectionTitle";

const CONTEXT = ["ctxStats", "ctxMbti", "ctxSaju", "ctxToday"] as const;

// AI 대화 — 서버 연결 전이라 입력은 비활성
export default function Page() {
  const t = useTranslations("pages.chat");

  return (
    <div className="flex min-h-[calc(100dvh-11rem)] flex-col gap-4">
      <header className="flex flex-col items-center pt-2 text-center">
        <span className="flex size-16 items-center justify-center rounded-full border border-gold text-gold shadow-[0_0_30px_-6px_var(--glow-gold)]">
          <Sparkle className="size-7" />
        </span>
        <h1 className="mt-3 font-display text-2xl text-text">{t("title")}</h1>
      </header>

      <section aria-label={t("contextLabel")} className="flex flex-wrap justify-center gap-2">
        {CONTEXT.map((key) => (
          <span key={key} className="glass rounded-full border border-border px-3 py-1 text-xs text-muted">
            {t(key)}
          </span>
        ))}
      </section>

      <GlassCard className="flex-1 text-center">
        <p className="mt-6 text-sm text-muted">{t("empty")}</p>
      </GlassCard>

      <section aria-label={t("suggestionsLabel")} className="flex flex-wrap gap-2">
        {(["q1", "q2"] as const).map((key) => (
          <span key={key} className="glass rounded-full border border-primary/50 px-4 py-2 text-sm text-text">
            {t(key)}
          </span>
        ))}
      </section>

      <div className="glass flex items-center gap-2 rounded-full p-1.5 pl-5">
        <input
          disabled
          placeholder={t("inputPlaceholder")}
          aria-label={t("inputPlaceholder")}
          className="flex-1 bg-transparent text-sm text-text placeholder:text-muted focus:outline-none"
        />
        <button
          type="button"
          disabled
          aria-label={t("send")}
          className="flex size-10 items-center justify-center rounded-full bg-gradient-to-r from-primary-deep to-primary text-on-accent disabled:opacity-50"
        >
          <SendHorizontal className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
