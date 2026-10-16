"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

// 오늘 탭 상단 전환: 운세 / 일기 (02_SCREENS.md)
export function TodaySwitch() {
  const t = useTranslations("today");
  const pathname = usePathname();
  const items = [
    { key: "fortune", href: "/today", active: pathname.startsWith("/today") },
    { key: "diary", href: "/diary", active: pathname.startsWith("/diary") },
  ] as const;

  return (
    <nav
      aria-label={t("switchLabel")}
      className="mb-4 grid grid-cols-2 rounded-full border border-border bg-surface p-1"
    >
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          className={`rounded-full py-2 text-center text-sm transition-colors ${
            item.active ? "bg-primary text-bg font-medium" : "text-muted hover:text-text"
          }`}
        >
          {t(item.key)}
        </Link>
      ))}
    </nav>
  );
}
