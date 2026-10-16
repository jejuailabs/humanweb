import "server-only";
import { HttpError } from "./http";

// 날짜 키 YYYY-MM-DD (사용자 현지 날짜). 서버는 범위만 확인한다: 400일 전 ~ 내일(+시차 여유)
export function assertDateKey(v: string | null | undefined): string {
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new HttpError(400, "invalid_date");
  const t = Date.parse(`${v}T00:00:00Z`);
  const now = Date.now();
  if (Number.isNaN(t) || t > now + 2 * 86400000 || t < now - 400 * 86400000) throw new HttpError(400, "date_out_of_range");
  return v;
}

export function utcToday() {
  return new Date().toISOString().slice(0, 10);
}

// 기간 조회용: 형식만 확인하고, 미래 끝 날짜는 오늘+2일로 줄인다 (달력의 월말 등)
export function clampRangeEnd(v: string | null | undefined): string {
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new HttpError(400, "invalid_date");
  const max = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
  return v > max ? max : v;
}
