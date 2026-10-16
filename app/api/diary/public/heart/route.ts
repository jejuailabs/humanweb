import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { db } from "@/lib/server/firebase-admin";
import { HttpError, handler, json, parseBody, requireUser } from "@/lib/server/http";

// 공감(하트) 토글
export const POST = handler(async (req) => {
  const { uid } = await requireUser(req);
  const { id } = await parseBody(req, z.object({ id: z.string().min(3).max(200) }));
  const pub = db().doc(`publicDiary/${id}`);
  const heart = pub.collection("hearts").doc(uid);
  const hearted = await db().runTransaction(async (tx) => {
    const [p, h] = await Promise.all([tx.get(pub), tx.get(heart)]);
    if (!p.exists || p.data()!.hidden) throw new HttpError(404, "not_found");
    if (h.exists) {
      tx.delete(heart);
      tx.update(pub, { heartCount: FieldValue.increment(-1) });
      return false;
    }
    tx.set(heart, { at: FieldValue.serverTimestamp() });
    tx.update(pub, { heartCount: FieldValue.increment(1) });
    return true;
  });
  return json({ hearted });
});
