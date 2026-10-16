"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { applyTheme, readTheme, subscribeTheme, THEMES, type Theme } from "@/lib/theme";

const LABEL_KEYS: Record<Theme, "themeSystem" | "themeLight" | "themeDark"> = {
  system: "themeSystem",
  light: "themeLight",
  dark: "themeDark",
};

export function ThemeToggle() {
  const t = useTranslations("settings");
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => "system" as Theme);

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm text-muted">{t("theme")}</legend>
      <div className="grid grid-cols-3 rounded-full border border-border bg-surface p-1">
        {THEMES.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={theme === value}
            onClick={() => applyTheme(value)}
            className={`rounded-full py-2 text-sm transition-colors ${
              theme === value ? "bg-primary text-bg font-medium" : "text-muted hover:text-text"
            }`}
          >
            {t(LABEL_KEYS[value])}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
