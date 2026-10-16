"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

// 언어 이름은 번역하지 않고 각 언어 자신의 표기로 보여준다 (Intl API)
function nativeName(locale: Locale) {
  return new Intl.DisplayNames([locale], { type: "language" }).of(locale) ?? locale;
}

export function LocaleSwitcher() {
  const t = useTranslations("settings");
  const current = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm text-muted">{t("language")}</legend>
      <div className="grid grid-cols-2 rounded-full border border-border bg-surface p-1">
        {routing.locales.map((locale) => (
          <button
            key={locale}
            type="button"
            lang={locale}
            aria-pressed={current === locale}
            onClick={() => router.replace(pathname, { locale })}
            className={`rounded-full py-2 text-sm transition-colors ${
              current === locale ? "bg-primary text-bg font-medium" : "text-muted hover:text-text"
            }`}
          >
            {nativeName(locale)}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
