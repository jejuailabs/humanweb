import { z } from "zod";
import { handler, json, parseBody, requireUser } from "@/lib/server/http";
import { syncPublicProfile, userRef } from "@/lib/server/profile";

const schema = z.object({
  nickname: z.string().trim().min(1).max(20).optional(),
  lang: z.enum(["ko", "en"]).optional(),
  diaryDefaultPublic: z.boolean().optional(),
  diaryForAI: z.boolean().optional(),
  showOnMap: z.boolean().optional(),
  business: z.string().trim().max(40).optional(),
  region: z.string().trim().max(40).optional(),
  school: z.string().trim().max(40).optional(),
  publicFields: z.object({ business: z.boolean(), region: z.boolean(), school: z.boolean() }).optional(),
});

export const PATCH = handler(async (req) => {
  const { uid } = await requireUser(req);
  const { nickname, ...settings } = await parseBody(req, schema);
  if (nickname) await userRef(uid).set({ nickname }, { merge: true });
  if (Object.keys(settings).length) await userRef(uid).collection("private").doc("settings").set(settings, { merge: true });
  await syncPublicProfile(uid);
  return json({ ok: true });
});
