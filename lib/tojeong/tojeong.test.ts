import { describe, expect, it } from "vitest";
import { computeTojeong, ganzhiNumber, monthlyScores } from ".";

describe("토정비결 작괘", () => {
  it("선천수 합", () => {
    expect(ganzhiNumber("甲子")).toBe(18);
    expect(ganzhiNumber("丙午")).toBe(16);
    expect(ganzhiNumber("癸亥")).toBe(9);
  });
  it("괘 범위와 고정성", () => {
    const g = computeTojeong({ year: 1995, month: 6, day: 25 }, 2026);
    expect(g.age).toBe(32);
    expect(g.upper).toBe(mod(32 + 16, 8)); // 2026 丙午 = 16
    expect(g.upper).toBeGreaterThanOrEqual(1);
    expect(g.upper).toBeLessThanOrEqual(8);
    expect(g.middle).toBeGreaterThanOrEqual(1);
    expect(g.middle).toBeLessThanOrEqual(6);
    expect(g.lower).toBeGreaterThanOrEqual(1);
    expect(g.lower).toBeLessThanOrEqual(3);
    expect(computeTojeong({ year: 1995, month: 6, day: 25 }, 2026)).toEqual(g);
  });
  it("작은달 30일생도 계산된다", () => {
    expect(() => computeTojeong({ year: 1990, month: 2, day: 30 }, 2026)).not.toThrow();
  });
  it("월별 점수 12개, 40~95, 고정", () => {
    const g = computeTojeong({ year: 1988, month: 11, day: 3 }, 2026);
    const s = monthlyScores(g);
    expect(s).toHaveLength(12);
    expect(s.every((v) => v >= 40 && v <= 95)).toBe(true);
    expect(monthlyScores(g)).toEqual(s);
  });
});
const mod = (v: number, n: number) => v % n || n;
