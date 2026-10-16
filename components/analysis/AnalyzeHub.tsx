"use client";

import { useTranslations } from "next-intl";
import { Loading } from "@/components/auth/Gate";
import { StepDots } from "@/components/ui/ProgressBar";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/client/auth";
import { useMe } from "@/lib/client/me";
import { useApi } from "@/lib/client/api";
import type { Me, TojeongResponse } from "@/lib/client/types";
import { AnalysisCard, type AnalysisKey, type AnalysisStatus } from "./AnalysisCard";

// 분석 허브. 가입 전에는 모두 잠김
const LIST: { id: AnalysisKey; href?: string; done: (m?: Me, tojeongDone?: boolean) => boolean }[] = [
  { id: "zodiacBlood", href: "/analyze/zodiac", done: (m) => !!m?.analyses.zodiac },
  { id: "saju", href: "/analyze/saju", done: (m) => !!m?.analyses.saju },
  { id: "mbti", href: "/analyze/mbti", done: (m) => !!m?.analyses.mbti },
  { id: "palm", href: "/analyze/palm", done: (m) => !!m?.analyses.palm },
  { id: "tojeong", href: "/analyze/tojeong", done: (_m, tj) => !!tj },
  { id: "face", href: "/analyze/face", done: (m) => !!m?.analyses.face },
  { id: "name", href: "/analyze/name", done: (m) => !!m?.analyses.name },
];

export function AnalyzeHub() {
  const t = useTranslations("pages.analyze");
  const { user, ready } = useAuth();
  const { data: me, isLoading } = useMe();
  const { data: tojeong } = useApi<TojeongResponse>(me?.onboarded ? "/api/tojeong" : null);
  if (!ready || (user && isLoading)) return <Loading />;
  const onboarded = !!me?.onboarded;
  const tojeongDone = !!tojeong?.tojeong;
  const items = LIST.map((x) => ({
    ...x,
    status: (x.done(me, tojeongDone) ? "completed" : x.href && onboarded ? "available" : "locked") as AnalysisStatus,
  }));
  const total = LIST.length;
  const done = items.filter((x) => x.status === "completed").length;

  return (
    <>
      <section className="flex flex-col gap-3">
        <p className="text-sm text-muted">{t("progress", { done, total })}</p>
        <StepDots done={done} total={total} />
      </section>
      <section className="flex flex-col gap-3 lg:grid lg:grid-cols-2">
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
