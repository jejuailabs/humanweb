import { ANIMALS, STEMS } from "@/lib/saju";
import { BLOOD_TYPES, MBTI_TYPES, ZODIAC_SIGNS } from "@/lib/saju/zodiac";
import type { Category } from "./scores";

// 카테고리별 대상 키
export const CATEGORY_KEYS: Record<Category, readonly string[]> = {
  zodiac: ZODIAC_SIGNS,
  blood: BLOOD_TYPES,
  animal: ANIMALS,
  mbti: MBTI_TYPES,
  daymaster: STEMS,
};

export const LANGS = ["ko", "en"] as const;
export type Lang = (typeof LANGS)[number];
