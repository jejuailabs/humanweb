import type { ComponentPropsWithoutRef } from "react";

// gold = 주요 행동, violet = 보조 강조, fate = 특별한 인연 전용(연결 요청 등), ghost = 테두리만
export type ButtonVariant = "gold" | "violet" | "fate" | "ghost";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 h-12 text-sm font-medium transition-[filter,background-color] disabled:opacity-40 disabled:pointer-events-none";

export const BUTTON_CLASS: Record<ButtonVariant, string> = {
  gold: `${BASE} border border-gold text-gold bg-surface hover:bg-surface-strong shadow-[0_0_20px_-6px_var(--glow-gold)]`,
  violet: `${BASE} text-on-accent bg-gradient-to-r from-primary-deep to-primary hover:brightness-110 shadow-[0_0_20px_-6px_var(--glow-violet)]`,
  fate: `${BASE} text-on-accent bg-fate-red hover:brightness-110 shadow-[0_0_24px_-4px_var(--fate-red)]`,
  ghost: `${BASE} border border-border-strong text-text bg-surface hover:bg-surface-strong`,
};

export function Button({
  variant = "gold",
  className = "",
  type = "button",
  ...rest
}: ComponentPropsWithoutRef<"button"> & { variant?: ButtonVariant }) {
  return <button type={type} className={`${BUTTON_CLASS[variant]} ${className}`} {...rest} />;
}
