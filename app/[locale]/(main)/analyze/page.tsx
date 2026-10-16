import { useTranslations } from "next-intl";
import Image from "next/image";
import { AnalyzeHub } from "@/components/analysis/AnalyzeHub";

// 분석 허브 (02_SCREENS.md 5)
export default function Page() {
  const t = useTranslations("pages.analyze");

  return (
    <div className="flex flex-col gap-6">
      <header className="relative flex items-center pt-2">
        <div className="relative z-10 max-w-[65%]">
          <h1 className="font-display text-4xl leading-tight text-text">{t("title")}</h1>
          <p className="mt-2 text-sm text-muted">{t("description")}</p>
        </div>
        <Image
          src="/assets/analysis/hero-moon.webp"
          alt=""
          width={160}
          height={160}
          priority
          className="absolute -top-4 -right-2 size-40 rounded-full mix-blend-screen [mask-image:radial-gradient(circle,black_55%,transparent_72%)]"
        />
      </header>

      <AnalyzeHub />
    </div>
  );
}
