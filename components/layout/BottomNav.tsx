"use client";

import { CalendarDays, House, Orbit, Sparkles, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

// 02_SCREENS.md 하단 탭 5개. 분석은 가운데 강조
const TABS = [
  { key: "home", href: "/", icon: House, match: (p: string) => p === "/" },
  {
    key: "today",
    href: "/today",
    icon: CalendarDays,
    match: (p: string) => p.startsWith("/today") || p.startsWith("/diary"),
  },
  {
    key: "analyze",
    href: "/analyze",
    icon: Sparkles,
    match: (p: string) => p.startsWith("/analyze"),
    center: true,
  },
  { key: "map", href: "/map", icon: Orbit, match: (p: string) => p.startsWith("/map") },
  {
    key: "me",
    href: "/me",
    icon: UserRound,
    match: (p: string) => p.startsWith("/me") || p.startsWith("/chat"),
  },
] as const;

export function BottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <nav
      aria-label={t("label")}
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-nav backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          const center = "center" in tab && tab.center;
          return (
            <li key={tab.key}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-16 flex-col items-center justify-center gap-1 text-xs transition-colors ${
                  active ? "text-gold" : "text-muted hover:text-text"
                }`}
              >
                {center ? (
                  <span
                    className={`flex size-9 items-center justify-center rounded-full border ${
                      active ? "border-gold" : "border-border"
                    }`}
                  >
                    <Icon className="size-5" aria-hidden />
                  </span>
                ) : (
                  <Icon className="size-6" aria-hidden />
                )}
                <span>{t(tab.key)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
