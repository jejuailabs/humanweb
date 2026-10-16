// 스탯 계산 — 05_STATS_AND_AI.md 식 그대로 [자체 설계]. 순수 함수.
import type { Element, SajuResult, TenGodGroup } from "@/lib/saju";
import { ZODIAC_ELEMENT, type BloodType, type ZodiacSign } from "@/lib/saju/zodiac";

export const STAT_KEYS = [
  "leadership", "drive", "analysis", "intuition", "creativity",
  "empathy", "sociability", "stability", "adventure", "charisma",
] as const;
export type StatKey = (typeof STAT_KEYS)[number];
export type Stats = Record<StatKey, number>;

export const ANALYSIS_WEIGHTS = { mbti: 30, saju: 30, palm: 15, zodiac: 10, blood: 5, name: 5, face: 5 } as const;
export type AnalysisType = keyof typeof ANALYSIS_WEIGHTS;

const clamp = (v: number, lo = 10, hi = 95) => Math.max(lo, Math.min(hi, v));
const fill = (v: number) => Object.fromEntries(STAT_KEYS.map((k) => [k, v])) as Stats;

// 2-1. MBTI: 축 점수 E, N, T, J (0~100)
export type MbtiAxes = { E: number; N: number; T: number; J: number };
export function mbtiAxesFromType(type: string): MbtiAxes {
  const [a, b, c, d] = type.toUpperCase().split("");
  return { E: a === "E" ? 70 : 30, N: b === "N" ? 70 : 30, T: c === "T" ? 70 : 30, J: d === "J" ? 70 : 30 };
}
export function mbtiTypeFromAxes({ E, N, T, J }: MbtiAxes) {
  return `${E >= 50 ? "E" : "I"}${N >= 50 ? "N" : "S"}${T >= 50 ? "T" : "F"}${J >= 50 ? "J" : "P"}`;
}
export function statsFromMbti({ E, N, T, J }: MbtiAxes): Stats {
  return {
    leadership: 0.4 * E + 0.3 * T + 0.3 * J,
    drive: 0.5 * J + 0.3 * E + 0.2 * T,
    analysis: 0.6 * T + 0.4 * N,
    intuition: 0.7 * N + 0.3 * (100 - T),
    creativity: 0.6 * N + 0.4 * (100 - J),
    empathy: 0.7 * (100 - T) + 0.3 * E,
    sociability: 0.8 * E + 0.2 * (100 - T),
    stability: 0.6 * J + 0.4 * (100 - N),
    adventure: 0.5 * (100 - J) + 0.3 * N + 0.2 * E,
    charisma: 0.6 * E + 0.4 * T,
  };
}

// 2-2. 사주: 오행 비율 + 십신 보정
const SAJU_LINKS: Record<StatKey, Element[]> = {
  creativity: ["wood"], adventure: ["wood"],
  sociability: ["fire"], charisma: ["fire"],
  stability: ["earth"],
  analysis: ["metal"], leadership: ["metal"],
  intuition: ["water"], empathy: ["water"],
  drive: ["wood", "fire"],
};
const TEN_GOD_BOOST: Record<TenGodGroup, StatKey[]> = {
  peer: ["drive"],
  output: ["creativity", "sociability"],
  wealth: ["drive", "stability"],
  officer: ["leadership", "stability"],
  resource: ["analysis", "intuition", "empathy"],
};
export function statsFromSaju(saju: Pick<SajuResult, "elements" | "tenGods">): Stats {
  const out = fill(50);
  for (const k of STAT_KEYS) {
    const links = SAJU_LINKS[k];
    const avg = links.reduce((s, e) => s + saju.elements[e], 0) / links.length;
    out[k] = clamp(50 + 150 * (avg - 0.2));
  }
  for (const [g, keys] of Object.entries(TEN_GOD_BOOST) as [TenGodGroup, StatKey[]][]) {
    const n = saju.tenGods[g];
    const delta = n >= 2 ? 8 : n === 0 ? -5 : 0;
    for (const k of keys) out[k] = clamp(out[k] + delta);
  }
  return out;
}

// 2-3. 손금: AI가 돌려준 특징(0~100) → 스탯. 특징이 없는 스탯은 50
export type PalmFeatures = {
  headLine: number; headCurve: number; heartLine: number; fateLine: number;
  lifeLine: number; sunLine: number; fingerRatio: number;
};
export function statsFromPalm(f: PalmFeatures): Stats {
  return {
    analysis: f.headLine,
    creativity: f.headCurve,
    intuition: f.headCurve,
    empathy: f.heartLine,
    drive: f.fateLine,
    stability: (f.fateLine + f.lifeLine) / 2,
    charisma: f.sunLine,
    leadership: f.fingerRatio,
    adventure: f.fingerRatio,
    sociability: 50,
  };
}

// 2-4. 별자리 4원소
export function statsFromZodiac(sign: ZodiacSign): Stats {
  const out = fill(50);
  const table = {
    fire: { 20: ["adventure", "charisma"], 10: ["drive", "leadership"] },
    earth: { 20: ["stability", "drive"], 10: ["analysis"] },
    air: { 20: ["sociability", "analysis"], 10: ["creativity"] },
    water: { 20: ["empathy", "intuition"], 10: ["creativity"] },
  } as const;
  const row = table[ZODIAC_ELEMENT[sign]];
  for (const k of row[20]) out[k as StatKey] = 70;
  for (const k of row[10]) out[k as StatKey] = 60;
  return out;
}

// 2-5. 혈액형 (가중치 최소)
export function statsFromBlood(t: BloodType): Stats {
  const out = fill(50);
  const up: Record<BloodType, StatKey[]> = {
    A: ["stability", "empathy"],
    B: ["creativity", "adventure"],
    O: ["leadership", "sociability"],
    AB: ["analysis", "intuition"],
  };
  for (const k of up[t]) out[k] = 60;
  return out;
}

// 2. 가중 평균 + 신뢰도
export function combineStats(parts: Partial<Record<AnalysisType, Stats>>) {
  const entries = Object.entries(parts) as [AnalysisType, Stats][];
  const totalW = entries.reduce((s, [t]) => s + ANALYSIS_WEIGHTS[t], 0);
  const stats = fill(50);
  if (totalW > 0) {
    for (const k of STAT_KEYS) {
      const v = entries.reduce((s, [t, st]) => s + ANALYSIS_WEIGHTS[t] * st[k], 0) / totalW;
      stats[k] = Math.round(clamp(v));
    }
  }
  const contributions = Object.fromEntries(entries.map(([t]) => [t, ANALYSIS_WEIGHTS[t]]));
  return {
    stats,
    completeness: Math.min(100, totalW),
    contributions,
    vector: STAT_KEYS.map((k) => stats[k] / 100),
  };
}

export function cosineSimilarity(a: number[], b: number[]) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}
