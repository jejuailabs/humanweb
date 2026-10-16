"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { SEGMENTED_WRAP, segmentedItem } from "@/components/ui/segmented";

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
      <div className={`${SEGMENTED_WRAP} grid-cols-2`}>
        {routing.locales.map((locale) => (
          <button
            key={locale}
            type="button"
            lang={locale}
            aria-pressed={current === locale}
            onClick={() => router.replace(pathname, { locale })}
            className={segmentedItem(current === locale)}
          >
            {nativeName(locale)}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
