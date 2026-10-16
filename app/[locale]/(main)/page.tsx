import { HomeView } from "@/components/home/HomeView";
import { HeroArt } from "@/components/ui/ImageCard";

// 홈 — 종합 대시보드 (02_SCREENS.md 2)
export default function Page() {
  return (
    <>
      <HeroArt src="/assets/bg/home-hero.webp" height={520} />
      <HomeView />
    </>
  );
}
