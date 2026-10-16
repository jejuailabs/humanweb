import { describe, expect, it } from "vitest";
import { analyzeName, strokesOf } from ".";

describe("이름 풀이 계산", () => {
  it("자모 획수", () => {
    expect(strokesOf("가")).toBe(3); // ㄱ1 + ㅏ2
    expect(strokesOf("김")).toBe(5); // ㄱ1 + ㅣ1 + ㅁ3
    expect(strokesOf("한")).toBe(6); // ㅎ3 + ㅏ2 + ㄴ1
  });
  it("4격과 발음오행", () => {
    const r = analyzeName("김", "하늘");
    // 김5, 하5, 늘(ㄴ1+ㅡ1+ㄹ3)=5
    expect(r.strokes).toEqual([5, 5, 5]);
    expect(r.grids).toEqual({ won: 10, hyeong: 10, i: 10, jeong: 15 });
    expect(r.soundElements).toEqual(["wood", "earth", "fire"]);
    expect(r.flow).toEqual(["control", "generate"]);
    expect(Object.values(r.elements).reduce((a, b) => a + b, 0)).toBeCloseTo(1);
  });
  it("외자 이름", () => {
    const r = analyzeName("이", "솔");
    expect(r.grids.i).toBe(r.strokes[0]);
  });
});
