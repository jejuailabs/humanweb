import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function TopBar() {
  const t = useTranslations();

  return (
    <header className="sticky top-0 z-10 bg-nav backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
        <Link href="/" className="text-xl tracking-[0.3em] text-text">
          {t("meta.title")}
        </Link>
        {/* 연결 요청·수락 알림 (02_SCREENS.md) — 목록 화면은 7단계 */}
        <button
          type="button"
          aria-label={t("nav.notifications")}
          className="flex size-10 items-center justify-center rounded-full text-muted hover:text-text"
        >
          <Bell className="size-5" aria-hidden />
        </button>
      </div>
    </header>
  );
}
