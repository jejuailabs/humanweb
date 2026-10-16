import "server-only";
import { db } from "./firebase-admin";
import { userRef } from "./profile";

// onDiaryWrite 대신: 원본이 public이면 공개 사본 생성·갱신, 아니면 즉시 삭제 (03_DATA_MODEL.md)
// 공개 사본에는 생년월일·운세 점수 같은 다른 정보를 넣지 않는다
export async function syncPublicDiary(uid: string, date: string) {
  const id = `${uid}_${date}`;
  const pub = db().doc(`publicDiary/${id}`);
  const [entry, user, settings] = await Promise.all([
    userRef(uid).collection("diary").doc(date).get(),
    userRef(uid).get(),
    userRef(uid).collection("private").doc("settings").get(),
  ]);
  if (!entry.exists || entry.data()!.visibility !== "public") {
    await db().recursiveDelete(pub);
    return;
  }
  const e = entry.data()!;
  const existing = await pub.get();
  await pub.set(
    {
      uid,
      nickname: user.data()?.nickname ?? "",
      date,
      text: e.text,
      mood: e.mood ?? null,
      lang: settings.data()?.lang ?? "ko",
      heartCount: existing.exists ? existing.data()!.heartCount ?? 0 : 0,
      reportCount: existing.exists ? existing.data()!.reportCount ?? 0 : 0,
      hidden: existing.exists ? existing.data()!.hidden ?? false : false,
      updatedAt: new Date(),
    },
    { merge: true },
  );
}
