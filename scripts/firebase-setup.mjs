// Firebase 설정 배포: Firestore 보안 규칙 + Google 로그인 허용 도메인 추가
// 사용: node --env-file=.env.local scripts/firebase-setup.mjs [rules] [domains]
import { cert, initializeApp } from "firebase-admin/app";
import { readFileSync } from "node:fs";

const sa = JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, "utf8"));
const app = initializeApp({ credential: cert(sa) });
const token = (await app.options.credential.getAccessToken()).access_token;
const H = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
const P = sa.project_id;
const args = new Set(process.argv.slice(2));

if (args.has("rules")) {
  const content = readFileSync("firestore.rules", "utf8");
  const rs = await (
    await fetch(`https://firebaserules.googleapis.com/v1/projects/${P}/rulesets`, {
      method: "POST",
      headers: H,
      body: JSON.stringify({ source: { files: [{ name: "firestore.rules", content }] } }),
    })
  ).json();
  if (!rs.name) throw new Error("ruleset failed: " + JSON.stringify(rs.error ?? rs));
  const rel = await fetch(`https://firebaserules.googleapis.com/v1/projects/${P}/releases/cloud.firestore`, {
    method: "PATCH",
    headers: H,
    body: JSON.stringify({ release: { name: `projects/${P}/releases/cloud.firestore`, rulesetName: rs.name } }),
  });
  console.log("rules released:", rel.status, rs.name.split("/").pop());
}

if (args.has("domains")) {
  const want = ["humanweb-sigma.vercel.app", "humanweb-jejuai.vercel.app", "humanweb-git-main-jejuai.vercel.app"];
  const base = `https://identitytoolkit.googleapis.com/admin/v2/projects/${P}/config`;
  const cfg = await (await fetch(base, { headers: H })).json();
  const domains = Array.from(new Set([...(cfg.authorizedDomains ?? []), ...want]));
  const r = await fetch(`${base}?updateMask=authorizedDomains`, {
    method: "PATCH",
    headers: H,
    body: JSON.stringify({ authorizedDomains: domains }),
  });
  console.log("authorized domains:", r.status, domains.join(", "));
}
