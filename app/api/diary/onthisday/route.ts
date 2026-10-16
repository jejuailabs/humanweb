import { assertDateKey } from "@/lib/server/dates";
import { handler, json, requireUser } from "@/lib/server/http";
import { userRef } from "@/lib/server/profile";

// "N년 전 오늘" (01_FEATURES.md C, P2): 최근 5년의 같은 날짜 일기
export const GET = handler(async (req) => {
  const { uid } = await requireUser(req);
  const date = assertDateKey(new URL(req.url).searchParams.get("date"));
  const [y, md] = [Number(date.slice(0, 4)), date.slice(5)];
  const snaps = await Promise.all(
    [1, 2, 3, 4, 5].map((n) => userRef(uid).collection("diary").doc(`${y - n}-${md}`).get()),
  );
  return json({
    items: snaps
      .map((s, i) => (s.exists ? { years: i + 1, date: s.id, text: s.data()!.text, mood: s.data()!.mood ?? null } : null))
      .filter(Boolean),
  });
});
