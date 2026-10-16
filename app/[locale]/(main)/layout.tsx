import { BottomNav } from "@/components/layout/BottomNav";
import { TopBar } from "@/components/layout/TopBar";

export default function MainLayout({ children }: LayoutProps<"/[locale]">) {
  return (
    <>
      <TopBar />
      <main className="relative isolate mx-auto max-w-md px-4 pt-2 pb-[calc(6rem+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
