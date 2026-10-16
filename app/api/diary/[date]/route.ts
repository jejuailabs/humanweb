import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { assertDateKey } from "@/lib/server/dates";
import { syncPublicDiary } from "@/lib/server/diary";
import { handler, json, parseBody, requireUser } from "@/lib/server/http";
import { bumpAdminCounter } from "@/lib/server/metrics";
import { touchStreak, userRef } from "@/lib/server/profile";

type Ctx = { params: Promise<{ date: string }> };

const schema = z.object({
  text: z.string().trim().min(1).max(100),
  mood: z.enum(["great", "good", "calm", "low", "tired"]).nullable(),
  visibility: z.enum(["private", "public"]),
  isToday: z.boolean().default(false),
});

// 날짜당 1개. 작성·수정
export const PUT = handler<Ctx>(async (req, { params }) => {
  const { uid } = await requireUser(req);
  const date = assertDateKey((await params).date);
  const body = await parseBody(req, schema);
  const ref = userRef(uid).collection("diary").doc(date);
  const [existing, fortune] = await Promise.all([ref.get(), userRef(uid).collection("daily").doc(date).get()]);
  await ref.set(
    {
      date,
      text: body.text,
      mood: body.mood,
      visibility: body.visibility,
      fortuneSnapshot: existing.data()?.fortuneSnapshot ?? (fortune.exists ? { total: fortune.data()!.total, summary: fortune.data()!.summary } : null),
      updatedAt: FieldValue.serverTimestamp(),
      ...(existing.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
    },
    { merge: true },
  );
  await syncPublicDiary(uid, date);
  if (body.isToday) await touchStreak(uid, date);
  if (!existing.exists) await bumpAdminCounter(body.visibility === "public" ? "diary_public" : "diary_private");
  return json({ ok: true });
});

// 삭제: 공개 사본도 즉시 삭제
export const DELETE = handler<Ctx>(async (req, { params }) => {
  const { uid } = await requireUser(req);
  const date = assertDateKey((await params).date);
  await userRef(uid).collection("diary").doc(date).delete();
  await syncPublicDiary(uid, date);
  return json({ ok: true });
});
