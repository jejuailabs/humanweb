import { BottomNav } from "@/components/layout/BottomNav";
import { SideNav } from "@/components/layout/SideNav";
import { TopBar } from "@/components/layout/TopBar";

// 모바일: TopBar + 하단 탭 / PC(lg, 1024px 이상): 왼쪽 사이드 메뉴 + 넓은 본문
export default function MainLayout({ children }: LayoutProps<"/[locale]">) {
  return (
    <>
      <div className="lg:hidden">
        <TopBar />
      </div>
      <SideNav />
      <div className="lg:pl-64">
        <main className="relative isolate mx-auto max-w-md px-4 pt-2 pb-[calc(6rem+env(safe-area-inset-bottom))] lg:max-w-4xl lg:px-10 lg:pt-10 lg:pb-16">
          {children}
        </main>
      </div>
      <BottomNav />
    </>
  );
}
