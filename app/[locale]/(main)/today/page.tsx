import { TodaySwitch } from "@/components/layout/TodaySwitch";
import { TodayView } from "@/components/today/TodayView";
import { HeroArt } from "@/components/ui/ImageCard";

// 오늘 — 데일리 대시보드 (02_SCREENS.md 3)
export default function Page() {
  return (
    <div className="flex flex-col">
      <HeroArt src="/assets/bg/today-hero.webp" height={640} />
      <TodaySwitch />
      <TodayView />
    </div>
  );
}
