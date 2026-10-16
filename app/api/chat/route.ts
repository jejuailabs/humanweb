import { after } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { aiJson, aiText, GLOSSARY, TONE_RULES } from "@/lib/server/ai";
import { db } from "@/lib/server/firebase-admin";
import { HttpError, handler, json, parseBody, requireUser } from "@/lib/server/http";
import { userRef } from "@/lib/server/profile";
import { profileSummary } from "@/lib/server/report";

export const maxDuration = 120;

const CHAT_ID = "main";
const DAILY_LIMIT = Number(process.env.CHAT_DAILY_LIMIT ?? 20); // 05 문서 초기값 20회 [자체 설계]
const HISTORY_TURNS = 20;
const MEMORY_EVERY = 6; // 사용자 메시지 6개마다 기억 요약

const messages = (uid: string) => userRef(uid).collection("chats").doc(CHAT_ID).collection("messages");
const usageRef = (uid: string, date: string) => userRef(uid).collection("chatUsage").doc(date);

export const GET = handler(async (req) => {
  const { uid } = await requireUser(req);
  const date = new URL(req.url).searchParams.get("date") ?? "";
  const [snap, usage] = await Promise.all([
    messages(uid).orderBy("createdAt", "desc").limit(50).get(),
    date ? usageRef(uid, date).get() : null,
  ]);
  return json({
    messages: snap.docs.reverse().map((d) => ({ id: d.id, role: d.data().role, text: d.data().text })),
    remaining: Math.max(0, DAILY_LIMIT - ((usage?.data()?.count as number) ?? 0)),
  });
});

export const POST = handler(async (req) => {
  const { uid } = await requireUser(req);
  const { message, date, today } = await parseBody(
    req,
    z.object({
      message: z.string().trim().min(1).max(500),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      today: z.object({ total: z.number(), summary: z.string() }).nullable().optional(),
    }),
  );

  // 일일 한도
  const usage = usageRef(uid, date);
  const count = await db().runTransaction(async (tx) => {
    const n = ((await tx.get(usage)).data()?.count as number) ?? 0;
    if (n >= DAILY_LIMIT) throw new HttpError(429, "daily_limit");
    tx.set(usage, { count: n + 1 }, { merge: true });
    return n + 1;
  });

  const { u, summary } = await profileSummary(uid);
  const lang = u.settings.lang;
  const [history, memory, report, diary] = await Promise.all([
    messages(uid).orderBy("createdAt", "desc").limit(HISTORY_TURNS).get(),
    userRef(uid).collection("memory").orderBy("createdAt", "desc").limit(15).get(),
    userRef(uid).collection("reports").orderBy("version", "desc").limit(1).get(),
    u.settings.diaryForAI ? userRef(uid).collection("diary").orderBy("date", "desc").limit(7).get() : null,
  ]);

  // 절대 규칙 9·10: 요약값만, 일기는 허용한 경우에만
  const context = {
    profile: summary,
    report: report.empty ? null : (({ title, identity, strengths, growth }) => ({ title, identity, strengths, growth }))(report.docs[0].data()),
    today: today ?? null,
    memory: memory.docs.map((d) => d.data().text),
    diary: diary ? diary.docs.map((d) => `${d.data().date}: ${d.data().text}`) : null,
  };
  const system = `You are "YEON, who knows you" — a warm counselor friend. Reply in ${lang === "ko" ? "Korean" : "English"}, concise (2-5 sentences).
${TONE_RULES(lang)}
- Ground advice in the profile below, but suggest ("how about...") rather than declare.
- Do not make big decisions (quitting, breakups, investments) for the user; help them think.
- If you notice signs of self-harm or crisis: respond with empathy and gently recommend reaching out to a professional or a local crisis line.
- Mention lightly when relevant that readings are for fun and self-reflection.
Glossary: ${GLOSSARY}
[User context JSON]
${JSON.stringify(context)}`;

  const past = history.docs.reverse().map((d) => ({ role: d.data().role as "user" | "assistant", content: String(d.data().text) }));
  const out = await aiText({ system, lang, messages: [...past, { role: "user", content: message }] });
  const reply = out.forbidden
    ? lang === "ko"
      ? "그 이야기는 조심스럽게 다루고 싶어요. 지금 마음이 어떤지 조금 더 들려줄 수 있을까요?"
      : "I'd like to handle that gently. Could you tell me a little more about how you're feeling right now?"
    : out.text;

  const batch = db().batch();
  batch.set(messages(uid).doc(), { role: "user", text: message, createdAt: FieldValue.serverTimestamp() });
  batch.set(messages(uid).doc(), { role: "assistant", text: reply, createdAt: new Date(Date.now() + 1) });
  await batch.commit();

  if (count % MEMORY_EVERY === 0) after(() => extractMemory(uid, lang).catch((e) => console.error("memory", e)));
  return json({ reply, remaining: DAILY_LIMIT - count });
});

// 대화에서 기억할 만한 사실 1~3개 → memory/{id}
async function extractMemory(uid: string, lang: string) {
  const recent = await messages(uid).orderBy("createdAt", "desc").limit(12).get();
  const transcript = recent.docs.reverse().map((d) => `${d.data().role}: ${d.data().text}`).join("\n");
  const r = await aiJson({
    feature: "memory",
    name: "memory",
    lang,
    retries: 1,
    schema: z.object({ facts: z.array(z.object({ text: z.string().min(3).max(120), importance: z.number().min(1).max(5) })).max(3) }),
    system: `Extract up to 3 durable facts worth remembering about the user (interests, ongoing worries, goals). Write each in ${lang === "ko" ? "Korean" : "English"}, one short sentence. Never store birth dates, real names, contact info or health details.`,
    user: transcript,
  });
  const batch = db().batch();
  for (const f of r.facts) batch.set(userRef(uid).collection("memory").doc(), { ...f, createdAt: FieldValue.serverTimestamp() });
  await batch.commit();
}
