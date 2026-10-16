// 알약 모양 전환 탭 (목업 "My Fortune | Zodiac | …"). 링크·버튼 어디에나 쓴다
export const SEGMENTED_WRAP = "glass grid rounded-full p-1";

export function segmentedItem(active: boolean) {
  return `rounded-full py-2 text-center text-sm transition-colors ${
    active
      ? "bg-gradient-to-r from-primary-deep to-primary text-on-accent font-medium shadow-[0_0_16px_-4px_var(--glow-violet)]"
      : "text-muted hover:text-text"
  }`;
}
