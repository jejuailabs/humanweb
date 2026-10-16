// 어드민 권한 부여: node --env-file=.env.local scripts/grant-admin.mjs <email>
// (08_ADMIN.md: admin 클레임은 서버 스크립트로만 부여)
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { readFileSync } from "node:fs";
const email = process.argv[2];
if (!email) throw new Error("usage: grant-admin.mjs <email>");
const app = initializeApp({ credential: cert(JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, "utf8"))) });
const user = await getAuth(app).getUserByEmail(email);
await getAuth(app).setCustomUserClaims(user.uid, { ...(user.customClaims ?? {}), admin: true });
console.log("admin granted:", user.uid);
