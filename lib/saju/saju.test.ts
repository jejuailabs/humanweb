import { describe, expect, it } from "vitest";
import { branchRelation, computeSaju, dayPillar, tenGodGroup } from ".";
import { zodiacOf } from "./zodiac";
import { mbtiAxesFromType, mbtiTypeFromAxes, statsFromMbti, statsFromSaju, combineStats, statsFromBlood } from "../stats";
import { scoresFor } from "../fortune/scores";

// 정답표: 널리 알려진 만세력 값
describe("만세력", () => {
  it("2000-01-01 일주는 戊午", () => {
    expect(dayPillar("2000-01-01").ganzhi).toBe("戊午");
  });
  it("2026-10-16 일주는 癸亥, 음력 9월 7일", () => {
    const p = dayPillar("2026-10-16");
    expect(p.ganzhi).toBe("癸亥");
    expect(p.lunar).toEqual({ month: 9, day: 7, isLeap: false });
  });
  it("입춘 전후로 연주가 바뀐다 (2024-02-03 癸卯년 / 2024-02-05 甲辰년)", () => {
    expect(computeSaju({ birthDate: "2024-02-03", calendar: "solar", birthTime: "12:00" }).pillars.year).toBe("癸卯");
    expect(computeSaju({ birthDate: "2024-02-05", calendar: "solar", birthTime: "12:00" }).pillars.year).toBe("甲辰");
  });
  it("절기 기준 월주: 2024-03-04는 丙寅월, 2024-03-06(경칩 후)은 丁卯월", () => {
    expect(computeSaju({ birthDate: "2024-03-04", calendar: "solar", birthTime: "12:00" }).pillars.month).toBe("丙寅");
    expect(computeSaju({ birthDate: "2024-03-06", calendar: "solar", birthTime: "12:00" }).pillars.month).toBe("丁卯");
  });
  it("윤달: 음력 2023년 윤2월 15일 = 양력 2023-04-05", () => {
    const s = computeSaju({ birthDate: "2023-02-15", calendar: "lunar", isLeapMonth: true });
    expect(s.solarDate).toBe("2023-04-05");
    expect(s.lunarDate.isLeap).toBe(true);
  });
  it("자시: 23시 이후는 다음 날 일주 (자시 일주 변경)", () => {
    const before = computeSaju({ birthDate: "2000-01-01", calendar: "solar", birthTime: "22:30" });
    const after = computeSaju({ birthDate: "2000-01-01", calendar: "solar", birthTime: "23:30" });
    expect(before.pillars.day).toBe("戊午");
    expect(after.pillars.day).toBe("己未");
  });
  it("태어난 시간 모름: 시주 없이 6글자", () => {
    const s = computeSaju({ birthDate: "1990-03-15", calendar: "solar", birthTime: null });
    expect(s.pillars.time).toBeNull();
    const sum = Object.values(s.elements).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1);
    expect(Object.values(s.tenGods).reduce((a, b) => a + b, 0)).toBe(5);
  });
  it("띠는 설날 기준: 2024-02-09 토끼, 2024-02-10 용", () => {
    expect(computeSaju({ birthDate: "2024-02-09", calendar: "solar" }).animal).toBe("rabbit");
    expect(computeSaju({ birthDate: "2024-02-10", calendar: "solar" }).animal).toBe("dragon");
  });
});

describe("십신·지지 관계", () => {
  it("갑목 일간 기준", () => {
    expect(tenGodGroup("甲", "wood")).toBe("peer");
    expect(tenGodGroup("甲", "fire")).toBe("output");
    expect(tenGodGroup("甲", "earth")).toBe("wealth");
    expect(tenGodGroup("甲", "metal")).toBe("officer");
    expect(tenGodGroup("甲", "water")).toBe("resource");
  });
  it("육합·육충", () => {
    expect(branchRelation("子", "丑")).toBe("harmony");
    expect(branchRelation("子", "午")).toBe("clash");
    expect(branchRelation("子", "寅")).toBe("none");
  });
});

describe("별자리 경계", () => {
  it.each([
    ["1990-03-15", "pisces"], ["1990-03-21", "aries"], ["1990-12-22", "capricorn"],
    ["1990-01-19", "capricorn"], ["1990-01-20", "aquarius"],
  ])("%s → %s", (d, s) => expect(zodiacOf(d)).toBe(s));
});

describe("스탯 (05 문서 식)", () => {
  it("INFJ 유형만 입력: E30 N70 T30 J70", () => {
    const axes = mbtiAxesFromType("INFJ");
    expect(axes).toEqual({ E: 30, N: 70, T: 30, J: 70 });
    const s = statsFromMbti(axes);
    expect(s.leadership).toBeCloseTo(42); // 0.4*30+0.3*30+0.3*70
    expect(s.intuition).toBeCloseTo(70); // 0.7*70+0.3*70
    expect(s.empathy).toBeCloseTo(58); // 0.7*70+0.3*30
    expect(mbtiTypeFromAxes(axes)).toBe("INFJ");
  });
  it("사주: 오행이 고르면 50 근처, 십신 보정 적용", () => {
    const even = { wood: 0.2, fire: 0.2, earth: 0.2, metal: 0.2, water: 0.2 };
    const s = statsFromSaju({ elements: even, tenGods: { peer: 1, output: 1, wealth: 1, officer: 1, resource: 1 } });
    expect(s.creativity).toBe(50);
    const s2 = statsFromSaju({ elements: even, tenGods: { peer: 2, output: 0, wealth: 1, officer: 1, resource: 1 } });
    expect(s2.drive).toBe(58);
    expect(s2.creativity).toBe(45);
  });
  it("가중 평균·클램프·신뢰도", () => {
    const r = combineStats({ mbti: statsFromMbti(mbtiAxesFromType("INFJ")), blood: statsFromBlood("A") });
    expect(r.completeness).toBe(35);
    expect(r.stats.leadership).toBe(Math.round((30 * 42 + 5 * 50) / 35));
    expect(r.vector).toHaveLength(10);
  });
});

describe("운세 점수", () => {
  it("같은 날 같은 대상은 항상 같다", () => {
    const p = dayPillar("2026-10-16");
    expect(scoresFor("2026-10-16", "zodiac", "pisces", p)).toEqual(scoresFor("2026-10-16", "zodiac", "pisces", p));
    expect(scoresFor("2026-10-16", "zodiac", "pisces", p)).not.toEqual(scoresFor("2026-10-17", "zodiac", "pisces", dayPillar("2026-10-17")));
  });
  it("점수는 40~98", () => {
    const p = dayPillar("2026-10-16");
    for (const k of ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"]) {
      for (const v of Object.values(scoresFor("2026-10-16", "daymaster", k, p))) {
        expect(v).toBeGreaterThanOrEqual(40);
        expect(v).toBeLessThanOrEqual(98);
      }
    }
  });
});
