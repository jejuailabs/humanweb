"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { SEGMENTED_WRAP, segmentedItem } from "@/components/ui/segmented";

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
      className={`${SEGMENTED_WRAP} grid-cols-2 mb-4`}
    >
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          className={segmentedItem(item.active)}
        >
          {t(item.key)}
        </Link>
      ))}
    </nav>
  );
}
