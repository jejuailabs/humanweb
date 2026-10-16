import {
  BookOpen,
  Brain,
  ChevronRight,
  Hand,
  Lock,
  CircleCheck,
  ScanFace,
  Sparkles,
  SunMoon,
  Type,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { GlassCard } from "@/components/ui/GlassCard";

export type AnalysisKey = "mbti" | "saju" | "palm" | "zodiacBlood" | "tojeong" | "face" | "name";
export type AnalysisStatus = "completed" | "available" | "locked";

const ICONS = {
  mbti: Brain,
  saju: SunMoon,
  palm: Hand,
  zodiacBlood: Sparkles,
  tojeong: BookOpen,
  face: ScanFace,
  name: Type,
} as const;

const VARIANT = { completed: "gold", available: "violet", locked: "locked" } as const;

// 분석 허브 카드 — 완료(골드) / 가능(보라) / 잠김(흐림+자물쇠). 02_SCREENS.md
export function AnalysisCard({ id, status }: { id: AnalysisKey; status: AnalysisStatus }) {
  const t = useTranslations("analyses");
  const Icon = ICONS[id];
  const StatusIcon = status === "completed" ? CircleCheck : status === "locked" ? Lock : null;

  return (
    <GlassCard variant={VARIANT[status]} className="flex items-center gap-4 !p-4">
      <span
        className={`flex size-14 shrink-0 items-center justify-center rounded-full border ${
          status === "completed"
            ? "border-gold text-gold"
            : status === "available"
              ? "border-primary text-primary"
              : "border-border-strong text-muted"
        }`}
      >
        <Icon className="size-6" strokeWidth={1.3} aria-hidden />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-display text-lg text-text">{t(`${id}.title`)}</span>
        <span className="truncate text-xs text-muted">{t(`${id}.desc`)}</span>
      </span>
      <span
        className={`flex shrink-0 items-center gap-1 text-xs ${
          status === "completed" ? "text-gold" : status === "available" ? "text-primary" : "text-muted"
        }`}
      >
        {StatusIcon && <StatusIcon className="size-4" aria-hidden />}
        {t(`status.${status}`)}
        <ChevronRight className="size-4" aria-hidden />
      </span>
    </GlassCard>
  );
}
