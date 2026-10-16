import { HttpError, handler, json, requireUser } from "@/lib/server/http";
import { userRef } from "@/lib/server/profile";
import { generateReport } from "@/lib/server/report";

export const maxDuration = 120;

// 보고서 버전 목록 (최신순)
export const GET = handler(async (req) => {
  const { uid } = await requireUser(req);
  const snap = await userRef(uid).collection("reports").orderBy("version", "desc").limit(20).get();
  return json({ reports: snap.docs.map((d) => d.data()) });
});

// 지금 다시 만들기 (분석이 바뀐 뒤 자동 생성이 실패했을 때 등)
export const POST = handler(async (req) => {
  const { uid } = await requireUser(req);
  const report = await generateReport(uid);
  if (!report) throw new HttpError(409, "no_stats");
  return json({ report });
});
