import { FieldValue } from "firebase-admin/firestore";
import type { Lang } from "@/lib/fortune/keys";
import { dailyStatBoost, type Category } from "@/lib/fortune/scores";
import { dayPillar, koreanGanzhi, type Stem } from "@/lib/saju";
import { getDaily } from "@/lib/server/daily";
import { assertDateKey } from "@/lib/server/dates";
import { HttpError, handler, json, requireUser } from "@/lib/server/http";
import { loadUser, touchStreak, userRef } from "@/lib/server/profile";

export const maxDuration = 120;

// 오늘(또는 지난 날짜)의 내 운세 묶음. 공용 운세는 저장된 것을 읽고, 없으면 그때 한 번 생성한다
export const GET = handler(async (req) => {
  const { uid } = await requireUser(req);
  const url = new URL(req.url);
  const date = assertDateKey(url.searchParams.get("date"));
  const lang: Lang = url.searchParams.get("lang") === "en" ? "en" : "ko";
  const isToday = url.searchParams.get("today") === "1";

  const u = await loadUser(uid);
  if (!u.profile) throw new HttpError(409, "not_onboarded");

  const mine: Partial<Record<Category, string>> = {
    daymaster: u.analyses.saju?.dayStem as string,
    zodiac: u.analyses.zodiac?.sign as string,
    animal: u.analyses.saju?.animal as string,
    blood: u.analyses.blood?.type as string,
    mbti: u.analyses.mbti?.type as string | undefined,
  };
  const cats = (Object.entries(mine).filter(([, k]) => k) as [Category, string][]);
  const docs = await Promise.all(cats.map(([c]) => getDaily(date, lang, c)));
  const items = Object.fromEntries(cats.map(([c, k], i) => [c, { key: k, ...docs[i].items[k] }]));

  const pillar = dayPillar(date);
  const boost = mine.daymaster ? dailyStatBoost(date, mine.daymaster as Stem, pillar) : [];
  const personal = items.daymaster;

  // 개인 운세 스냅샷 (일기의 fortuneSnapshot과 지난 날짜 기록용)
  if (personal) {
    await userRef(uid).collection("daily").doc(date).set(
      { date, total: personal.scores.total, summary: personal.summary, lang, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
  }
  if (isToday) await touchStreak(uid, date);

  return json({
    date,
    pillar: { ganzhi: pillar.ganzhi, ko: koreanGanzhi(pillar.ganzhi), lunar: pillar.lunar, year: pillar.yearGanzhi },
    items,
    boost,
    sources: Object.fromEntries(cats.map(([c], i) => [c, docs[i].source])),
  });
});
