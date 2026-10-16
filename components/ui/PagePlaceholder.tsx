import { useTranslations } from "next-intl";

type PageKey = "home" | "today" | "diary" | "analyze" | "map" | "me" | "chat";

// 0단계 골격용. 각 화면을 구현하면서 교체한다.
export function PagePlaceholder({ page }: { page: PageKey }) {
  const t = useTranslations(`pages.${page}`);

  return (
    <section className="rounded-2xl border border-border bg-surface p-6 backdrop-blur-md">
      <h1 className="text-2xl font-semibold text-text">{t("title")}</h1>
      <p className="mt-2 text-sm text-muted">{t("description")}</p>
    </section>
  );
}
