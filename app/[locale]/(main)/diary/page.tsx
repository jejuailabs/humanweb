import { CalendarDays, Globe, List, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { TodaySwitch } from "@/components/layout/TodaySwitch";
import { BUTTON_CLASS } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { SEGMENTED_WRAP, segmentedItem } from "@/components/ui/segmented";

// 기분 5종 — 그림은 SVG 아이콘으로 교체 예정 (ASSETS.md). 지금은 이모지
const MOODS = [
  { key: "moodGreat", emoji: "😆" },
  { key: "moodGood", emoji: "🙂" },
  { key: "moodOkay", emoji: "😐" },
  { key: "moodLow", emoji: "😔" },
  { key: "moodTired", emoji: "😴" },
] as const;

// 한 줄 일기장 — 로그인 연결 전이라 작성 영역은 비활성
export default function Page() {
  const t = useTranslations("pages.diary");

  return (
    <div className="flex flex-col gap-5">
      <TodaySwitch />

      <GlassCard variant="violet" className="flex flex-col gap-4">
        <SectionTitle>{t("composerLabel")}</SectionTitle>
        <div className="relative">
          <textarea
            disabled
            rows={2}
            maxLength={100}
            placeholder={t("placeholder")}
            aria-label={t("composerLabel")}
            className="w-full resize-none rounded-2xl border border-border bg-surface p-4 font-display text-lg text-text placeholder:text-muted focus:outline-none"
          />
          <span className="absolute right-3 bottom-3 text-xs text-muted">{t("count", { count: 0 })}</span>
        </div>
        <fieldset className="flex items-center justify-between" disabled>
          <legend className="sr-only">{t("moodLabel")}</legend>
          {MOODS.map((m) => (
            <button
              key={m.key}
              type="button"
              aria-label={t(m.key)}
              className="glass flex size-11 items-center justify-center rounded-full text-xl"
            >
              {m.emoji}
            </button>
          ))}
        </fieldset>
        <div className="flex items-center gap-2">
          <div className={`${SEGMENTED_WRAP} flex-1 grid-cols-2`}>
            <span className={`${segmentedItem(true)} flex items-center justify-center gap-1`}>
              <Lock className="size-3.5" aria-hidden />
              {t("private")}
            </span>
            <span className={`${segmentedItem(false)} flex items-center justify-center gap-1`}>
              <Globe className="size-3.5" aria-hidden />
              {t("public")}
            </span>
          </div>
          <button type="button" disabled className={BUTTON_CLASS.gold}>
            {t("save")}
          </button>
        </div>
        <p className="text-center text-xs text-muted">{t("loginRequired")}</p>
      </GlassCard>

      <section>
        <div className={`${SEGMENTED_WRAP} mb-4 grid-cols-2`}>
          <span className={`${segmentedItem(true)} flex items-center justify-center gap-1`}>
            <CalendarDays className="size-4" aria-hidden />
            {t("viewCalendar")}
          </span>
          <span className={`${segmentedItem(false)} flex items-center justify-center gap-1`}>
            <List className="size-4" aria-hidden />
            {t("viewList")}
          </span>
        </div>
        <GlassCard className="py-10 text-center">
          <h1 className="font-display text-2xl text-text">{t("title")}</h1>
          <p className="mx-auto mt-2 max-w-64 text-sm text-muted">{t("description")}</p>
        </GlassCard>
      </section>
    </div>
  );
}
