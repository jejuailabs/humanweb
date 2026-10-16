import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { LANGS } from "@/lib/fortune/keys";
import { CATEGORIES } from "@/lib/fortune/scores";
import { regenerateDaily } from "@/lib/server/daily";
import { db } from "@/lib/server/firebase-admin";
import { handler, json, parseBody, requireAdmin } from "@/lib/server/http";

export const maxDuration = 120;

// 데일리 콘텐츠 재생성 / 공개 일기 숨김·복구 (어드민 운영 도구)
export const POST = handler(async (req) => {
  const admin = await requireAdmin(req);
  const body = await parseBody(
    req,
    z.union([
      z.object({ action: z.literal("daily"), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), lang: z.enum(LANGS), category: z.enum(CATEGORIES) }),
      z.object({ action: z.enum(["hide", "restore"]), id: z.string().min(3) }),
    ]),
  );
  if (body.action === "daily") {
    const doc = await regenerateDaily(body.date, body.lang, body.category);
    await db().collection("adminLogs").add({ admin: admin.uid, action: "regenerate", target: `${body.date}/${body.lang}/${body.category}`, at: FieldValue.serverTimestamp() });
    return json({ source: doc.source });
  }
  await db().doc(`publicDiary/${body.id}`).update({ hidden: body.action === "hide" });
  const reports = await db().collection("reports_moderation").where("targetId", "==", body.id).get();
  await Promise.all(reports.docs.map((d) => d.ref.update({ status: "resolved" })));
  await db().collection("adminLogs").add({ admin: admin.uid, action: body.action, target: body.id, at: FieldValue.serverTimestamp() });
  return json({ ok: true });
});
