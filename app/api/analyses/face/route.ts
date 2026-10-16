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
  isFace: z.boolean(),
  confidence: z.number().min(0).max(100),
  forehead: z.number().min(0).max(100),
  brows: z.number().min(0).max(100),
  eyes: z.number().min(0).max(100),
  nose: z.number().min(0).max(100),
  mouth: z.number().min(0).max(100),
  jaw: z.number().min(0).max(100),
  summary: z.string().min(10),
});

// 관상: 손금과 같은 방식. 동의한 요청만 처리하고, 사진은 저장하지 않고 이 요청 안에서만 AI에 보낸 뒤 버린다.
// 나이·성별·인종·건강·외모 평가는 하지 않는다 (민감정보 최소화)
export const POST = handler(async (req) => {
  const { uid } = await requireUser(req);
  const form = await req.formData();
  if (form.get("consent") !== "1") throw new HttpError(403, "consent_required");
  const file = form.get("image");
  if (!(file instanceof File)) throw new HttpError(400, "no_image");
  if (file.size > MAX_BYTES) throw new HttpError(413, "image_too_large");
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new HttpError(415, "unsupported_type");

  const { settings } = await loadUser(uid);
  const lang = settings.lang;
  const dataUrl = `data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}`;

  const result = await aiJson({
    feature: "face",
    name: "face_features",
    schema: featureSchema,
    lang,
    retries: 1,
    system: `You read faces in the East Asian physiognomy (관상) tradition for fun and self-reflection only (not prediction). ${TONE_RULES(lang)}
Never estimate or mention age, gender, ethnicity, health, attractiveness or identity. Describe only the impression of personality tendencies.`,
    user: [
      {
        type: "text",
        text: `Look at this photo. If it is not one clear front-facing human face, set isFace=false or a low confidence.
Rate each impression 0-100: forehead (broad & open forehead), brows (defined, strong brows), eyes (soft, warm gaze), nose (straight, defined nose bridge), mouth (upturned mouth corners, friendly), jaw (defined jawline & chin).
summary: 2-3 warm sentences in ${lang === "ko" ? "Korean" : "English"} about personality tendencies only.`,
      },
      { type: "image_url", image_url: { url: dataUrl } },
    ],
  });
  if (!result.isFace || result.confidence < 40) return json({ retake: true }, 422);

  const { summary, isFace: _f, confidence, ...features } = result;
  void _f;
  await userRef(uid).collection("analyses").doc("face").set({ features, summary, confidence, updatedAt: FieldValue.serverTimestamp() });
  await bumpAdminCounter("analysis_face");
  await recomputeStats(uid);
  after(() => generateReport(uid).catch((e) => console.error("report", e)));
  return json({ features, summary });
});
