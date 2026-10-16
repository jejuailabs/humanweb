// API 종단 테스트: 테스트 계정으로 주요 흐름을 실제 서버에 호출하고, 끝나면 계정과 데이터를 삭제한다
// 사용: node --env-file=.env.local scripts/e2e.mjs [baseUrl]
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { readFileSync } from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:3000";
const UID = "e2e-test-user";
const app = initializeApp({ credential: cert(JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, "utf8"))) });
const custom = await getAuth(app).createCustomToken(UID);
const ex = await (
  await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: custom, returnSecureToken: true }),
  })
).json();
if (!ex.idToken) throw new Error("token exchange failed: " + JSON.stringify(ex.error));
const H = { Authorization: `Bearer ${ex.idToken}`, "Content-Type": "application/json" };
const today = new Date().toISOString().slice(0, 10);

async function call(name, method, path, body) {
  const t0 = Date.now();
  const res = await fetch(BASE + path, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  console.log(`${res.ok ? "OK  " : "FAIL"} ${res.status} ${name} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  return { status: res.status, data };
}

try {
  // 이전 실행이 남긴 데이터 정리
  await call("cleanup(before)", "DELETE", "/api/me");
  const fresh = await getAuth(app).createCustomToken(UID);
  const ex2 = await (await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: fresh, returnSecureToken: true }) })).json();
  H.Authorization = `Bearer ${ex2.idToken}`;

  const unauth = await fetch(BASE + "/api/me");
  console.log(unauth.status === 401 ? "OK   401 no-token rejected" : `FAIL ${unauth.status} no-token`);

  await call("onboarding", "POST", "/api/onboarding", {
    nickname: "테스트별", birthDate: "1995-07-21", calendar: "solar", isLeapMonth: false,
    bloodType: "O", birthTime: null, gender: null, lang: "ko", timezone: "Asia/Seoul",
  });
  const me = await call("me", "GET", "/api/me");
  console.log("     zodiac:", me.data.analyses?.zodiac?.sign, "| saju day:", me.data.analyses?.saju?.pillars?.day, "| animal:", me.data.analyses?.saju?.animal, "| completeness:", me.data.stats?.completeness);

  const daily = await call("daily (AI generate)", "GET", `/api/daily?date=${today}&lang=ko&today=1`);
  for (const [c, it] of Object.entries(daily.data.items ?? {})) console.log(`     ${c}/${it.key}: ${it.scores.total} — ${it.summary}`);
  console.log("     sources:", JSON.stringify(daily.data.sources), "| boost:", JSON.stringify(daily.data.boost));
  const daily2 = await call("daily (cached)", "GET", `/api/daily?date=${today}&lang=ko`);
  console.log("     same score:", daily2.data.items?.zodiac?.scores.total === daily.data.items?.zodiac?.scores.total);

  await call("diary save (public)", "PUT", `/api/diary/${today}`, { text: "테스트로 남기는 한 줄", mood: "good", visibility: "public", isToday: true });
  const pub = await call("public feed", "GET", `/api/diary/public?date=${today}&lang=ko`);
  const mineId = pub.data.items?.find((x) => x.mine)?.id;
  console.log("     public copy exists:", !!mineId);
  await call("heart", "POST", "/api/diary/public/heart", { id: mineId });
  await call("diary → private", "PUT", `/api/diary/${today}`, { text: "테스트로 남기는 한 줄", mood: "good", visibility: "private" });
  const pub2 = await call("public feed after private", "GET", `/api/diary/public?date=${today}`);
  console.log("     public copy removed:", !pub2.data.items?.some((x) => x.mine));
  const tooLong = await call("diary 101 chars rejected", "PUT", `/api/diary/${today}`, { text: "가".repeat(101), mood: null, visibility: "private" });
  console.log("     rejected:", tooLong.status === 400);

  const mbti = await call("mbti test", "POST", "/api/analyses/mbti", { answers: Object.fromEntries(Array.from({ length: 20 }, (_, i) => [String(i + 1), (i % 5) + 1])) });
  console.log("     type:", mbti.data.type, "| completeness:", mbti.data.stats?.completeness);

  const report = await call("report generate", "POST", "/api/report");
  console.log("     title:", report.data.report?.title, "| strengths:", report.data.report?.strengths?.map((s) => s.stat).join(","));

  const chat = await call("chat", "POST", "/api/chat", { message: "요즘 집중이 잘 안 돼요", date: today, today: null });
  console.log("     reply:", (chat.data.reply ?? "").slice(0, 120), "| remaining:", chat.data.remaining);

  await call("settings showOnMap", "PATCH", "/api/settings", { showOnMap: true, region: "제주", publicFields: { business: false, region: true, school: false } });
  const map = await call("map", "GET", "/api/map");
  console.log("     nodes:", map.data.nodes?.length, "| optIn needed:", !!map.data.needsOptIn);

  const memory = await call("memory list", "GET", "/api/memory");
  console.log("     memories:", memory.data.items?.length);
  const admin = await call("admin (non-admin → 403)", "GET", "/api/admin/summary");
  console.log("     forbidden:", admin.status === 403);
} finally {
  await call("cleanup (delete account)", "DELETE", "/api/me");
}
