import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/brand/Logo";
import { Link } from "@/i18n/navigation";

export function TopBar() {
  const t = useTranslations();

  return (
    <header className="sticky top-0 z-10 bg-gradient-to-b from-bg/70 to-transparent">
      <div className="mx-auto flex h-16 max-w-md items-center justify-between px-5">
        <Link href="/" aria-label={t("meta.title")}>
          <Logo size={26} tagline={t("brand.tagline")} />
        </Link>
        {/* 연결 요청·수락 알림 (02_SCREENS.md) — 목록 화면은 7단계 */}
        <button
          type="button"
          aria-label={t("nav.notifications")}
          className="flex size-10 items-center justify-center rounded-full text-text hover:text-gold"
        >
          <Bell className="size-5" strokeWidth={1.5} aria-hidden />
        </button>
      </div>
    </header>
  );
}
