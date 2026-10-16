// 별자리 (양력 생일 기준, 서양 점성술의 통용 경계일)
export const ZODIAC_SIGNS = [
  "capricorn", "aquarius", "pisces", "aries", "taurus", "gemini",
  "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius",
] as const;
export type ZodiacSign = (typeof ZODIAC_SIGNS)[number];

// 각 별자리가 시작하는 [월, 일]
const STARTS: [ZodiacSign, number, number][] = [
  ["aquarius", 1, 20], ["pisces", 2, 19], ["aries", 3, 21], ["taurus", 4, 20],
  ["gemini", 5, 21], ["cancer", 6, 22], ["leo", 7, 23], ["virgo", 8, 23],
  ["libra", 9, 23], ["scorpio", 10, 23], ["sagittarius", 11, 22], ["capricorn", 12, 22],
];

export function zodiacOf(solarDate: string): ZodiacSign {
  const [, m, d] = solarDate.split("-").map(Number);
  let sign: ZodiacSign = "capricorn";
  for (const [s, sm, sd] of STARTS) if (m > sm || (m === sm && d >= sd)) sign = s;
  return sign;
}

export type ZodiacElement = "fire" | "earth" | "air" | "water";
export const ZODIAC_ELEMENT: Record<ZodiacSign, ZodiacElement> = {
  aries: "fire", leo: "fire", sagittarius: "fire",
  taurus: "earth", virgo: "earth", capricorn: "earth",
  gemini: "air", libra: "air", aquarius: "air",
  cancer: "water", scorpio: "water", pisces: "water",
};

export const BLOOD_TYPES = ["A", "B", "O", "AB"] as const;
export type BloodType = (typeof BLOOD_TYPES)[number];

export const MBTI_TYPES = [
  "INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ", "ISTP", "ISFP", "ESTP", "ESFP",
] as const;
export type MbtiType = (typeof MBTI_TYPES)[number];
