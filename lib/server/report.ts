import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { STAT_KEYS } from "@/lib/stats";
import { aiJson, GLOSSARY, TONE_RULES } from "./ai";
import { loadUser, syncPublicProfile, userRef } from "./profile";

const reportSchema = z.object({
  title: z.string().min(2).max(60),
  identity: z.string().min(20),
  strengths: z.array(z.object({ stat: z.enum(STAT_KEYS), text: z.string().min(5) })).length(3),
  growth: z.array(z.string().min(5)).length(2),
  workStyle: z.string().min(10),
  relationStyle: z.string().min(10),
  goodMatch: z.string().min(5),
  crossInsights: z.array(z.string().min(10)).min(1).max(8), // 모델이 넘치게 쓰는 경우가 있어 받고 4개로 자른다
});

// 절대 규칙 9: AI에는 요약값만 — 생년월일 원본·실명·사진 제외
export async function profileSummary(uid: string) {
  const u = await loadUser(uid);
  const a = u.analyses;
  return {
    u,
    summary: {
      nickname: u.user?.nickname,
      stats: u.stats?.stats,
      completeness: u.stats?.completeness,
      mbti: a.mbti ? { type: a.mbti.type, axes: a.mbti.axes } : null,
      saju: a.saju ? { dayStem: a.saju.dayStem, elements: a.saju.elements, tenGods: a.saju.tenGods, timeKnown: a.saju.timeKnown } : null,
      zodiac: a.zodiac?.sign ?? null,
      animal: a.saju?.animal ?? null,
      blood: a.blood?.type ?? null,
      palm: a.palm ? { summary: a.palm.summary } : null,
    },
  };
}

// AI 종합 보고서 생성 → reports/{version}. 실패해도 이전 버전은 그대로 둔다
export async function generateReport(uid: string) {
  const { u, summary } = await profileSummary(uid);
  if (!u.stats) return null;
  const lang = u.settings.lang;
  const report = await aiJson({
    feature: "report",
    name: "personality_report",
    schema: reportSchema,
    lang,
    system: `You are YEON, a warm counselor who integrates MBTI, Saju (Four Pillars), zodiac, blood type and palm reading into one portrait. Write in ${lang === "ko" ? "Korean" : "English"}.\n${TONE_RULES(lang)}\nGlossary: ${GLOSSARY}\nThis is for fun and self-reflection, not a prediction or diagnosis.`,
    user: `Profile summary (JSON): ${JSON.stringify(summary)}
Write the report:
- title: one-line title in ${lang === "ko" ? "Korean (e.g. \"마음을 읽는 직관적 전략가\")" : "English (e.g. \"The Intuitive Strategist\")"}
- Write EVERY field in ${lang === "ko" ? "Korean" : "English"}.
- identity: 3-4 sentences on the core identity
- strengths: the top 3 stats (use stat keys) each with the reason
- growth: 2 growth points phrased as "you shine even more when..." (not weaknesses)
- workStyle, relationStyle (friends, colleagues, partners), goodMatch (types that fit well)
- crossInsights: where the systems agree or differ, e.g. "MBTI says introvert but Saju has strong Fire..." Only compare analyses that exist.`,
  });
  const prev = await userRef(uid).collection("reports").orderBy("version", "desc").limit(1).get();
  const version = prev.empty ? 1 : (prev.docs[0].data().version as number) + 1;
  await userRef(uid)
    .collection("reports")
    .doc(String(version).padStart(4, "0"))
    .set({ ...report, crossInsights: report.crossInsights.slice(0, 4), version, lang, completeness: u.stats.completeness, createdAt: FieldValue.serverTimestamp() });
  await userRef(uid).set({ reportStale: false, reportTitle: report.title }, { merge: true });
  await syncPublicProfile(uid);
  return report;
}
