import { Brain, ChevronRight, Droplet, Lock, MessageCircle, Rabbit, Sparkles, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AnalysisKey, AnalysisStatus } from "@/components/analysis/AnalysisCard";
import { BUTTON_CLASS } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { GlassCard } from "@/components/ui/GlassCard";
import { HeroArt, ImageCard } from "@/components/ui/ImageCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { RadarChart } from "@/components/ui/RadarChart";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { SectionTitle, Sparkle } from "@/components/ui/SectionTitle";
import { Link } from "@/i18n/navigation";

const STAT_KEYS = [
  "leadership",
  "intuition",
  "empathy",
  "drive",
  "creativity",
  "sociability",
  "analysis",
  "stability",
  "adventure",
  "charisma",
] as const;

// 스탯에 들어가는 분석 6개 (05_STATS_AND_AI.md 가중치 표). 전용 카드 그림이 없는 것은 아이콘 그림을 쓴다
// 상태는 로그인·분석 연결 후 사용자 데이터로 바뀐다
const HOME_ANALYSES: { id: AnalysisKey; art: string; status: AnalysisStatus }[] = [
  { id: "mbti", art: "/assets/analysis/card-mbti.webp", status: "available" },
  { id: "saju", art: "/assets/analysis/card-saju.webp", status: "locked" },
  { id: "palm", art: "/assets/analysis/card-palm.webp", status: "locked" },
  { id: "zodiacBlood", art: "/assets/analysis/icon-zodiacBlood.webp", status: "available" },
  { id: "face", art: "/assets/analysis/icon-face.webp", status: "locked" },
  { id: "name", art: "/assets/analysis/icon-name.webp", status: "locked" },
];

// 홈 — 종합 대시보드. 로그인·분석 연결 전이라 빈 상태로 그린다
export default function Page() {
  const t = useTranslations("pages.home");
  const tc = useTranslations("common");
  const tb = useTranslations("badges");
  const ts = useTranslations("stats");
  const ta = useTranslations("analyses");

  return (
    <div className="flex flex-col gap-6">
      <HeroArt src="/assets/bg/home-hero.webp" height={520} />

      {/* 프로필 머리 */}
      <section className="flex flex-col items-center pt-2 text-center">
        <span className="relative flex size-28 items-center justify-center rounded-full border-2 border-gold bg-surface shadow-[0_0_40px_-6px_var(--glow-gold)]">
          <UserRound className="size-12 text-muted" strokeWidth={1} aria-hidden />
        </span>
        <h1 className="mt-4 font-display text-3xl text-text">{t("guestName")}</h1>
        <p className="mt-1 flex items-center gap-2 text-sm tracking-[0.15em] text-gold">
          <Sparkle className="size-3" />
          {t("guestTitle")}
          <Sparkle className="size-3" />
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Chip icon={<Brain />} label={tc("unknown")} sub={tb("mbti")} />
          <Chip icon={<Sparkles />} label={tc("unknown")} sub={tb("zodiac")} />
          <Chip icon={<Rabbit />} label={tc("unknown")} sub={tb("animal")} />
          <Chip icon={<Droplet />} label={tc("unknown")} sub={tb("blood")} tone="fate" />
        </div>
      </section>

      {/* 오늘의 요약 카드 */}
      <Link href="/today" className="block">
        <ImageCard src="/assets/bg/home-fortune.webp" scrim="left" className="glass-violet">
          <div className="flex items-center gap-4 p-5">
            <ScoreRing size={92} showMax={false} />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-xs tracking-[0.2em] text-on-image-muted">{t("summaryTitle")}</span>
              <span className="mt-1 font-display text-lg leading-snug">{t("summaryLocked")}</span>
            </span>
            <ChevronRight className="size-5 shrink-0 text-on-image-muted" aria-hidden />
          </div>
        </ImageCard>
      </Link>

      {/* 성향 지도 */}
      <GlassCard>
        <SectionTitle action={<span className="text-xs text-muted">{t("completeness", { value: 0 })}</span>}>
          {t("mapTitle")}
        </SectionTitle>
        <RadarChart size={300} axes={STAT_KEYS.map((key) => ({ key, label: ts(key) }))} />
        <p className="mt-2 text-center text-xs text-muted">{t("mapLocked")}</p>
      </GlassCard>

      {/* 분석 카드 */}
      <section>
        <SectionTitle>{t("analysesTitle")}</SectionTitle>
        <div className="grid grid-cols-3 gap-2.5">
          {HOME_ANALYSES.map(({ id, art, status }) => (
            <Link key={id} href="/analyze" aria-label={ta(`${id}.title`)}>
              <ImageCard
                src={art}
                className={`aspect-[3/4] ${
                  status === "completed"
                    ? "glass-gold"
                    : status === "available"
                      ? "glass-violet"
                      : "opacity-55 saturate-50"
                }`}
                sizes="140px"
              >
                {status === "locked" && (
                  <Lock className="absolute top-2 right-2 size-3.5 text-on-image-muted" aria-hidden />
                )}
                <div className="flex h-full flex-col justify-end p-2.5">
                  <span className="font-display text-[15px] leading-tight">{ta(`${id}.title`)}</span>
                  <span
                    className={`mt-0.5 text-[10px] ${status === "available" ? "text-primary" : "text-on-image-muted"}`}
                  >
                    {ta(`status.${status}`)}
                  </span>
                </div>
              </ImageCard>
            </Link>
          ))}
        </div>
      </section>

      {/* AI 종합 보고서 */}
      <GlassCard variant="locked">
        <SectionTitle>{t("reportTitle")}</SectionTitle>
        <p className="text-sm text-muted">{t("reportLocked")}</p>
      </GlassCard>

      {/* 프로필 완성도 */}
      <GlassCard className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <span className="font-display text-lg text-text">{t("profileTitle")}</span>
          <span className="font-display text-gold">{t("profileProgress", { done: 0, total: 7 })}</span>
        </div>
        <ProgressBar value={0} max={7} label={t("profileTitle")} />
        <span className="text-xs text-muted">{t("profileHint")}</span>
      </GlassCard>

      <Link href="/chat" className={`${BUTTON_CLASS.gold} w-full`}>
        <MessageCircle className="size-5" aria-hidden />
        {t("chatCta")}
      </Link>
    </div>
  );
}
