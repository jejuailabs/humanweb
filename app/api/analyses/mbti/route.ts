import { after } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { MBTI_TYPES } from "@/lib/saju/zodiac";
import { mbtiAxesFromType, mbtiTypeFromAxes } from "@/lib/stats";
import { scoreAnswers } from "@/lib/mbti/questions";
import { handler, json, parseBody, requireUser } from "@/lib/server/http";
import { bumpAdminCounter } from "@/lib/server/metrics";
import { recomputeStats, userRef } from "@/lib/server/profile";
import { generateReport } from "@/lib/server/report";

const schema = z.union([
  z.object({ type: z.enum(MBTI_TYPES) }),
  z.object({ answers: z.record(z.string(), z.number().int().min(1).max(5)) }),
]);

// 성향 검사 결과 또는 유형 직접 입력
export const POST = handler(async (req) => {
  const { uid } = await requireUser(req);
  const body = await parseBody(req, schema);
  const axes =
    "type" in body
      ? mbtiAxesFromType(body.type)
      : scoreAnswers(Object.fromEntries(Object.entries(body.answers).map(([k, v]) => [Number(k), v])));
  const type = mbtiTypeFromAxes(axes);
  await userRef(uid)
    .collection("analyses")
    .doc("mbti")
    .set({ type, axes, source: "type" in body ? "input" : "test", updatedAt: FieldValue.serverTimestamp() });
  await bumpAdminCounter("analysis_mbti");
  const stats = await recomputeStats(uid);
  after(() => generateReport(uid).catch((e) => console.error("report", e)));
  return json({ type, axes, stats });
});
