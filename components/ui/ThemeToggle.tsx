"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { applyTheme, readTheme, subscribeTheme, THEMES, type Theme } from "@/lib/theme";
import { SEGMENTED_WRAP, segmentedItem } from "@/components/ui/segmented";

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
      <div className={`${SEGMENTED_WRAP} grid-cols-3`}>
        {THEMES.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={theme === value}
            onClick={() => applyTheme(value)}
            className={segmentedItem(theme === value)}
          >
            {t(LABEL_KEYS[value])}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
