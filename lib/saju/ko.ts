// 천간·지지 한글 읽기 (클라이언트에서도 쓰는 가벼운 모듈 — 만세력 라이브러리를 끌어오지 않는다)
const KO_STEM: Record<string, string> = {
  甲: "갑", 乙: "을", 丙: "병", 丁: "정", 戊: "무", 己: "기", 庚: "경", 辛: "신", 壬: "임", 癸: "계",
};
const KO_BRANCH: Record<string, string> = {
  子: "자", 丑: "축", 寅: "인", 卯: "묘", 辰: "진", 巳: "사", 午: "오", 未: "미", 申: "신", 酉: "유", 戌: "술", 亥: "해",
};

export function koreanGanzhi(ganzhi: string) {
  const [s, b] = [...ganzhi];
  return `${KO_STEM[s] ?? s}${KO_BRANCH[b] ?? b}`;
}
