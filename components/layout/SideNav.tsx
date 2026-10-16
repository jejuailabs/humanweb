"use client";

import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/brand/Logo";
import { Sparkle } from "@/components/ui/SectionTitle";
import { Link, usePathname } from "@/i18n/navigation";
import { TABS } from "./BottomNav";

// PC(1024px 이상) 왼쪽 사이드 메뉴. 모바일에서는 TopBar + BottomNav
export function SideNav() {
  const t = useTranslations();
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-border bg-nav px-5 py-8 backdrop-blur-xl lg:flex">
      <Link href="/" aria-label={t("meta.title")} className="px-3">
        <Logo size={30} tagline={t("brand.tagline")} />
      </Link>
      <nav aria-label={t("nav.label")} className="mt-10 flex-1">
        <ul className="flex flex-col gap-1">
          {TABS.map((tab) => {
            const active = tab.match(pathname);
            const Icon = tab.icon;
            return (
              <li key={tab.key}>
                <Link
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex h-12 items-center gap-3 rounded-2xl px-3 text-sm transition-colors ${
                    active ? "bg-surface-strong text-gold" : "text-muted hover:bg-surface hover:text-text"
                  }`}
                >
                  {active && <span className="absolute top-3 bottom-3 left-0 w-0.5 rounded-full bg-gold" aria-hidden />}
                  {Icon ? (
                    <Icon className="size-5" strokeWidth={1.5} aria-hidden />
                  ) : (
                    <span className={`flex size-7 items-center justify-center rounded-full border ${active ? "border-gold shadow-[0_0_14px_-2px_var(--glow-gold)]" : "border-border-strong"}`}>
                      <Sparkle className="size-3.5" />
                    </span>
                  )}
                  {t(`nav.${tab.key}`)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {/* 연결 요청·수락 알림 (02_SCREENS.md) — 목록 화면은 7단계 */}
      <button type="button" className="flex h-12 items-center gap-3 rounded-2xl px-3 text-sm text-muted hover:bg-surface hover:text-text">
        <Bell className="size-5" strokeWidth={1.5} aria-hidden />
        {t("nav.notifications")}
      </button>
    </aside>
  );
}
