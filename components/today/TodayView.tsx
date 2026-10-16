"use client";

import { BriefcaseBusiness, CalendarDays, ChevronLeft, ChevronRight, Coins, Compass, Gem, Hash, Heart, Palette, Share2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { ErrorCard, Gate, Loading } from "@/components/auth/Gate";
import { DiaryComposer } from "@/components/diary/DiaryComposer";
import { GlassCard } from "@/components/ui/GlassCard";
import { ImageCard } from "@/components/ui/ImageCard";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { OrnamentDivider } from "@/components/ui/SectionTitle";
import { SEGMENTED_WRAP, segmentedItem } from "@/components/ui/segmented";
import { localDateKey, shiftDate, useApi } from "@/lib/client/api";
import { shareCard } from "@/lib/client/share";
import type { DailyResponse, Me } from "@/lib/client/types";

// 언어권별 기본 탭 순서 (07_I18N_THEME.md)
const ORDER = {
  ko: ["daymaster", "zodiac", "animal", "blood", "mbti"],
  en: ["zodiac", "mbti", "daymaster", "animal", "blood"],
} as const;
const TAB_LABEL = { daymaster: "catMine", zodiac: "catZodiac", animal: "catAnimal", blood: "catBlood", mbti: "catMbti" } as const;
type Cat = keyof typeof TAB_LABEL;

export function TodayView() {
  return <Gate>{(me) => <TodayInner me={me} />}</Gate>;
}

function TodayInner({ me }: { me: Me }) {
  const t = useTranslations("pages.today");
  const tl = useTranslations("lucky");
  const ts = useTranslations("stats");
  const locale = useLocale() as "ko" | "en";
  const today = localDateKey();
  const [date, setDate] = useState(today);
  const isToday = date === today;
  const { data, error, isLoading } = useApi<DailyResponse>(`/api/daily?date=${date}&lang=${locale}${isToday ? "&today=1" : ""}`);
  const order = ORDER[locale] ?? ORDER.en;
  const [tab, setTab] = useState<Cat>(order[0]);

  const personal = data?.items.daymaster ?? data?.items.zodiac;
  const current = data?.items[tab];
  const dateLabel = new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(`${date}T12:00:00`));

  async function share() {
    if (!personal) return;
    await shareCard({ kind: "fortune", lang: locale, date, text: personal.summary, score: personal.scores.total }).catch(() => {});
  }

  return (
    <div className="flex flex-col">
      {/* 날짜 + 이동 */}
      <section className="flex items-center justify-between">
        <button type="button" aria-label={t("prevDay")} onClick={() => setDate(shiftDate(date, -1))} className="glass flex size-10 items-center justify-center rounded-full text-text">
          <ChevronLeft className="size-5" aria-hidden />
        </button>
        <div className="flex flex-col items-center">
          <span className="font-display text-3xl text-text">{dateLabel}</span>
          {data && (
            <span className="mt-1 flex items-center gap-2 text-xs text-muted">
              {t(data.pillar.lunar.isLeap ? "lunarLeap" : "lunarDate", { month: data.pillar.lunar.month, day: data.pillar.lunar.day })}
              <span className="rounded-full border border-gold/60 px-2 py-0.5 text-gold">{t("pillar", { ganzhi: locale === "ko" ? `${data.pillar.ganzhi} ${data.pillar.ko}` : data.pillar.ganzhi })}</span>
            </span>
          )}
        </div>
        <button type="button" aria-label={t("nextDay")} disabled={isToday} onClick={() => setDate(shiftDate(date, 1))} className="glass flex size-10 items-center justify-center rounded-full text-text disabled:opacity-30">
          <ChevronRight className="size-5" aria-hidden />
        </button>
      </section>

      {error ? (
        <div className="mt-6"><ErrorCard /></div>
      ) : isLoading || !data ? (
        <div className="mt-10 flex flex-col items-center gap-2 text-sm text-muted">
          <Loading />
          {t("generating")}
        </div>
      ) : (
        // 모바일: 한 줄 그대로 / PC: 왼쪽(점수 링·행운·보정, 스크롤 고정) + 오른쪽(카테고리·메시지·토정비결·일기)
        <div className="contents lg:mt-8 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start lg:gap-10">
          <div className="contents lg:sticky lg:top-10 lg:flex lg:flex-col">
          {/* 총운 점수 링 */}
          <section className="my-6 flex flex-col items-center lg:mt-0">
            <ScoreRing size={240} caption={t("scoreCaption")} value={personal?.scores.total} />
            {personal && <p className="mt-3 max-w-72 text-center font-display text-lg text-text">{personal.summary}</p>}
          </section>

          {/* 행운 요소 4종 */}
          {personal && (
            <section className="grid grid-cols-4 gap-2">
              {[
                { key: "luckyColor", icon: Palette, value: tl(`colors.${personal.lucky.color}`) },
                { key: "luckyNumber", icon: Hash, value: String(personal.lucky.number) },
                { key: "luckyDirection", icon: Compass, value: tl(`directions.${personal.lucky.direction}`) },
                { key: "luckyItem", icon: Gem, value: tl(`items.${personal.lucky.item}`) },
              ].map(({ key, icon: Icon, value }) => (
                <GlassCard key={key} className="flex flex-col items-center gap-2 !p-3 text-center">
                  <Icon className="size-6 text-gold" strokeWidth={1.3} aria-hidden />
                  <span className="text-[10px] leading-tight text-muted">{t(key)}</span>
                  <span className="font-display text-base leading-tight text-text">{value}</span>
                </GlassCard>
              ))}
            </section>
          )}

          {/* 데일리 스탯 보정 */}
          {data.boost.length > 0 && (
            <section className="mt-4 flex flex-wrap items-center justify-center gap-2" aria-label={t("boostTitle")}>
              {data.boost.map((b) => (
                <span key={b.stat} className="glass rounded-full border border-primary/40 px-3 py-1 text-xs text-text">
                  {ts(b.stat)} <span className="text-gold">+{b.delta}</span>
                </span>
              ))}
            </section>
          )}

          </div>

          <div className="contents lg:flex lg:flex-col">
          <div className="lg:hidden">
            <OrnamentDivider />
          </div>

          {/* 카테고리 탭 */}
          <nav aria-label={t("categoriesLabel")} className={`${SEGMENTED_WRAP} mb-4 grid-cols-5`}>
            {order.map((key) => (
              <button key={key} type="button" aria-pressed={tab === key} onClick={() => setTab(key)} className={`${segmentedItem(tab === key)} !text-xs`}>
                {t(TAB_LABEL[key])}
              </button>
            ))}
          </nav>

          {/* 오늘의 메시지 */}
          <ImageCard src="/assets/bg/today-crane.webp" scrim="left" className="glass">
            <div className="flex flex-col gap-4 p-5">
              <span className="text-[10px] tracking-[0.35em] text-on-image-muted uppercase">{t("messageLabel")}</span>
              {current ? (
                <>
                  <p className="max-w-[80%] font-display text-xl leading-snug lg:max-w-[62%]">{current.summary}</p>
                  <p className="text-sm leading-relaxed text-on-image-muted lg:max-w-[62%]">{current.detail}</p>
                </>
              ) : (
                <p className="max-w-[80%] font-display text-xl leading-snug">{t("noMbti")}</p>
              )}
              <span className="h-px bg-on-image/15" />
              <div className="flex flex-col gap-3 [&_.text-text]:text-on-image">
                <ScoreBar label={t("love")} color="love" icon={<Heart />} value={current?.scores.love} />
                <ScoreBar label={t("money")} color="money" icon={<Coins />} value={current?.scores.money} />
                <ScoreBar label={t("work")} color="work" icon={<BriefcaseBusiness />} value={current?.scores.work} />
              </div>
            </div>
          </ImageCard>

          {/* 이번 달 토정비결 — 계산 기준 문헌 [확인 필요] */}
          <ImageCard src="/assets/bg/today-plum.webp" scrim="left" className="mt-4">
            <div className="flex items-center gap-4 p-5">
              <CalendarDays className="size-6 shrink-0 text-gold" strokeWidth={1.3} aria-hidden />
              <span className="flex flex-1 flex-col">
                <span className="font-display text-lg">{t("tojeongTitle")}</span>
                <span className="text-xs text-on-image-muted">{t("tojeongSoon")}</span>
              </span>
            </div>
          </ImageCard>

          {/* 오늘의 한 줄 — 지난 날짜면 그날의 일기 */}
          <div className="mt-4">
            <DiaryComposer date={date} isToday={isToday} defaultPublic={me.settings.diaryDefaultPublic} />
          </div>

          <button type="button" onClick={share} className="mt-4 flex items-center justify-center gap-2 self-center text-sm text-muted hover:text-text">
            <Share2 className="size-4" aria-hidden />
            {t("share")}
          </button>
          </div>
        </div>
      )}
    </div>
  );
}
