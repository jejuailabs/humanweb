import { MessageCircle, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { BUTTON_CLASS } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Link } from "@/i18n/navigation";

export default function Page() {
  const t = useTranslations("pages.me");
  const th = useTranslations("pages.home");

  return (
    <div className="flex flex-col gap-5">
      <GlassCard className="flex items-center gap-4">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-full border-2 border-gold bg-surface shadow-[0_0_24px_-6px_var(--glow-gold)]">
          <UserRound className="size-8 text-muted" strokeWidth={1} aria-hidden />
        </span>
        <span className="flex flex-col">
          <h1 className="font-display text-2xl text-text">{th("guestName")}</h1>
          <span className="text-sm text-muted">{t("description")}</span>
        </span>
      </GlassCard>

      <Link href="/chat" className={`${BUTTON_CLASS.gold} w-full`}>
        <MessageCircle className="size-5" aria-hidden />
        {t("chatEntry")}
      </Link>

      <GlassCard className="flex flex-col gap-5">
        <SectionTitle>{t("settingsTitle")}</SectionTitle>
        <ThemeToggle />
        <LocaleSwitcher />
      </GlassCard>
    </div>
  );
}
