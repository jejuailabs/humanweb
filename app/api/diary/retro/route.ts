import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { aiJson, TONE_RULES } from "@/lib/server/ai";
import { HttpError, handler, json, parseBody, requireUser } from "@/lib/server/http";
import { loadUser, userRef } from "@/lib/server/profile";

export const maxDuration = 120;

const MIN_ENTRIES = 3;
const schema = z.object({
  title: z.string().min(2).max(60),
  summary: z.string().min(20),
  highlights: z.array(z.string().min(5)).min(1).max(4),
});

const monthSchema = z.string().regex(/^\d{4}-\d{2}$/);

// 월간 회고 (P2): 한 달 일기 + 그날 운세를 AI가 요약. 절대 규칙 10 — 일기 AI 사용을 허용한 경우에만
export const GET = handler(async (req) => {
  const { uid } = await requireUser(req);
  const month = monthSchema.parse(new URL(req.url).searchParams.get("month"));
  const snap = await userRef(uid).collection("retro").doc(month).get();
  return json({ retro: snap.exists ? snap.data() : null });
});

export const POST = handler(async (req) => {
  const { uid } = await requireUser(req);
  const { month } = await parseBody(req, z.object({ month: monthSchema }));
  const { settings } = await loadUser(uid);
  if (!settings.diaryForAI) throw new HttpError(403, "diary_ai_not_allowed");

  const from = `${month}-01`, to = `${month}-31`;
  const [diary, daily] = await Promise.all([
    userRef(uid).collection("diary").where("date", ">=", from).where("date", "<=", to).orderBy("date").get(),
    userRef(uid).collection("daily").where("date", ">=", from).where("date", "<=", to).get(),
  ]);
  if (diary.size < MIN_ENTRIES) throw new HttpError(409, "not_enough_entries");
  const fortune = Object.fromEntries(daily.docs.map((d) => [d.id, d.data().total]));
  const lines = diary.docs.map((d) => ({ date: d.id, text: d.data().text, mood: d.data().mood ?? null, fortune: fortune[d.id] ?? null }));
  const lang = settings.lang;

  const retro = await aiJson({
    feature: "report",
    name: "monthly_retro",
    schema,
    lang,
    system: `You are YEON, writing a warm monthly look-back from the user's one-line diary. Write in ${lang === "ko" ? "Korean" : "English"}.\n${TONE_RULES(lang)}`,
    user: `Month: ${month}\nEntries (date, text, mood, that day's fortune score 0-100): ${JSON.stringify(lines)}
- title: a short poetic title for the month
- summary: 3-4 sentences on the month's flow, gently noting how moods and fortunes moved together (no predictions)
- highlights: 2-3 memorable moments, quoting or paraphrasing entries`,
  });
  const doc = { ...retro, month, lang, entries: diary.size, createdAt: FieldValue.serverTimestamp() };
  await userRef(uid).collection("retro").doc(month).set(doc);
  return json({ retro: doc });
});
