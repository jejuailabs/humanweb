import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { locale as rootLocale } from "next/root-params";
import { routing } from "./routing";

// Cache Components 환경에서 헤더를 읽지 않도록 root params로 언어를 정한다
// 라우트 핸들러처럼 root params가 없는 곳에서는 getTranslations({ locale })로 넘긴 값을 쓴다
export default getRequestConfig(async ({ locale: override }) => {
  const requested = override ?? (await rootLocale());
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
