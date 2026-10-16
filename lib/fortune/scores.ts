// 운세 점수 — 절대 규칙 3: AI가 아니라 코드로, 날짜 시드 고정 [자체 설계]
import { branchOfAnimal, branchRelation, elementOfStem, tenGodGroup, type Animal, type DayPillar, type Stem, type TenGodGroup } from "@/lib/saju";
import type { StatKey } from "@/lib/stats";

export const CATEGORIES = ["zodiac", "blood", "animal", "mbti", "daymaster"] as const;
export type Category = (typeof CATEGORIES)[number];

// FNV-1a + mulberry32: 같은 문자열 → 항상 같은 난수열
function hash(str: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
export function seeded(seed: string) {
  let a = hash(seed);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const int = (r: () => number, min: number, max: number) => Math.floor(r() * (max - min + 1)) + min;
const clamp = (v: number) => Math.max(40, Math.min(98, Math.round(v)));

export type Scores = { total: number; love: number; money: number; work: number };

// 일간 운세: 오늘 일진 천간이 내 일간에게 어떤 십신인지에 따라 보정
const DAYMASTER_MOD: Record<TenGodGroup, Partial<Scores>> = {
  peer: { work: 4, money: -3 },
  output: { love: 5, work: 3 },
  wealth: { money: 7 },
  officer: { work: 6, love: -2 },
  resource: { total: 4 },
};

export function scoresFor(date: string, category: Category, key: string, pillar: DayPillar): Scores {
  const r = seeded(`${date}|${category}|${key}`);
  const base: Scores = { total: int(r, 55, 92), love: int(r, 45, 95), money: int(r, 45, 95), work: int(r, 45, 95) };
  if (category === "animal") {
    const rel = branchRelation(pillar.branch, branchOfAnimal(key as Animal));
    const d = rel === "harmony" ? 6 : rel === "clash" ? -6 : 0;
    base.total += d;
  }
  if (category === "daymaster") {
    const mod = DAYMASTER_MOD[tenGodGroup(key as Stem, elementOfStem(pillar.stem))];
    for (const [k, v] of Object.entries(mod)) base[k as keyof Scores] += v;
  }
  return { total: clamp(base.total), love: clamp(base.love), money: clamp(base.money), work: clamp(base.work) };
}

// 행운 요소 — 코드로 고르고 이름은 다국어 파일에서 (messages.lucky.*)
export const LUCKY_COLORS = ["teal", "gold", "violet", "navy", "coral", "ivory", "green", "rose", "silver", "amber"] as const;
export const LUCKY_DIRECTIONS = ["east", "west", "south", "north", "northeast", "northwest", "southeast", "southwest"] as const;
export const LUCKY_ITEMS = [
  "watch", "notebook", "scarf", "ring", "tea", "book", "headphones", "umbrella",
  "candle", "plant", "pen", "mirror", "bracelet", "perfume", "coin", "postcard",
] as const;
export type Lucky = {
  color: (typeof LUCKY_COLORS)[number];
  number: number;
  direction: (typeof LUCKY_DIRECTIONS)[number];
  item: (typeof LUCKY_ITEMS)[number];
};
export function luckyFor(date: string, category: Category, key: string): Lucky {
  const r = seeded(`${date}|lucky|${category}|${key}`);
  return {
    color: LUCKY_COLORS[int(r, 0, LUCKY_COLORS.length - 1)],
    number: int(r, 1, 9),
    direction: LUCKY_DIRECTIONS[int(r, 0, LUCKY_DIRECTIONS.length - 1)],
    item: LUCKY_ITEMS[int(r, 0, LUCKY_ITEMS.length - 1)],
  };
}

// 데일리 스탯 보정 (표시 전용, stats/current는 바꾸지 않음) [자체 설계]
const BOOST_STATS: Record<TenGodGroup, StatKey[]> = {
  peer: ["drive", "leadership"],
  output: ["creativity", "sociability"],
  wealth: ["drive", "stability"],
  officer: ["leadership", "stability"],
  resource: ["intuition", "analysis", "empathy"],
};
export function dailyStatBoost(date: string, dayStem: Stem, pillar: DayPillar) {
  const g = tenGodGroup(dayStem, elementOfStem(pillar.stem));
  const r = seeded(`${date}|boost|${dayStem}`);
  return BOOST_STATS[g].slice(0, 2 + (r() < 0.5 ? 0 : 1)).map((stat) => ({ stat, delta: int(r, 3, 10) }));
}
