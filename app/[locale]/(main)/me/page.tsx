import { MessageCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { PagePlaceholder } from "@/components/ui/PagePlaceholder";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Link } from "@/i18n/navigation";

export default async function Page() {
  const t = await getTranslations("pages.me");

  return (
    <div className="flex flex-col gap-4">
      <PagePlaceholder page="me" />
      <Link
        href="/chat"
        className="flex items-center justify-center gap-2 rounded-2xl border border-gold py-3 text-gold"
      >
        <MessageCircle className="size-5" aria-hidden />
        {t("chatEntry")}
      </Link>
      <section className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-6 backdrop-blur-md">
        <ThemeToggle />
        <LocaleSwitcher />
      </section>
    </div>
  );
}
