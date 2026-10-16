import { z } from "zod";
import { db } from "@/lib/server/firebase-admin";
import { handler, json, parseBody, requireUser } from "@/lib/server/http";
import { userRef } from "@/lib/server/profile";

// AI 기억 보기 · 개별 삭제 · 전체 삭제 (대화 기능과 동시 출시 필수)
export const GET = handler(async (req) => {
  const { uid } = await requireUser(req);
  const snap = await userRef(uid).collection("memory").orderBy("createdAt", "desc").get();
  return json({ items: snap.docs.map((d) => ({ id: d.id, text: d.data().text })) });
});

export const DELETE = handler(async (req) => {
  const { uid } = await requireUser(req);
  const { id } = await parseBody(req, z.object({ id: z.string().min(1).max(100).optional() }));
  if (id) await userRef(uid).collection("memory").doc(id).delete();
  else await db().recursiveDelete(userRef(uid).collection("memory"));
  return json({ ok: true });
});
