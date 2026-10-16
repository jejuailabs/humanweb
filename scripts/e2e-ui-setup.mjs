// 화면 테스트용 테스트 계정 준비: 가입·분석·일기까지 만든 뒤 로그인용 커스텀 토큰을 파일로 저장
// 사용: node --env-file=.env.local scripts/e2e-ui-setup.mjs <tokenOutFile> [baseUrl]
//       정리: node --env-file=.env.local scripts/e2e-ui-setup.mjs --cleanup
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { readFileSync, writeFileSync } from "node:fs";

const UID = "e2e-ui-user";
const BASE = process.argv[3] ?? "http://localhost:3000";
const app = initializeApp({ credential: cert(JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, "utf8"))) });
const custom = await getAuth(app).createCustomToken(UID);
const ex = await (
  await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: custom, returnSecureToken: true }),
  })
).json();
const H = { Authorization: `Bearer ${ex.idToken}`, "Content-Type": "application/json" };
const call = (m, p, b) => fetch(BASE + p, { method: m, headers: H, body: b ? JSON.stringify(b) : undefined }).then((r) => r.status);

if (process.argv[2] === "--cleanup") {
  console.log("delete", await call("DELETE", "/api/me"));
  process.exit(0);
}
const today = new Date().toISOString().slice(0, 10);
console.log("onboarding", await call("POST", "/api/onboarding", { nickname: "루나", birthDate: "1992-03-14", calendar: "solar", isLeapMonth: false, bloodType: "B", birthTime: "14:30", gender: "female", lang: "ko", timezone: "Asia/Seoul" }));
console.log("mbti", await call("POST", "/api/analyses/mbti", { type: "INFJ" }));
console.log("diary", await call("PUT", `/api/diary/${today}`, { text: "오랜만에 바다를 보러 갔다.", mood: "calm", visibility: "private", isToday: true }));
console.log("report", await call("POST", "/api/report"));
writeFileSync(process.argv[2], await getAuth(app).createCustomToken(UID));
console.log("token saved");
