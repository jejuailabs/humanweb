import { after } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { BLOOD_TYPES } from "@/lib/saju/zodiac";
import { HttpError, handler, json, parseBody, requireUser } from "@/lib/server/http";
import { DEFAULT_SETTINGS, recomputeStats, userRef, writeBaseAnalyses, type Profile } from "@/lib/server/profile";
import { db } from "@/lib/server/firebase-admin";
import { bumpAdminCounter } from "@/lib/server/metrics";
import { generateReport } from "@/lib/server/report";

const schema = z.object({
  nickname: z.string().trim().min(1).max(20),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  calendar: z.enum(["solar", "lunar"]),
  isLeapMonth: z.boolean().default(false),
  bloodType: z.enum(BLOOD_TYPES),
  birthTime: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  gender: z.enum(["female", "male", "other"]).nullable(),
  lang: z.enum(["ko", "en"]),
  timezone: z.string().max(64).default("Asia/Seoul"),
});

// 최초 가입 정보 저장. 생년월일 변경 정책은 [미정] — 가입 후에는 이 API로 다시 바꿀 수 없다
export const POST = handler(async (req) => {
  const { uid } = await requireUser(req);
  const body = await parseBody(req, schema);
  const year = Number(body.birthDate.slice(0, 4));
  if (year < 1900 || year > new Date().getFullYear()) throw new HttpError(400, "invalid_birth_year");

  const profileRef = userRef(uid).collection("private").doc("profile");
  if ((await profileRef.get()).exists) throw new HttpError(409, "already_onboarded");

  const profile: Profile = {
    birthDate: body.birthDate,
    calendar: body.calendar,
    isLeapMonth: body.calendar === "lunar" && body.isLeapMonth,
    birthTime: body.birthTime,
    birthTimeUnknown: body.birthTime === null,
    gender: body.gender,
    bloodType: body.bloodType,
    birthTimezone: body.timezone,
    birthDateChangeCount: 0,
  };
  const batch = db().batch();
  batch.set(userRef(uid), { nickname: body.nickname, createdAt: FieldValue.serverTimestamp() }, { merge: true });
  batch.set(profileRef, profile);
  batch.set(userRef(uid).collection("private").doc("settings"), { ...DEFAULT_SETTINGS, lang: body.lang }, { merge: true });
  await batch.commit();
  await writeBaseAnalyses(uid, profile);
  await recomputeStats(uid);
  await bumpAdminCounter("signup");
  if (profile.birthTime) await bumpAdminCounter("signup_time_known");
  after(() => generateReport(uid).catch((e) => console.error("report", e)));
  return json({ ok: true });
});
