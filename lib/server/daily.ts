import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { backupText } from "@/lib/fortune/backup";
import { CATEGORY_KEYS, type Lang } from "@/lib/fortune/keys";
import { luckyFor, scoresFor, type Category, type Lucky, type Scores } from "@/lib/fortune/scores";
import { dayPillar, koreanGanzhi } from "@/lib/saju";
import { aiJson, GLOSSARY, TONE_RULES } from "./ai";
import { db } from "./firebase-admin";

// 04_DAILY_ENGINE.md: 계산은 코드, 문장은 AI, 검사는 코드, 사용자는 저장된 것만 읽는다
export type DailyItem = { summary: string; detail: string; scores: Scores; lucky: Lucky };
export type DailyDoc = { items: Record<string, DailyItem>; source: "ai" | "backup"; generatedAt: unknown };

const itemSchema = z.object({
  key: z.string(),
  summary: z.string().min(5),
  detail: z.string().min(10),
});
const outSchema = z.object({ items: z.array(itemSchema) });

const LIMITS = { ko: { summary: 60, detail: 200 }, en: { summary: 120, detail: 400 } };

const ref = (date: string, lang: string, category: Category) => db().doc(`daily/${date}/${lang}/${category}`);

async function recentSummaries(date: string, lang: string, category: Category) {
  const out: string[] = [];
  const d = new Date(`${date}T00:00:00Z`);
  for (let i = 1; i <= 3; i++) {
    const prev = new Date(d.getTime() - i * 86400000).toISOString().slice(0, 10);
    const snap = await ref(prev, lang, category).get();
    if (snap.exists) out.push(...Object.values((snap.data() as DailyDoc).items).slice(0, 4).map((it) => it.summary));
  }
  return out;
}

async function generate(date: string, lang: Lang, category: Category): Promise<DailyDoc> {
  const pillar = dayPillar(date);
  const keys = CATEGORY_KEYS[category];
  const base = Object.fromEntries(
    keys.map((k) => [k, { scores: scoresFor(date, category, k, pillar), lucky: luckyFor(date, category, k) }]),
  );
  const weekday = new Date(`${date}T00:00:00Z`).toLocaleDateString(lang === "ko" ? "ko-KR" : "en-US", { weekday: "long", timeZone: "UTC" });
  const limit = LIMITS[lang];

  let source: DailyDoc["source"] = "ai";
  let texts: Record<string, { summary: string; detail: string }> = {};
  try {
    const recent = await recentSummaries(date, lang, category);
    const result = await aiJson({
      feature: "daily",
      name: "daily_fortune",
      schema: outSchema,
      lang,
      system: `You are YEON's warm, positive fortune writer. Write in ${lang === "ko" ? "Korean" : "English"}.\n${TONE_RULES(lang)}\nGlossary (use these terms): ${GLOSSARY}`,
      user: `Write today's fortune for every target below.
[Ingredients]
Date: ${date} (${weekday}), daily pillar: ${pillar.ganzhi} (${koreanGanzhi(pillar.ganzhi)}), category: ${category}
Targets: ${JSON.stringify(keys.map((k) => ({ key: k, scoreBand: band(base[k].scores.total), love: band(base[k].scores.love), money: band(base[k].scores.money), work: band(base[k].scores.work) })))}
[Rules]
- summary: 1 sentence (max ${limit.summary} chars), detail: 2-3 sentences (max ${limit.detail} chars), advice tone
- Do NOT mention or change any score; scores are shown separately. Use scoreBand only to set the mood.
- Avoid repeating these recent lines: ${JSON.stringify(recent)}
- Return every key exactly once.`,
    });
    for (const it of result.items) {
      if (!keys.includes(it.key)) continue;
      if (it.summary.length > limit.summary * 1.2 || it.detail.length > limit.detail * 1.2) continue;
      texts[it.key] = { summary: it.summary, detail: it.detail };
    }
    if (keys.some((k) => !texts[k])) throw new Error("missing keys");
  } catch (e) {
    console.warn("daily ai failed → backup", date, lang, category, e);
    source = "backup";
    texts = Object.fromEntries(keys.map((k) => [k, backupText(lang, `${date}|${category}|${k}`, base[k].scores.total)]));
  }

  const items = Object.fromEntries(keys.map((k) => [k, { ...texts[k], ...base[k] }]));
  const doc: DailyDoc = { items, source, generatedAt: FieldValue.serverTimestamp() };
  await ref(date, lang, category).set(doc);
  await db()
    .doc(`dailyMeta/${date}`)
    .set(
      { date, ganzhi: pillar.ganzhi, lunar: pillar.lunar, status: { [`${lang}_${category}`]: source === "ai" ? "ok" : "backup" } },
      { merge: true },
    );
  return doc;
}

function band(n: number) {
  return n >= 80 ? "very good" : n >= 68 ? "good" : n >= 55 ? "steady" : "gentle";
}

// 저장된 문서를 읽고, 없으면 한 번만 생성 (동시 요청은 잠금 문서로 막는다)
export async function getDaily(date: string, lang: Lang, category: Category): Promise<DailyDoc> {
  const snap = await ref(date, lang, category).get();
  if (snap.exists) return snap.data() as DailyDoc;
  const lock = db().doc(`dailyLocks/${date}_${lang}_${category}`);
  try {
    await lock.create({ at: FieldValue.serverTimestamp() });
  } catch {
    // 다른 요청이 생성 중 — 최대 40초 기다린다
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const s = await ref(date, lang, category).get();
      if (s.exists) return s.data() as DailyDoc;
    }
    // 잠금이 남아 있는 비정상 상황 → 직접 생성
  }
  try {
    return await generate(date, lang, category);
  } finally {
    await lock.delete().catch(() => {});
  }
}

export async function regenerateDaily(date: string, lang: Lang, category: Category) {
  await ref(date, lang, category).delete();
  return getDaily(date, lang, category);
}
