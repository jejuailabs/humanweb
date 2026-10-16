import { useTranslations } from "next-intl";
import Image from "next/image";
import { AnalysisCard, type AnalysisKey, type AnalysisStatus } from "@/components/analysis/AnalysisCard";
import { StepDots } from "@/components/ui/ProgressBar";

// 분석 허브. 상태는 로그인·분석 연결 후 사용자 데이터로 바뀐다
const ANALYSES: { id: AnalysisKey; status: AnalysisStatus }[] = [
  { id: "zodiacBlood", status: "available" },
  { id: "mbti", status: "available" },
  { id: "saju", status: "locked" },
  { id: "palm", status: "locked" },
  { id: "tojeong", status: "locked" },
  { id: "face", status: "locked" },
  { id: "name", status: "locked" },
];

export default function Page() {
  const t = useTranslations("pages.analyze");
  const done = ANALYSES.filter((a) => a.status === "completed").length;
  const total = 6;

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

      <section className="flex flex-col gap-3">
        <p className="text-sm text-muted">{t("progress", { done, total })}</p>
        <StepDots done={done} total={total} />
      </section>

      <section className="flex flex-col gap-3">
        {ANALYSES.map((a) => (
          <AnalysisCard key={a.id} id={a.id} status={a.status} />
        ))}
      </section>
    </div>
  );
}
