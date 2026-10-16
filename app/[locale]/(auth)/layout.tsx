import { TopBar } from "@/components/layout/TopBar";

export default function AuthLayout({ children }: LayoutProps<"/[locale]">) {
  return (
    <>
      <TopBar />
      <main className="relative isolate mx-auto max-w-md px-4 pt-2 pb-12">{children}</main>
    </>
  );
}
