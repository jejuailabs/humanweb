// 사주·만세력 계산 — 절대 규칙 1: AI가 아니라 코드로 계산한다.
// 만세력: lunar-javascript (절기 기준 월주, 입춘 기준 연주)
// 자시: 23시부터 다음 날 일주로 본다 (setSect(1)). 학파마다 다름 — 사주 상세 화면에 명시 [자체 설계]
// 진태양시 보정은 하지 않는다 (07_I18N_THEME.md [미정] — 사주 상세 화면에 명시)
import { Lunar, Solar } from "lunar-javascript";
export { koreanGanzhi } from "./ko";

export const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
export const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;
export type Stem = (typeof STEMS)[number];
export type Branch = (typeof BRANCHES)[number];

export const ELEMENTS = ["wood", "fire", "earth", "metal", "water"] as const;
export type Element = (typeof ELEMENTS)[number];

export const TEN_GOD_GROUPS = ["peer", "output", "wealth", "officer", "resource"] as const;
export type TenGodGroup = (typeof TEN_GOD_GROUPS)[number]; // 비겁·식상·재성·관성·인성

export const ANIMALS = [
  "rat", "ox", "tiger", "rabbit", "dragon", "snake", "horse", "goat", "monkey", "rooster", "dog", "pig",
] as const;
export type Animal = (typeof ANIMALS)[number];

const STEM_ELEMENT: Record<Stem, Element> = {
  甲: "wood", 乙: "wood", 丙: "fire", 丁: "fire", 戊: "earth", 己: "earth", 庚: "metal", 辛: "metal", 壬: "water", 癸: "water",
};
// 지지는 본기(주된 기운)의 오행
const BRANCH_ELEMENT: Record<Branch, Element> = {
  子: "water", 丑: "earth", 寅: "wood", 卯: "wood", 辰: "earth", 巳: "fire",
  午: "fire", 未: "earth", 申: "metal", 酉: "metal", 戌: "earth", 亥: "water",
};
// 상생: 목→화→토→금→수→목, 상극: 목→토→수→화→금→목
const GENERATES: Record<Element, Element> = { wood: "fire", fire: "earth", earth: "metal", metal: "water", water: "wood" };
const CONTROLS: Record<Element, Element> = { wood: "earth", earth: "water", water: "fire", fire: "metal", metal: "wood" };

export function elementOfStem(s: Stem) {
  return STEM_ELEMENT[s];
}
export function elementOfBranch(b: Branch) {
  return BRANCH_ELEMENT[b];
}

// 일간(나)과 다른 글자의 오행 관계 → 십신 그룹 (음양 구분 없이 그룹 단위)
export function tenGodGroup(dayStem: Stem, other: Element): TenGodGroup {
  const me = STEM_ELEMENT[dayStem];
  if (other === me) return "peer";
  if (GENERATES[me] === other) return "output";
  if (CONTROLS[me] === other) return "wealth";
  if (CONTROLS[other] === me) return "officer";
  return "resource"; // GENERATES[other] === me
}

export type BirthInput = {
  birthDate: string; // YYYY-MM-DD (calendar 기준)
  calendar: "solar" | "lunar";
  isLeapMonth?: boolean;
  birthTime?: string | null; // HH:mm, 모름이면 null
};

export type SajuResult = {
  solarDate: string;
  lunarDate: { year: number; month: number; day: number; isLeap: boolean };
  pillars: { year: string; month: string; day: string; time: string | null };
  dayStem: Stem;
  elements: Record<Element, number>; // 비율, 합 1
  tenGods: Record<TenGodGroup, number>; // 개수 (일간 제외)
  animal: Animal;
};

function parseDate(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return { y, m, d };
}

export function toSolar(input: BirthInput): Solar {
  const { y, m, d } = parseDate(input.birthDate);
  if (input.calendar === "lunar") return Lunar.fromYmd(y, input.isLeapMonth ? -m : m, d).getSolar();
  return Solar.fromYmd(y, m, d);
}

export function computeSaju(input: BirthInput): SajuResult {
  const solar = toSolar(input);
  const timeKnown = !!input.birthTime;
  const [hh, mm] = timeKnown ? input.birthTime!.split(":").map(Number) : [12, 0];
  const lunar = Solar.fromYmdHms(solar.getYear(), solar.getMonth(), solar.getDay(), hh, mm, 0).getLunar();
  const ec = lunar.getEightChar();
  ec.setSect(1);
  const pillars = {
    year: ec.getYear(),
    month: ec.getMonth(),
    day: ec.getDay(),
    time: timeKnown ? ec.getTime() : null,
  };
  const dayStem = ec.getDayGan() as Stem;

  const chars: Element[] = [];
  const others: Element[] = [];
  for (const [key, p] of Object.entries(pillars)) {
    if (!p) continue;
    const [s, b] = [...p] as [Stem, Branch];
    chars.push(STEM_ELEMENT[s], BRANCH_ELEMENT[b]);
    if (key !== "day") others.push(STEM_ELEMENT[s]);
    others.push(BRANCH_ELEMENT[b]);
  }
  const elements = Object.fromEntries(ELEMENTS.map((e) => [e, 0])) as Record<Element, number>;
  for (const e of chars) elements[e] += 1 / chars.length;
  const tenGods = Object.fromEntries(TEN_GOD_GROUPS.map((g) => [g, 0])) as Record<TenGodGroup, number>;
  for (const e of others) tenGods[tenGodGroup(dayStem, e)] += 1;

  return {
    solarDate: solar.toYmd(),
    lunarDate: {
      year: lunar.getYear(),
      month: Math.abs(lunar.getMonth()),
      day: lunar.getDay(),
      isLeap: lunar.getMonth() < 0,
    },
    pillars,
    dayStem,
    elements,
    tenGods,
    animal: animalOfBranch(lunar.getYearZhi() as Branch),
  };
}

// 띠: 음력 연도(설날 기준) 지지 — 한국에서 흔히 쓰는 기준 [자체 설계]
export function animalOfBranch(b: Branch): Animal {
  return ANIMALS[BRANCHES.indexOf(b)];
}

export type DayPillar = {
  date: string;
  ganzhi: string;
  stem: Stem;
  branch: Branch;
  lunar: { month: number; day: number; isLeap: boolean };
  yearGanzhi: string;
};

export function dayPillar(dateKey: string): DayPillar {
  const { y, m, d } = parseDate(dateKey);
  const lunar = Solar.fromYmd(y, m, d).getLunar();
  const ganzhi = lunar.getDayInGanZhi();
  const [stem, branch] = [...ganzhi] as [Stem, Branch];
  return {
    date: dateKey,
    ganzhi,
    stem,
    branch,
    lunar: { month: Math.abs(lunar.getMonth()), day: lunar.getDay(), isLeap: lunar.getMonth() < 0 },
    yearGanzhi: lunar.getYearInGanZhi(),
  };
}

// 지지 관계: 육합 / 육충
const SIX_HARMONY: [Branch, Branch][] = [["子", "丑"], ["寅", "亥"], ["卯", "戌"], ["辰", "酉"], ["巳", "申"], ["午", "未"]];
export function branchRelation(a: Branch, b: Branch): "harmony" | "clash" | "none" {
  if (SIX_HARMONY.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) return "harmony";
  if (Math.abs(BRANCHES.indexOf(a) - BRANCHES.indexOf(b)) === 6) return "clash";
  return "none";
}
export function branchOfAnimal(a: Animal): Branch {
  return BRANCHES[ANIMALS.indexOf(a)];
}
