import { assertDateKey, clampRangeEnd } from "@/lib/server/dates";
import { handler, json, requireUser } from "@/lib/server/http";
import { userRef } from "@/lib/server/profile";

// 내 일기 목록 (기간). 비공개 원본은 본인만
export const GET = handler(async (req) => {
  const { uid } = await requireUser(req);
  const url = new URL(req.url);
  const from = assertDateKey(url.searchParams.get("from"));
  const to = clampRangeEnd(url.searchParams.get("to"));
  const snap = await userRef(uid)
    .collection("diary")
    .where("date", ">=", from)
    .where("date", "<=", to)
    .orderBy("date", "desc")
    .get();
  const daily = await userRef(uid).collection("daily").where("date", ">=", from).where("date", "<=", to).get();
  return json({
    entries: snap.docs.map((d) => {
      const v = d.data();
      return { date: v.date, text: v.text, mood: v.mood ?? null, visibility: v.visibility, fortuneSnapshot: v.fortuneSnapshot ?? null };
    }),
    fortunes: Object.fromEntries(daily.docs.map((d) => [d.id, { total: d.data().total, summary: d.data().summary }])),
  });
});
