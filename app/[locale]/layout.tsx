import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";
import { routing } from "@/i18n/routing";
import { themeInitScript } from "@/lib/theme";
import "../globals.css";

// 제목: Cormorant Garamond(라틴) + Noto Serif KR(한글), 본문: Noto Sans KR, 로고: Cinzel
// next/font/google이 Next 16.4 Turbopack(Windows)에서 빌드 실패해 Google Fonts를 직접 링크한다
const FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Cinzel:wght@400&family=Cormorant+Garamond:wght@400;500;600&family=Noto+Sans+KR:wght@400;500;700&family=Noto+Serif+KR:wght@500;600&display=swap";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("title"), description: t("description") };
}

export default async function LocaleLayout({ children }: LayoutProps<"/[locale]">) {
  const locale = await rootLocale();
  if (!hasLocale(routing.locales, locale)) notFound();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={FONTS_HREF} />
      </head>
      <body className="min-h-full">
        <div className="starfield" aria-hidden />
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
