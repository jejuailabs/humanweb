import { db } from "@/lib/server/firebase-admin";
import { handler, json, requireAdmin } from "@/lib/server/http";

// 어드민 대시보드 (08_ADMIN.md). 비공개 일기·대화 원문은 보지 않고 집계 수치만
export const GET = handler(async (req) => {
  await requireAdmin(req);
  const today = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
  const days = Array.from({ length: 7 }, (_, i) => new Date(Date.now() - i * 86400000).toISOString().slice(0, 10));
  const tomorrow = new Date(Date.now() + 9 * 3600000 + 86400000).toISOString().slice(0, 10);
  const [users, publicDiary, metrics, metaToday, metaTomorrow, reports] = await Promise.all([
    db().collection("users").count().get(),
    db().collection("publicDiary").count().get(),
    Promise.all(days.map((d) => db().doc(`stats_admin/${d}`).get())),
    db().doc(`dailyMeta/${today}`).get(),
    db().doc(`dailyMeta/${tomorrow}`).get(),
    db().collection("reports_moderation").where("status", "==", "open").limit(50).get(),
  ]);
  return json({
    totals: { users: users.data().count, publicDiary: publicDiary.data().count },
    metrics: days.map((d, i) => ({ date: d, ...(metrics[i].data() ?? {}) })),
    content: { [today]: metaToday.data()?.status ?? {}, [tomorrow]: metaTomorrow.data()?.status ?? {} },
    reports: reports.docs.map((d) => ({ id: d.id, ...d.data(), createdAt: undefined })),
  });
});
