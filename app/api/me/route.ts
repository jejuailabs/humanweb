import { db } from "@/lib/server/firebase-admin";
import { adminAuth } from "@/lib/server/firebase-admin";
import { handler, json, requireUser } from "@/lib/server/http";
import { loadUser, userRef } from "@/lib/server/profile";

// 내 정보 한 번에: 프로필 요약, 설정, 분석, 스탯, 스트릭
export const GET = handler(async (req) => {
  const { uid } = await requireUser(req);
  const u = await loadUser(uid);
  const latestReport = await userRef(uid).collection("reports").orderBy("version", "desc").limit(1).get();
  return json({
    onboarded: !!u.profile,
    nickname: u.user?.nickname ?? null,
    reportStale: u.user?.reportStale ?? false,
    profile: u.profile && {
      birthDate: u.profile.birthDate,
      calendar: u.profile.calendar,
      isLeapMonth: u.profile.isLeapMonth,
      birthTime: u.profile.birthTime,
      birthTimeUnknown: u.profile.birthTimeUnknown,
      gender: u.profile.gender,
      bloodType: u.profile.bloodType,
    },
    settings: u.settings,
    analyses: u.analyses,
    stats: u.stats,
    streak: u.streak,
    report: latestReport.empty ? null : latestReport.docs[0].data(),
  });
});

// 계정 탈퇴: 내 데이터 전부 삭제 + 공개 사본 삭제 + 로그인 계정 삭제
export const DELETE = handler(async (req) => {
  const { uid } = await requireUser(req);
  const pub = await db().collection("publicDiary").where("uid", "==", uid).get();
  await Promise.all(pub.docs.map((d) => db().recursiveDelete(d.ref)));
  await db().doc(`publicProfiles/${uid}`).delete().catch(() => {});
  const tojeong = await db().collection("tojeong").where("uid", "==", uid).get();
  await Promise.all(tojeong.docs.map((d) => d.ref.delete()));
  await db().recursiveDelete(userRef(uid));
  await adminAuth().deleteUser(uid);
  return json({ ok: true });
});
