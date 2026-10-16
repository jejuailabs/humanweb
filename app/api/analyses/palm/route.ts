import { after } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { aiJson, TONE_RULES } from "@/lib/server/ai";
import { HttpError, handler, json, requireUser } from "@/lib/server/http";
import { bumpAdminCounter } from "@/lib/server/metrics";
import { loadUser, recomputeStats, userRef } from "@/lib/server/profile";
import { generateReport } from "@/lib/server/report";

export const maxDuration = 120;

const MAX_BYTES = 4 * 1024 * 1024;
const featureSchema = z.object({
  isPalm: z.boolean(),
  confidence: z.number().min(0).max(100),
  headLine: z.number().min(0).max(100),
  headCurve: z.number().min(0).max(100),
  heartLine: z.number().min(0).max(100),
  fateLine: z.number().min(0).max(100),
  lifeLine: z.number().min(0).max(100),
  sunLine: z.number().min(0).max(100),
  fingerRatio: z.number().min(0).max(100),
  summary: z.string().min(10),
});

// 손금 분석: 사진은 저장하지 않고 이 요청 안에서만 AI에 보낸 뒤 버린다 ("사진은 분석 후 삭제돼요")
export const POST = handler(async (req) => {
  const { uid } = await requireUser(req);
  const form = await req.formData();
  const file = form.get("image");
  if (!(file instanceof File)) throw new HttpError(400, "no_image");
  if (file.size > MAX_BYTES) throw new HttpError(413, "image_too_large");
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new HttpError(415, "unsupported_type");

  const { settings } = await loadUser(uid);
  const lang = settings.lang;
  const dataUrl = `data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}`;

  const result = await aiJson({
    feature: "palm",
    name: "palm_features",
    schema: featureSchema,
    lang,
    retries: 1,
    system: `You read palms for fun and self-reflection (not prediction). ${TONE_RULES(lang)}`,
    user: [
      {
        type: "text",
        text: `Look at this photo. If it is not a clear open palm, set isPalm=false or a low confidence.
Rate each feature 0-100: headLine (length & clarity of head line), headCurve (how much the head line curves downward), heartLine (clarity & length), fateLine (clarity), lifeLine (clarity), sunLine (presence & clarity of sun/Apollo line), fingerRatio (index finger relatively long = high).
summary: 2-3 warm sentences in ${lang === "ko" ? "Korean" : "English"} about personality tendencies only (no health, lifespan or fate predictions).`,
      },
      { type: "image_url", image_url: { url: dataUrl } },
    ],
  });
  if (!result.isPalm || result.confidence < 40) return json({ retake: true }, 422);

  const { summary, isPalm: _p, confidence, ...features } = result;
  void _p;
  await userRef(uid).collection("analyses").doc("palm").set({ features, summary, confidence, updatedAt: FieldValue.serverTimestamp() });
  await bumpAdminCounter("analysis_palm");
  await recomputeStats(uid);
  after(() => generateReport(uid).catch((e) => console.error("report", e)));
  return json({ features, summary });
});
