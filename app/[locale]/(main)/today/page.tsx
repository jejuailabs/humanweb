import {
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Coins,
  Compass,
  Gem,
  Hash,
  Heart,
  Palette,
  Share2,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { TodaySwitch } from "@/components/layout/TodaySwitch";
import { TodayDate } from "@/components/today/TodayDate";
import { GlassCard } from "@/components/ui/GlassCard";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { OrnamentDivider } from "@/components/ui/SectionTitle";
import { SEGMENTED_WRAP, segmentedItem } from "@/components/ui/segmented";

// 언어권별 기본 탭 순서 (07_I18N_THEME.md)
const CATEGORY_ORDER = {
  ko: ["catMine", "catZodiac", "catAnimal", "catBlood", "catMbti"],
  en: ["catZodiac", "catMbti", "catMine", "catAnimal", "catBlood"],
} as const;

// 오늘 — 데일리 대시보드. 운세 생성 연결 전이라 빈 상태로 그린다
export default function Page() {
  const t = useTranslations("pages.today");
  const tc = useTranslations("common");
  const locale = useLocale() as keyof typeof CATEGORY_ORDER;
  const categories = CATEGORY_ORDER[locale] ?? CATEGORY_ORDER.en;

  const lucky = [
    { key: "luckyColor", icon: Palette },
    { key: "luckyNumber", icon: Hash },
    { key: "luckyDirection", icon: Compass },
    { key: "luckyItem", icon: Gem },
  ] as const;

  return (
    <div className="flex flex-col">
      <TodaySwitch />

      {/* 날짜 + 이동 */}
      <section className="flex items-center justify-between">
        <button type="button" aria-label={t("prevDay")} className="glass flex size-10 items-center justify-center rounded-full text-text">
          <ChevronLeft className="size-5" aria-hidden />
        </button>
        <TodayDate />
        <button type="button" aria-label={t("nextDay")} className="glass flex size-10 items-center justify-center rounded-full text-text" disabled>
          <ChevronRight className="size-5 opacity-40" aria-hidden />
        </button>
      </section>

      {/* 총운 점수 링 */}
      <section className="my-6 flex justify-center">
        <ScoreRing size={240} caption={t("scoreCaption")} />
      </section>

      {/* 행운 요소 4종 */}
      <section className="grid grid-cols-4 gap-2">
        {lucky.map(({ key, icon: Icon }) => (
          <GlassCard key={key} className="flex flex-col items-center gap-2 !p-3 text-center">
            <Icon className="size-6 text-gold" strokeWidth={1.3} aria-hidden />
            <span className="text-[10px] leading-tight text-muted">{t(key)}</span>
            <span className="font-display text-base text-text">{tc("unknown")}</span>
          </GlassCard>
        ))}
      </section>

      <OrnamentDivider />

      {/* 카테고리 탭 */}
      <nav aria-label={t("categoriesLabel")} className={`${SEGMENTED_WRAP} mb-4 grid-cols-5`}>
        {categories.map((key, i) => (
          <span key={key} className={`${segmentedItem(i === 0)} !text-xs`}>
            {t(key)}
          </span>
        ))}
      </nav>

      {/* 오늘의 메시지 */}
      <GlassCard className="flex flex-col gap-4">
        <span className="text-[10px] tracking-[0.35em] text-muted uppercase">{t("messageLabel")}</span>
        <p className="font-display text-xl leading-snug text-text">{t("messageLocked")}</p>
        <span className="h-px bg-border" />
        <div className="flex flex-col gap-3">
          <ScoreBar label={t("love")} color="love" icon={<Heart />} />
          <ScoreBar label={t("money")} color="money" icon={<Coins />} />
          <ScoreBar label={t("work")} color="work" icon={<BriefcaseBusiness />} />
        </div>
      </GlassCard>

      {/* 이번 달 토정비결 (접힘) */}
      <GlassCard className="mt-4 flex items-center gap-4">
        <CalendarDays className="size-6 shrink-0 text-gold" strokeWidth={1.3} aria-hidden />
        <span className="flex flex-1 flex-col">
          <span className="font-display text-lg text-text">{t("tojeongTitle")}</span>
          <span className="text-xs text-muted">{t("tojeongDesc")}</span>
        </span>
        <ChevronDown className="size-5 text-muted" aria-hidden />
      </GlassCard>

      <button type="button" className="mt-4 flex items-center justify-center gap-2 self-center text-sm text-muted hover:text-text">
        <Share2 className="size-4" aria-hidden />
        {t("share")}
      </button>
    </div>
  );
}
