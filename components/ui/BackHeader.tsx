"use client";

import { ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

// 상세 화면 머리: 뒤로 + 제목
export function BackHeader({ href, title }: { href: string; title: string }) {
  const t = useTranslations("common");
  return (
    <header className="flex items-center gap-3 pt-2">
      <Link href={href} aria-label={t("back")} className="glass flex size-10 shrink-0 items-center justify-center rounded-full text-text">
        <ChevronLeft className="size-5" aria-hidden />
      </Link>
      <h1 className="font-display text-2xl text-text">{title}</h1>
    </header>
  );
}
