import { LoginView } from "@/components/auth/LoginView";
import { HeroArt } from "@/components/ui/ImageCard";

export default function Page() {
  return (
    <>
      <HeroArt src="/assets/bg/home-hero.webp" height={560} />
      <LoginView />
    </>
  );
}
