import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "./firebase-admin";

// 어드민 집계 카운터: stats_admin/{date} (08_ADMIN.md). 실패해도 본 기능은 막지 않는다
export async function bumpAdminCounter(field: string, by = 1) {
  try {
    const date = new Date().toISOString().slice(0, 10);
    await db().doc(`stats_admin/${date}`).set({ [field]: FieldValue.increment(by) }, { merge: true });
  } catch (e) {
    console.warn("metrics", field, e);
  }
}
