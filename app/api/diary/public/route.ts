import { assertDateKey } from "@/lib/server/dates";
import { db } from "@/lib/server/firebase-admin";
import { handler, json, requireUser } from "@/lib/server/http";

// 공개 일기 둘러보기: 날짜별, 기본은 내 언어만 (07_I18N_THEME.md)
export const GET = handler(async (req) => {
  const { uid } = await requireUser(req);
  const url = new URL(req.url);
  const date = assertDateKey(url.searchParams.get("date"));
  const lang = url.searchParams.get("lang");
  const snap = await db().collection("publicDiary").where("date", "==", date).limit(200).get();
  const docs = snap.docs.filter((d) => !d.data().hidden && (!lang || d.data().lang === lang));
  const hearted = await Promise.all(docs.map((d) => d.ref.collection("hearts").doc(uid).get()));
  return json({
    items: docs
      .map((d, i) => ({
        id: d.id,
        nickname: d.data().nickname,
        text: d.data().text,
        mood: d.data().mood,
        heartCount: d.data().heartCount ?? 0,
        hearted: hearted[i].exists,
        mine: d.data().uid === uid,
      }))
      .sort((a, b) => b.heartCount - a.heartCount),
  });
});
