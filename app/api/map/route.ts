import { branchRelation, type Branch } from "@/lib/saju";
import { db } from "@/lib/server/firebase-admin";
import { handler, json, requireUser } from "@/lib/server/http";

// 09_MATCHING.md 연결 점수 [자체 설계]
// 사주 궁합 계산식은 [미정] → 가중치에서 빼고 재정규화. 빨간 선의 "사주 합 관계"는 일지 육합으로 본다 [자체 설계]
const W = { stat: 0.4, business: 0.15, region: 0.1, school: 0.1 };
const MAX_RED = 3;
const MAX_NODES = 50;

type Pub = {
  uid: string;
  nickname: string;
  title: string | null;
  vector: number[] | null;
  dayBranch: Branch | null;
  business: string | null;
  region: string | null;
  school: string | null;
};

// 성향 벡터를 0.5 기준으로 가운데 맞춘 코사인 → 0~100 (모두 양수라 생기는 쏠림 방지)
function statSimilarity(a: number[], b: number[]) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i] - 0.5, y = b[i] - 0.5;
    dot += x * y; na += x * x; nb += y * y;
  }
  const cos = na && nb ? dot / Math.sqrt(na * nb) : 0;
  return ((cos + 1) / 2) * 100;
}

const same = (a: string | null, b: string | null) => !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

export const GET = handler(async (req) => {
  const { uid } = await requireUser(req);
  const filter = new URL(req.url).searchParams.get("filter") ?? "all";
  const meSnap = await db().doc(`publicProfiles/${uid}`).get();
  if (!meSnap.exists) return json({ needsOptIn: true, nodes: [] });
  const me = meSnap.data() as Pub;
  if (!me.vector) return json({ needsAnalysis: true, nodes: [] });

  const snap = await db().collection("publicProfiles").limit(500).get();
  const scored = snap.docs
    .map((d) => d.data() as Pub)
    .filter((p) => p.uid !== uid && p.vector)
    .filter((p) => (filter === "business" ? same(me.business, p.business) : filter === "region" ? same(me.region, p.region) : filter === "school" ? same(me.school, p.school) : true))
    .map((p) => {
      // 둘 다 공개한 항목만 점수에 넣는다
      const parts: [number, number][] = [[W.stat, statSimilarity(me.vector!, p.vector!)]];
      if (me.business && p.business) parts.push([W.business, same(me.business, p.business) ? 100 : 0]);
      if (me.region && p.region) parts.push([W.region, same(me.region, p.region) ? 100 : 0]);
      if (me.school && p.school) parts.push([W.school, same(me.school, p.school) ? 100 : 0]);
      const score = Math.round(parts.reduce((s, [w, v]) => s + w * v, 0) / parts.reduce((s, [w]) => s + w, 0));
      const harmony = !!me.dayBranch && !!p.dayBranch && branchRelation(me.dayBranch, p.dayBranch) === "harmony";
      return {
        uid: p.uid,
        nickname: p.nickname,
        title: p.title,
        score,
        harmony,
        reasons: {
          business: same(me.business, p.business) ? p.business : null,
          region: same(me.region, p.region) ? p.region : null,
          school: same(me.school, p.school) ? p.school : null,
        },
      };
    })
    .filter((p) => p.score >= 50)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_NODES);

  let red = 0;
  const nodes = scored.map((p) => {
    let line: "faint" | "strong" | "fate" = p.score >= 70 ? "strong" : "faint";
    if (p.score >= 90 && p.harmony && red < MAX_RED) {
      line = "fate";
      red++;
    }
    return { ...p, line };
  });
  return json({ nodes, me: { nickname: me.nickname, title: me.title } });
});
