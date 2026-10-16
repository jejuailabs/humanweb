import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { computeSaju, type SajuResult } from "@/lib/saju";
import { zodiacOf, type BloodType, type ZodiacSign } from "@/lib/saju/zodiac";
import {
  combineStats,
  statsFromBlood,
  statsFromMbti,
  statsFromPalm,
  statsFromSaju,
  statsFromZodiac,
  type AnalysisType,
  type MbtiAxes,
  type PalmFeatures,
  type Stats,
} from "@/lib/stats";
import { db } from "./firebase-admin";

export type Profile = {
  birthDate: string;
  calendar: "solar" | "lunar";
  isLeapMonth: boolean;
  birthTime: string | null;
  birthTimeUnknown: boolean;
  gender: "female" | "male" | "other" | null;
  bloodType: BloodType;
  birthTimezone: string;
  birthDateChangeCount: number;
};

export type Settings = {
  lang: "ko" | "en";
  diaryDefaultPublic: boolean;
  diaryForAI: boolean;
  showOnMap: boolean;
  business: string;
  region: string;
  school: string;
  publicFields: { business: boolean; region: boolean; school: boolean };
};

export const DEFAULT_SETTINGS: Settings = {
  lang: "ko",
  diaryDefaultPublic: false,
  diaryForAI: false,
  showOnMap: false,
  business: "",
  region: "",
  school: "",
  publicFields: { business: false, region: false, school: false },
};

export const userRef = (uid: string) => db().doc(`users/${uid}`);

// 가입 정보로 바로 열리는 분석: 별자리·혈액형·사주(생년월일만 있어도 일간 계산 가능)
export async function writeBaseAnalyses(uid: string, p: Profile) {
  const saju: SajuResult = computeSaju({
    birthDate: p.birthDate,
    calendar: p.calendar,
    isLeapMonth: p.isLeapMonth,
    birthTime: p.birthTimeUnknown ? null : p.birthTime,
  });
  const sign = zodiacOf(saju.solarDate);
  const batch = db().batch();
  const a = (t: string) => userRef(uid).collection("analyses").doc(t);
  batch.set(a("zodiac"), { sign, updatedAt: FieldValue.serverTimestamp() });
  batch.set(a("blood"), { type: p.bloodType, updatedAt: FieldValue.serverTimestamp() });
  batch.set(a("saju"), {
    pillars: saju.pillars,
    dayStem: saju.dayStem,
    elements: saju.elements,
    tenGods: saju.tenGods,
    animal: saju.animal,
    lunarDate: saju.lunarDate,
    timeKnown: !!saju.pillars.time,
    updatedAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();
  return { saju, sign };
}

// 분석이 바뀔 때마다 스탯 재계산 (Cloud Function onAnalysisWrite 대신 API에서 바로)
export async function recomputeStats(uid: string) {
  const snap = await userRef(uid).collection("analyses").get();
  const parts: Partial<Record<AnalysisType, Stats>> = {};
  for (const d of snap.docs) {
    const v = d.data();
    if (d.id === "mbti") parts.mbti = statsFromMbti(v.axes as MbtiAxes);
    if (d.id === "saju") parts.saju = statsFromSaju(v as Pick<SajuResult, "elements" | "tenGods">);
    if (d.id === "palm") parts.palm = statsFromPalm(v.features as PalmFeatures);
    if (d.id === "zodiac") parts.zodiac = statsFromZodiac(v.sign as ZodiacSign);
    if (d.id === "blood") parts.blood = statsFromBlood(v.type as BloodType);
  }
  const result = combineStats(parts);
  await userRef(uid).collection("stats").doc("current").set({ ...result, updatedAt: FieldValue.serverTimestamp() });
  await userRef(uid).set({ reportStale: true }, { merge: true });
  await syncPublicProfile(uid);
  return result;
}

// 공개 프로필: 지도 노출에 동의한 경우에만, 공개로 표시한 항목만 복사 (절대 규칙 2)
export async function syncPublicProfile(uid: string) {
  const [user, settingsSnap, stats, saju] = await Promise.all([
    userRef(uid).get(),
    userRef(uid).collection("private").doc("settings").get(),
    userRef(uid).collection("stats").doc("current").get(),
    userRef(uid).collection("analyses").doc("saju").get(),
  ]);
  const s = { ...DEFAULT_SETTINGS, ...(settingsSnap.data() as Partial<Settings> | undefined) };
  const pub = db().doc(`publicProfiles/${uid}`);
  if (!s.showOnMap || !user.exists) {
    await pub.delete().catch(() => {});
    return;
  }
  const u = user.data()!;
  await pub.set({
    uid,
    nickname: u.nickname,
    lang: s.lang,
    title: u.reportTitle ?? null,
    vector: stats.data()?.vector ?? null,
    completeness: stats.data()?.completeness ?? 0,
    dayBranch: saju.exists ? [...String(saju.data()!.pillars.day)][1] : null,
    business: s.publicFields.business ? s.business : null,
    region: s.publicFields.region ? s.region : null,
    school: s.publicFields.school ? s.school : null,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function loadUser(uid: string) {
  const [user, profile, settings, analyses, stats, streak] = await Promise.all([
    userRef(uid).get(),
    userRef(uid).collection("private").doc("profile").get(),
    userRef(uid).collection("private").doc("settings").get(),
    userRef(uid).collection("analyses").get(),
    userRef(uid).collection("stats").doc("current").get(),
    userRef(uid).collection("streak").doc("current").get(),
  ]);
  return {
    user: user.exists ? user.data()! : null,
    profile: profile.exists ? (profile.data() as Profile) : null,
    settings: { ...DEFAULT_SETTINGS, ...(settings.data() as Partial<Settings> | undefined) } as Settings,
    analyses: Object.fromEntries(analyses.docs.map((d) => [d.id, d.data()])) as Record<string, Record<string, unknown>>,
    stats: stats.exists ? stats.data()! : null,
    streak: streak.exists ? streak.data()! : { count: 0, lastDate: null },
  };
}

// 출석 스트릭: 데일리 확인 또는 일기 작성 시 +1 (같은 날은 한 번)
export async function touchStreak(uid: string, date: string) {
  const r = userRef(uid).collection("streak").doc("current");
  await db().runTransaction(async (tx) => {
    const s = await tx.get(r);
    const cur = s.exists ? (s.data() as { count: number; lastDate: string | null }) : { count: 0, lastDate: null };
    if (cur.lastDate === date) return;
    const yesterday = new Date(new Date(`${date}T00:00:00Z`).getTime() - 86400000).toISOString().slice(0, 10);
    const count = cur.lastDate === yesterday ? cur.count + 1 : 1;
    tx.set(r, { count, lastDate: date, best: Math.max(count, (s.data()?.best as number) ?? 0) });
  });
}
