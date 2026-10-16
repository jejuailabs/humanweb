// 자체 성향 검사 20문항 (축당 5문항) [자체 설계]. 문항 문장은 messages의 mbtiTest.q{n}
// dir: 동의할수록 해당 축(E/N/T/J) 쪽이면 +1, 반대쪽이면 -1
export const MBTI_QUESTIONS = [
  { id: 1, axis: "E", dir: 1 }, { id: 2, axis: "E", dir: -1 }, { id: 3, axis: "E", dir: 1 }, { id: 4, axis: "E", dir: -1 }, { id: 5, axis: "E", dir: 1 },
  { id: 6, axis: "N", dir: 1 }, { id: 7, axis: "N", dir: -1 }, { id: 8, axis: "N", dir: 1 }, { id: 9, axis: "N", dir: -1 }, { id: 10, axis: "N", dir: 1 },
  { id: 11, axis: "T", dir: 1 }, { id: 12, axis: "T", dir: -1 }, { id: 13, axis: "T", dir: 1 }, { id: 14, axis: "T", dir: -1 }, { id: 15, axis: "T", dir: 1 },
  { id: 16, axis: "J", dir: 1 }, { id: 17, axis: "J", dir: -1 }, { id: 18, axis: "J", dir: 1 }, { id: 19, axis: "J", dir: -1 }, { id: 20, axis: "J", dir: 1 },
] as const;

// 답: 1(전혀 아니다)~5(매우 그렇다) → 축 점수 0~100
export function scoreAnswers(answers: Record<number, number>) {
  const axes = { E: 0, N: 0, T: 0, J: 0 };
  for (const q of MBTI_QUESTIONS) {
    const a = answers[q.id];
    if (a === undefined) throw new Error(`missing answer ${q.id}`);
    axes[q.axis] += (a - 3) * q.dir; // -2 ~ +2
  }
  // 축당 5문항 → 합계 -10 ~ +10 → 0 ~ 100
  return Object.fromEntries(Object.entries(axes).map(([k, v]) => [k, Math.round(((v + 10) / 20) * 100)])) as Record<"E" | "N" | "T" | "J", number>;
}
