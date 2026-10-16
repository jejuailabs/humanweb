import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // 07_I18N_THEME.md: 초기 언어 ko, en. 지원 언어가 아니면 en
  locales: ["ko", "en"],
  defaultLocale: "en",
});

export type Locale = (typeof routing.locales)[number];
