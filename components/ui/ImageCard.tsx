import Image from "next/image";
import type { ReactNode } from "react";

// 일러스트가 깔린 카드. 그림이 어두워서 위 글자는 두 테마 모두 on-image 색을 쓴다
export function ImageCard({
  src,
  alt = "",
  children,
  className = "",
  scrim = "bottom",
  sizes = "(max-width: 448px) 100vw, 448px",
}: {
  src: string;
  alt?: string;
  children: ReactNode;
  className?: string;
  scrim?: "bottom" | "left";
  sizes?: string;
}) {
  const scrimClass =
    scrim === "left"
      ? "bg-gradient-to-r from-[var(--image-scrim)] via-[var(--image-scrim)]/60 to-transparent"
      : "bg-gradient-to-t from-[var(--image-scrim)] via-[var(--image-scrim)]/40 to-transparent";
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-border-strong text-on-image ${className}`}
    >
      <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" />
      <div className={`absolute inset-0 ${scrimClass}`} aria-hidden />
      <div className="relative h-full">{children}</div>
    </div>
  );
}

// 화면 상단 배경 그림 (헤더 아래까지 깔린다)
export function HeroArt({ src, height }: { src: string; height: number }) {
  return (
    <div
      className="hero-art pointer-events-none absolute inset-x-0 -top-16 -z-10"
      style={{ height }}
      aria-hidden
    >
      <Image src={src} alt="" fill priority sizes="448px" className="object-cover object-top" />
    </div>
  );
}
