import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { backupText } from "@/lib/fortune/backup";
import { aiJson, GLOSSARY, TONE_RULES } from "@/lib/server/ai";
import { db } from "@/lib/server/firebase-admin";
import { HttpError, handler, json, requireUser } from "@/lib/server/http";
import { bumpAdminCounter } from "@/lib/server/metrics";
import { loadUser } from "@/lib/server/profile";
import { computeTojeong, currentLunar, monthlyScores } from "@/lib/tojeong";

export const maxDuration = 120;

const textSchema = z.object({
  title: z.string().min(2).max(40),
  overview: z.string().min(30),
  months: z.array(z.string().min(5)).min(12).max(14),
});

const ref = (uid: string, year: number) => db().doc(`tojeong/${uid}_${year}`);
const strip = (d: FirebaseFirestore.DocumentData | undefined) => (d ? { ...d, createdAt: undefined } : null);

// 올해(음력) 토정비결 조회. 없으면 null
export const GET = handler(async (req) => {
  const { uid } = await requireUser(req);
  const { year, month } = currentLunar();
  const snap = await ref(uid, year).get();
  return json({ year, month, tojeong: strip(snap.data()) });
});

// 올해 토정비결 생성: 괘·월별 점수는 코드, 문장만 AI (절대 규칙 1·3). 연 1회, 언어가 바뀌면 다시 쓴다
export const POST = handler(async (req) => {
  const { uid } = await requireUser(req);
  const { year, month } = currentLunar();
  const u = await loadUser(uid);
  const lunar = u.analyses.saju?.lunarDate as { year: number; month: number; day: number } | undefined;
  if (!lunar) throw new HttpError(409, "onboarding_required");
  const lang = u.settings.lang;
  const existing = await ref(uid, year).get();
  if (existing.exists && existing.data()!.lang === lang) return json({ year, month, tojeong: strip(existing.data()) });

  const gua = computeTojeong(lunar, year);
  const scores = monthlyScores(gua);
  let text: z.infer<typeof textSchema>;
  let source: "ai" | "backup" = "ai";
  try {
    text = await aiJson({
      feature: "tojeong",
      name: "tojeong_year",
      schema: textSchema,
      lang,
      system: `You write a yearly Tojeong Bigyeol (토정비결) reading for fun and self-reflection, not prediction. Write in ${lang === "ko" ? "Korean" : "English"}.\n${TONE_RULES(lang)}\nGlossary: ${GLOSSARY}`,
      user: `Hexagram computed by code: upper ${gua.upper}/8, middle ${gua.middle}/6, lower ${gua.lower}/3 (code ${gua.code}), year ${gua.yearGanzhi}.
Monthly flow scores (lunar months 1-12, 40-95, fixed by code): ${JSON.stringify(scores)}.
Write: title (short phrase for the year), overview (3-4 sentences for the whole year), months (exactly 12 items, one or two sentences each, matching each month's score: high = active, mid = steady, low = rest and care, never fearful).
Do not quote classical verses verbatim.`,
    });
  } catch (e) {
    // 절대 규칙 5: 끝내 실패하면 예비 문장 풀
    console.error("tojeong", e);
    source = "backup";
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / 12);
    const all = backupText(lang, `tojeong|${uid}|${year}`, avg);
    text = {
      title: all.summary,
      overview: all.detail,
      months: scores.map((s, i) => backupText(lang, `tojeong|${uid}|${year}|${i}`, s).summary),
    };
  }
  const doc = { uid, ...gua, scores, ...text, months: text.months.slice(0, 12), lang, source };
  await ref(uid, year).set({ ...doc, createdAt: FieldValue.serverTimestamp() });
  if (!existing.exists) await bumpAdminCounter("analysis_tojeong");
  return json({ year, month, tojeong: doc });
});
