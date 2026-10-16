import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { db } from "@/lib/server/firebase-admin";
import { HttpError, handler, json, parseBody, requireUser } from "@/lib/server/http";

const HIDE_AT = 3; // 신고 누적 시 자동 숨김 [자체 설계]

// 공개 일기 신고
export const POST = handler(async (req) => {
  const { uid } = await requireUser(req);
  const { id, reason } = await parseBody(
    req,
    z.object({ id: z.string().min(3).max(200), reason: z.enum(["spam", "abuse", "privacy", "other"]) }),
  );
  const pub = db().doc(`publicDiary/${id}`);
  const report = db().doc(`reports_moderation/${id}_${uid}`);
  await db().runTransaction(async (tx) => {
    const [p, r] = await Promise.all([tx.get(pub), tx.get(report)]);
    if (!p.exists) throw new HttpError(404, "not_found");
    if (r.exists) return;
    const count = (p.data()!.reportCount ?? 0) + 1;
    tx.set(report, { targetId: id, reporter: uid, reason, status: "open", text: p.data()!.text, createdAt: FieldValue.serverTimestamp() });
    tx.update(pub, { reportCount: count, ...(count >= HIDE_AT ? { hidden: true } : {}) });
  });
  return json({ ok: true });
});
