import type { ComponentPropsWithoutRef, ElementType } from "react";

// 글래스 카드. gold = 완료·강조, violet = 진행 가능, locked = 잠김(흐림)
type Variant = "default" | "gold" | "violet" | "locked";

const VARIANT_CLASS: Record<Variant, string> = {
  default: "",
  gold: "glass-gold",
  violet: "glass-violet",
  locked: "opacity-60 saturate-50",
};

type Props<T extends ElementType> = {
  as?: T;
  variant?: Variant;
} & ComponentPropsWithoutRef<T>;

export function GlassCard<T extends ElementType = "section">({
  as,
  variant = "default",
  className = "",
  ...rest
}: Props<T>) {
  const Tag = as ?? "section";
  return (
    <Tag
      className={`glass rounded-3xl p-5 ${VARIANT_CLASS[variant]} ${className}`}
      {...rest}
    />
  );
}
