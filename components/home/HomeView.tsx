"use client";

import { Brain, ChevronRight, Droplet, Flame, Lock, LogIn, MessageCircle, Rabbit, Sparkles, UserRound } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { AnalysisKey, AnalysisStatus } from "@/components/analysis/AnalysisCard";
import { Loading } from "@/components/auth/Gate";
import { BUTTON_CLASS } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { GlassCard } from "@/components/ui/GlassCard";
import { ImageCard } from "@/components/ui/ImageCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { RadarChart } from "@/components/ui/RadarChart";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { SectionTitle, Sparkle } from "@/components/ui/SectionTitle";
import { Link } from "@/i18n/navigation";
import { localDateKey, useApi } from "@/lib/client/api";
import { useAuth } from "@/lib/client/auth";
import { completedCount, useMe } from "@/lib/client/me";
import type { DailyResponse, Me } from "@/lib/client/types";

// 레이더 축 순서 (목업과 같은 배치)
const STAT_KEYS = ["leadership", "intuition", "empathy", "drive", "creativity", "sociability", "analysis", "stability", "adventure", "charisma"] as const;

// 스탯에 들어가는 분석 6개 (05_STATS_AND_AI.md)
const HOME_ANALYSES: { id: AnalysisKey; art: string; done: (me?: Me) => boolean; available: boolean }[] = [
  { id: "mbti", art: "/assets/analysis/card-mbti.webp", done: (m) => !!m?.analyses.mbti, available: true },
  { id: "saju", art: "/assets/analysis/card-saju.webp", done: (m) => !!m?.analyses.saju, available: true },
  { id: "palm", art: "/assets/analysis/card-palm.webp", done: (m) => !!m?.analyses.palm, available: true },
  { id: "zodiacBlood", art: "/assets/analysis/icon-zodiacBlood.webp", done: (m) => !!m?.analyses.zodiac, available: true },
  { id: "face", art: "/assets/analysis/icon-face.webp", done: () => false, available: false },
  { id: "name", art: "/assets/analysis/icon-name.webp", done: () => false, available: false },
];
const HREF: Partial<Record<AnalysisKey, string>> = { mbti: "/analyze/mbti", saju: "/analyze/saju", palm: "/analyze/palm", zodiacBlood: "/analyze/zodiac" };

export function HomeView() {
  const { user, ready } = useAuth();
  const { data: me, isLoading } = useMe();
  if (!ready || (user && isLoading)) return <Loading />;
  return <HomeInner me={user ? me : undefined} />;
}

function HomeInner({ me }: { me?: Me }) {
  const t = useTranslations("pages.home");
  const tc = useTranslations("common");
  const tb = useTranslations("badges");
  const ts = useTranslations("stats");
  const ta = useTranslations("analyses");
  const tz = useTranslations("zodiac");
  const tan = useTranslations("animals");
  const tbl = useTranslations("blood");
  const tau = useTranslations("auth");
  const tt = useTranslations("pages.today");
  const locale = useLocale();
  const onboarded = !!me?.onboarded;
  const { data: daily } = useApi<DailyResponse>(onboarded ? `/api/daily?date=${localDateKey()}&lang=${locale}&today=1` : null);
  const personal = daily?.items.daymaster ?? daily?.items.zodiac;
  const stats = me?.stats?.stats;
  const a = me?.analyses;

  const status = (x: (typeof HOME_ANALYSES)[number]): AnalysisStatus => (x.done(me) ? "completed" : x.available && onboarded ? "available" : "locked");

  // 모바일: 한 줄로 기존 순서 유지 / PC: 왼쪽(프로필·운세·보고서·완성도·대화) + 오른쪽(성향 지도·분석)
  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:items-start lg:gap-8">
      <div className="contents lg:flex lg:flex-col lg:gap-6">
      {/* 프로필 머리 */}
      <section className="order-1 flex flex-col items-center pt-2 text-center lg:order-none">
        <span className="relative flex size-28 items-center justify-center overflow-hidden rounded-full border-2 border-gold bg-surface shadow-[0_0_40px_-6px_var(--glow-gold)]">
          <UserRound className="size-12 text-muted" strokeWidth={1} aria-hidden />
        </span>
        <h1 className="mt-4 font-display text-3xl text-text">{me?.nickname ?? t("guestName")}</h1>
        <p className="mt-1 flex items-center gap-2 text-sm tracking-[0.15em] text-gold">
          <Sparkle className="size-3" />
          {me?.report?.title ?? (onboarded ? t("titleFallback") : t("guestTitle"))}
          <Sparkle className="size-3" />
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Chip icon={<Brain />} label={a?.mbti?.type ?? tc("unknown")} sub={tb("mbti")} />
          <Chip icon={<Sparkles />} label={a?.zodiac ? tz(a.zodiac.sign) : tc("unknown")} sub={tb("zodiac")} />
          <Chip icon={<Rabbit />} label={a?.saju ? tan(a.saju.animal) : tc("unknown")} sub={tb("animal")} />
          <Chip icon={<Droplet />} label={a?.blood ? tbl(a.blood.type) : tc("unknown")} sub={tb("blood")} tone="fate" />
        </div>
        {!me && (
          <Link href="/login" className={`${BUTTON_CLASS.violet} mt-5`}>
            <LogIn className="size-4" aria-hidden />
            {tau("login")}
          </Link>
        )}
        {me && !onboarded && (
          <Link href="/onboarding" className={`${BUTTON_CLASS.violet} mt-5`}>{tau("startOnboarding")}</Link>
        )}
      </section>

      {/* 오늘의 요약 카드 */}
      <Link href="/today" className="order-2 block lg:order-none">
        <ImageCard src="/assets/bg/home-fortune.webp" scrim="left" className="glass-violet">
          <div className="flex items-center gap-4 p-5">
            <ScoreRing size={92} showMax={false} value={personal?.scores.total} />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="flex items-center gap-2 text-xs tracking-[0.2em] text-on-image-muted">
                {t("summaryTitle")}
                {me?.streak && me.streak.count > 0 && (
                  <span className="flex items-center gap-0.5 tracking-normal text-gold">
                    <Flame className="size-3" aria-hidden />
                    {t("streak", { count: me.streak.count })}
                  </span>
                )}
              </span>
              <span className="mt-1 font-display text-lg leading-snug">{personal?.summary ?? (onboarded ? tt("generating") : t("summaryLocked"))}</span>
            </span>
            <ChevronRight className="size-5 shrink-0 text-on-image-muted" aria-hidden />
          </div>
        </ImageCard>
      </Link>

      {/* AI 종합 보고서 */}
      {me?.report ? (
        <Link href="/report" className="order-5 block lg:order-none">
          <GlassCard variant="gold">
            <SectionTitle>{t("reportTitle")}</SectionTitle>
            <p className="font-display text-lg text-gold">{me.report.title}</p>
            <p className="mt-2 line-clamp-3 text-sm text-text">{me.report.identity}</p>
            <span className="mt-3 flex items-center gap-1 text-xs text-muted">{t("reportOpen")} <ChevronRight className="size-3" /></span>
          </GlassCard>
        </Link>
      ) : (
        <GlassCard variant="locked" className="order-5 lg:order-none">
          <SectionTitle>{t("reportTitle")}</SectionTitle>
          <p className="text-sm text-muted">{onboarded ? t("reportMaking") : t("reportLocked")}</p>
        </GlassCard>
      )}

      {/* 프로필 완성도 */}
      <GlassCard className="order-6 flex flex-col gap-3 lg:order-none">
        <div className="flex items-baseline justify-between">
          <span className="font-display text-lg text-text">{t("profileTitle")}</span>
          <span className="font-display text-gold">{t("profileProgress", { done: completedCount(me), total: 7 })}</span>
        </div>
        <ProgressBar value={completedCount(me)} max={7} label={t("profileTitle")} />
        <span className="text-xs text-muted">{t("profileHint")}</span>
      </GlassCard>

      <Link href="/chat" className={`${BUTTON_CLASS.gold} order-7 w-full lg:order-none`}>
        <MessageCircle className="size-5" aria-hidden />
        {t("chatCta")}
      </Link>
      </div>

      <div className="contents lg:flex lg:flex-col lg:gap-6">
      {/* 성향 지도 */}
      <GlassCard className="order-3 lg:order-none">
        <SectionTitle action={<span className="text-xs text-muted">{t("completeness", { value: me?.stats?.completeness ?? 0 })}</span>}>
          {t("mapTitle")}
        </SectionTitle>
        <div className={me?.stats && me.stats.completeness < 40 ? "opacity-60" : ""}>
          <RadarChart size={300} axes={STAT_KEYS.map((key) => ({ key, label: ts(key), value: stats?.[key] }))} />
        </div>
        <p className="mt-2 text-center text-xs text-muted">{t("mapLocked")}</p>
      </GlassCard>

      {/* 분석 카드 3열 */}
      <section className="order-4 lg:order-none">
        <SectionTitle>{t("analysesTitle")}</SectionTitle>
        <div className="grid grid-cols-3 gap-2.5">
          {HOME_ANALYSES.map((x) => {
            const s = status(x);
            const card = (
              <ImageCard src={x.art} className={`aspect-[3/4] ${s === "completed" ? "glass-gold" : s === "available" ? "glass-violet" : "opacity-55 saturate-50"}`} sizes="140px">
                {s === "locked" && <Lock className="absolute top-2 right-2 size-3.5 text-on-image-muted" aria-hidden />}
                <div className="flex h-full flex-col justify-end p-2.5">
                  <span className="font-display text-[15px] leading-tight">{ta(`${x.id}.title`)}</span>
                  <span className={`mt-0.5 text-[10px] ${s === "available" ? "text-primary" : s === "completed" ? "text-gold" : "text-on-image-muted"}`}>
                    {ta(`status.${s}`)}
                  </span>
                </div>
              </ImageCard>
            );
            return s !== "locked" && HREF[x.id] ? (
              <Link key={x.id} href={HREF[x.id]!} aria-label={ta(`${x.id}.title`)}>{card}</Link>
            ) : (
              <div key={x.id}>{card}</div>
            );
          })}
        </div>
      </section>

      </div>
    </div>
  );
}
