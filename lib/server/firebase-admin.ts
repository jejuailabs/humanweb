import "server-only";
import { applicationDefault, cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// 서버 전용 관리자 SDK.
// - Vercel: FIREBASE_SERVICE_ACCOUNT_BASE64 (서비스 계정 JSON을 base64로)
// - 로컬: GOOGLE_APPLICATION_CREDENTIALS (키 파일 경로, 저장소 밖)
function credential() {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64) return cert(JSON.parse(Buffer.from(b64, "base64").toString("utf8")));
  return applicationDefault();
}

function app(): App {
  return (
    getApps()[0] ??
    initializeApp({
      credential: credential(),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    })
  );
}

export const adminAuth = () => getAuth(app());

let dbInstance: ReturnType<typeof getFirestore> | null = null;
export function db() {
  if (!dbInstance) {
    dbInstance = getFirestore(app());
    dbInstance.settings({ ignoreUndefinedProperties: true });
  }
  return dbInstance;
}
