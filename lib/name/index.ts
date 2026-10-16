// 이름 풀이 — 계산은 코드로 (절대 규칙 1). 한글 이름의 발음오행과 획수 4격만 계산한다.
// 한자 획수는 사전 데이터가 필요해 이번 범위에서 제외 [자체 설계]
// 절대 규칙 9: 이름 원문은 저장하지 않고 AI에도 보내지 않는다. 계산 결과(숫자·오행)만 쓴다.
import { ELEMENTS, type Element } from "@/lib/saju";

const CHO = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const JUNG = ["ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ", "ㅙ", "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ"];
const JONG = ["", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];

// 한글 성명학에서 흔히 쓰는 자모 획수 [자체 설계: 학파마다 조금씩 다름]
const STROKES: Record<string, number> = {
  ㄱ: 1, ㄲ: 2, ㄴ: 1, ㄷ: 2, ㄸ: 4, ㄹ: 3, ㅁ: 3, ㅂ: 4, ㅃ: 8, ㅅ: 2, ㅆ: 4, ㅇ: 1, ㅈ: 3, ㅉ: 6, ㅊ: 4, ㅋ: 2, ㅌ: 3, ㅍ: 4, ㅎ: 3,
  ㄳ: 3, ㄵ: 4, ㄶ: 4, ㄺ: 4, ㄻ: 4, ㄼ: 5, ㄽ: 3, ㄾ: 5, ㄿ: 5, ㅀ: 4, ㅄ: 6,
  ㅏ: 2, ㅐ: 3, ㅑ: 3, ㅒ: 4, ㅓ: 2, ㅔ: 3, ㅕ: 3, ㅖ: 4, ㅗ: 2, ㅘ: 4, ㅙ: 5, ㅚ: 3, ㅛ: 3, ㅜ: 2, ㅝ: 4, ㅞ: 5, ㅟ: 3, ㅠ: 3, ㅡ: 1, ㅢ: 2, ㅣ: 1,
};

// 발음오행 (훈민정음 해례 기준): 아음 목, 설음 화, 후음 토, 치음 금, 순음 수
const SOUND_ELEMENT: Record<string, Element> = {
  ㄱ: "wood", ㄲ: "wood", ㅋ: "wood",
  ㄴ: "fire", ㄷ: "fire", ㄸ: "fire", ㄹ: "fire", ㅌ: "fire",
  ㅇ: "earth", ㅎ: "earth",
  ㅅ: "metal", ㅆ: "metal", ㅈ: "metal", ㅉ: "metal", ㅊ: "metal",
  ㅁ: "water", ㅂ: "water", ㅃ: "water", ㅍ: "water",
};

export const HANGUL_NAME = /^[가-힣]{1,4}$/;

function decompose(ch: string) {
  const code = ch.charCodeAt(0) - 0xac00;
  return { cho: CHO[Math.floor(code / 588)], jung: JUNG[Math.floor((code % 588) / 28)], jong: JONG[code % 28] };
}

export function strokesOf(ch: string) {
  const { cho, jung, jong } = decompose(ch);
  return STROKES[cho] + STROKES[jung] + (jong ? STROKES[jong] : 0);
}

export type NameResult = {
  chars: number; // 글자 수 (성 + 이름)
  strokes: number[]; // 글자별 획수
  soundElements: Element[]; // 글자별 초성 오행
  elements: Record<Element, number>; // 오행 비율, 합 1
  flow: ("generate" | "control" | "same")[]; // 앞 글자 → 뒤 글자 관계
  grids: { won: number; hyeong: number; i: number; jeong: number }; // 원·형·이·정 4격
};

const GENERATES: Record<Element, Element> = { wood: "fire", fire: "earth", earth: "metal", metal: "water", water: "wood" };

export function analyzeName(surname: string, given: string): NameResult {
  const s = [...surname].map(strokesOf);
  const g = [...given].map(strokesOf);
  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
  const S = sum(s);
  // 4격: 원격 = 이름 합, 형격 = 성 + 이름 첫 자, 이격 = 성 + 이름 끝 자(외자면 성), 정격 = 전체
  const grids = {
    won: sum(g),
    hyeong: S + g[0],
    i: g.length > 1 ? S + g[g.length - 1] : S,
    jeong: S + sum(g),
  };
  const soundElements = [...surname, ...given].map((c) => SOUND_ELEMENT[decompose(c).cho]);
  const elements = Object.fromEntries(ELEMENTS.map((e) => [e, 0])) as Record<Element, number>;
  for (const e of soundElements) elements[e] += 1 / soundElements.length;
  const flow = soundElements.slice(1).map((e, i) => {
    const prev = soundElements[i];
    if (prev === e) return "same" as const;
    return GENERATES[prev] === e || GENERATES[e] === prev ? ("generate" as const) : ("control" as const);
  });
  return { chars: s.length + g.length, strokes: [...s, ...g], soundElements, elements, flow, grids };
}
