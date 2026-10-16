"use client";

import { useTranslations } from "next-intl";
import { Loading } from "@/components/auth/Gate";
import { StepDots } from "@/components/ui/ProgressBar";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/client/auth";
import { useMe } from "@/lib/client/me";
import type { Me } from "@/lib/client/types";
import { AnalysisCard, type AnalysisKey, type AnalysisStatus } from "./AnalysisCard";

// 분석 허브. 토정비결(계산 기준 [확인 필요])·관상(민감정보 [확인 필요])·이름(P2)은 잠김
const LIST: { id: AnalysisKey; href?: string; done: (m?: Me) => boolean }[] = [
  { id: "zodiacBlood", href: "/analyze/zodiac", done: (m) => !!m?.analyses.zodiac },
  { id: "saju", href: "/analyze/saju", done: (m) => !!m?.analyses.saju },
  { id: "mbti", href: "/analyze/mbti", done: (m) => !!m?.analyses.mbti },
  { id: "palm", href: "/analyze/palm", done: (m) => !!m?.analyses.palm },
  { id: "tojeong", done: () => false },
  { id: "face", done: () => false },
  { id: "name", done: () => false },
];

export function AnalyzeHub() {
  const t = useTranslations("pages.analyze");
  const { user, ready } = useAuth();
  const { data: me, isLoading } = useMe();
  if (!ready || (user && isLoading)) return <Loading />;
  const onboarded = !!me?.onboarded;
  const items = LIST.map((x) => ({
    ...x,
    status: (x.done(me) ? "completed" : x.href && onboarded ? "available" : "locked") as AnalysisStatus,
  }));
  const total = 6;
  const done = items.filter((x) => x.status === "completed").length;

  return (
    <>
      <section className="flex flex-col gap-3">
        <p className="text-sm text-muted">{t("progress", { done, total })}</p>
        <StepDots done={done} total={total} />
      </section>
      <section className="flex flex-col gap-3">
        {items.map((x) =>
          x.href && x.status !== "locked" ? (
            <Link key={x.id} href={x.href}>
              <AnalysisCard id={x.id} status={x.status} />
            </Link>
          ) : (
            <AnalysisCard key={x.id} id={x.id} status={x.status} />
          ),
        )}
      </section>
    </>
  );
}
