"use client";

import { CalendarDays, House, Orbit, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { Sparkle } from "@/components/ui/SectionTitle";
import { Link, usePathname } from "@/i18n/navigation";

// 02_SCREENS.md 하단 탭 5개. 분석은 가운데 강조 (PC에서는 SideNav가 같은 목록을 쓴다)
export const TABS = [
  { key: "home", href: "/", icon: House, match: (p: string) => p === "/" },
  {
    key: "today",
    href: "/today",
    icon: CalendarDays,
    match: (p: string) => p.startsWith("/today") || p.startsWith("/diary"),
  },
  { key: "analyze", href: "/analyze", icon: null, match: (p: string) => p.startsWith("/analyze") },
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
      className="fixed inset-x-0 bottom-0 z-20 lg:hidden border-t border-border bg-nav backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          return (
            <li key={tab.key}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex h-[68px] flex-col items-center justify-center gap-1 text-[11px] transition-colors ${
                  active ? "text-gold" : "text-muted hover:text-text"
                }`}
              >
                {Icon ? (
                  <Icon className="size-6" strokeWidth={1.4} aria-hidden />
                ) : (
                  <span
                    className={`flex size-11 items-center justify-center rounded-full border ${
                      active
                        ? "border-gold shadow-[0_0_18px_-2px_var(--glow-gold)]"
                        : "border-border-strong"
                    }`}
                  >
                    <Sparkle className="size-5" />
                  </span>
                )}
                <span>{t(tab.key)}</span>
                {active && (
                  <span className="absolute bottom-1.5 size-1 rounded-full bg-gold" aria-hidden />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
