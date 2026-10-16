// 절대 규칙 6: 불안을 주는 표현 금지 — 프롬프트 규칙 + 출력 검사 양쪽에서 막는다 (이 파일이 출력 검사)
const FORBIDDEN: Record<string, (string | RegExp)[]> = {
  ko: ["죽음", "죽을", "죽는", "사망", "사고가", "사고를", "사고에", "질병", "병에 걸", "흉하", "흉한", "흉운", "불길", "재앙", "파멸", "저주", "액운", "수명"],
  en: [/\bdeath\b/i, /\bdie\b/i, /\bdying\b/i, /\baccident/i, /\bdisease/i, /\billness/i, /\bominous\b/i, /\bdoom/i, /\bcurse/i, /\bdisaster/i, /\bfatal\b/i, /\blifespan\b/i],
};

export function findForbidden(text: string, lang: string): string | null {
  for (const w of FORBIDDEN[lang] ?? FORBIDDEN.en) {
    if (typeof w === "string" ? text.includes(w) : w.test(text)) return String(w);
  }
  return null;
}
