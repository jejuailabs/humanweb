"use client";

import { useApi } from "./api";
import type { Me } from "./types";

export function useMe() {
  return useApi<Me>("/api/me");
}

// 프로필 완성도: 분석 7종 중 완료한 수 (02_SCREENS.md "4/7")
export const ALL_ANALYSES = ["mbti", "saju", "palm", "zodiac", "blood", "name", "face"] as const;
export function completedCount(me: Me | undefined) {
  if (!me) return 0;
  return ALL_ANALYSES.filter((k) => k in me.analyses).length;
}
