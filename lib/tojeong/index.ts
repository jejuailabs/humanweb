// 토정비결 작괘 — 절대 규칙 1: 괘는 코드로 계산하고 AI는 해석 문장만 쓴다.
// 널리 쓰이는 작괘법을 따른다 [자체 설계: 판본마다 세부가 달라 이 방식으로 고정]
//   상괘 = (세는나이 + 그해 태세수) % 8          (0이면 8)
//   중괘 = (그해 생월의 날수 + 생월 월건수) % 6   (큰달 30, 작은달 29 / 0이면 6)
//   하괘 = (생일 + 그해 생일의 일진수) % 3        (0이면 3)
// 태세수·월건수·일진수 = 해당 간지의 선천수(천간수 + 지지수)
import { Lunar, LunarMonth, Solar } from "lunar-javascript";
import { seeded } from "@/lib/fortune/scores";

// 선천수: 甲己子午 9, 乙庚丑未 8, 丙辛寅申 7, 丁壬卯酉 6, 戊癸辰戌 5, 巳亥 4
const PRE_HEAVEN: Record<string, number> = {
  甲: 9, 己: 9, 子: 9, 午: 9,
  乙: 8, 庚: 8, 丑: 8, 未: 8,
  丙: 7, 辛: 7, 寅: 7, 申: 7,
  丁: 6, 壬: 6, 卯: 6, 酉: 6,
  戊: 5, 癸: 5, 辰: 5, 戌: 5,
  巳: 4, 亥: 4,
};
export const ganzhiNumber = (gz: string) => [...gz].reduce((s, c) => s + (PRE_HEAVEN[c] ?? 0), 0);

const mod = (v: number, n: number) => v % n || n;

export type TojeongGua = {
  year: number; // 대상 음력 연도
  age: number; // 세는나이
  upper: number; // 1~8
  middle: number; // 1~6
  lower: number; // 1~3
  code: string; // 예: "524" (상·중·하)
  yearGanzhi: string;
};

// birthLunar: 음력 생년월일 (윤달이면 같은 번호의 평달로 본다)
export function computeTojeong(birthLunar: { year: number; month: number; day: number }, targetYear: number): TojeongGua {
  const age = targetYear - birthLunar.year + 1;
  const yearGanzhi = Lunar.fromYmd(targetYear, 1, 1).getYearInGanZhi();
  const upper = mod(age + ganzhiNumber(yearGanzhi), 8);

  const month = LunarMonth.fromYm(targetYear, birthLunar.month);
  const monthDays = month.getDayCount();
  const monthGanzhi = Lunar.fromYmd(targetYear, birthLunar.month, 1).getMonthInGanZhi();
  const middle = mod(monthDays + ganzhiNumber(monthGanzhi), 6);

  // 그해 생월이 작은달인데 30일생이면 그달 마지막 날로 본다
  const day = Math.min(birthLunar.day, monthDays);
  const dayGanzhi = Lunar.fromYmd(targetYear, birthLunar.month, day).getDayInGanZhi();
  const lower = mod(birthLunar.day + ganzhiNumber(dayGanzhi), 3);

  return { year: targetYear, age, upper, middle, lower, code: `${upper}${middle}${lower}`, yearGanzhi };
}

// 월별 흐름 점수 — 절대 규칙 3: 괘 + 연도 + 월 시드로 고정 [자체 설계]
export function monthlyScores(gua: TojeongGua): number[] {
  const base = 55 + gua.upper * 2 + gua.lower * 2;
  return Array.from({ length: 12 }, (_, i) => {
    const r = seeded(`tojeong|${gua.year}|${gua.code}|${i + 1}`);
    return Math.max(40, Math.min(95, Math.round(base + (r() - 0.5) * 36)));
  });
}

// 지금 날짜(KST)의 음력 연·월
export function currentLunar(now = new Date()) {
  const kst = new Date(now.getTime() + 9 * 3600000);
  const l = Solar.fromYmd(kst.getUTCFullYear(), kst.getUTCMonth() + 1, kst.getUTCDate()).getLunar();
  return { year: l.getYear(), month: Math.abs(l.getMonth()) };
}
