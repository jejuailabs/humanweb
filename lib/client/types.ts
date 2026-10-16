// 서버 API 응답 타입 (클라이언트용)
export type Me = {
  onboarded: boolean;
  nickname: string | null;
  reportStale: boolean;
  profile: {
    birthDate: string;
    calendar: "solar" | "lunar";
    isLeapMonth: boolean;
    birthTime: string | null;
    birthTimeUnknown: boolean;
    gender: string | null;
    bloodType: "A" | "B" | "O" | "AB";
  } | null;
  settings: {
    lang: "ko" | "en";
    diaryDefaultPublic: boolean;
    diaryForAI: boolean;
    showOnMap: boolean;
    business: string;
    region: string;
    school: string;
    publicFields: { business: boolean; region: boolean; school: boolean };
  };
  analyses: {
    zodiac?: { sign: string };
    blood?: { type: string };
    saju?: {
      pillars: { year: string; month: string; day: string; time: string | null };
      dayStem: string;
      elements: Record<"wood" | "fire" | "earth" | "metal" | "water", number>;
      tenGods: Record<string, number>;
      animal: string;
      timeKnown: boolean;
    };
    mbti?: { type: string; axes: { E: number; N: number; T: number; J: number }; source: "test" | "input" };
    palm?: { features: Record<string, number>; summary: string };
    face?: { features: Record<string, number>; summary: string };
    name?: NameAnalysis;
  };
  stats: { stats: Record<string, number>; completeness: number; contributions: Record<string, number> } | null;
  streak: { count: number; lastDate: string | null };
  report: Report | null;
};

export type Report = {
  version: number;
  lang: string;
  title: string;
  identity: string;
  strengths: { stat: string; text: string }[];
  growth: string[];
  workStyle: string;
  relationStyle: string;
  goodMatch: string;
  crossInsights: string[];
  completeness: number;
};

export type DailyItem = {
  key: string;
  summary: string;
  detail: string;
  scores: { total: number; love: number; money: number; work: number };
  lucky: { color: string; number: number; direction: string; item: string };
};

export type DailyResponse = {
  date: string;
  pillar: { ganzhi: string; ko: string; lunar: { month: number; day: number; isLeap: boolean }; year: string };
  items: Partial<Record<"daymaster" | "zodiac" | "animal" | "blood" | "mbti", DailyItem>>;
  boost: { stat: string; delta: number }[];
};

export type DiaryEntry = {
  date: string;
  text: string;
  mood: string | null;
  visibility: "private" | "public";
  fortuneSnapshot: { total: number; summary: string } | null;
};

type ElementKey = "wood" | "fire" | "earth" | "metal" | "water";
export type NameAnalysis = {
  chars: number;
  strokes: number[];
  soundElements: ElementKey[];
  elements: Record<ElementKey, number>;
  flow: ("generate" | "control" | "same")[];
  grids: { won: number; hyeong: number; i: number; jeong: number };
  title: string;
  summary: string;
  points: string[];
};

export type Tojeong = {
  year: number;
  age: number;
  upper: number;
  middle: number;
  lower: number;
  code: string;
  yearGanzhi: string;
  scores: number[];
  title: string;
  overview: string;
  months: string[];
  lang: string;
};
export type TojeongResponse = { year: number; month: number; tojeong: Tojeong | null };
