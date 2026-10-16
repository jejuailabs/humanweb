"use client";

import useSWR, { type SWRConfiguration } from "swr";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { useAuth } from "./auth";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}

// 로그인 토큰을 붙여 서버 API 호출
export async function api<T = unknown>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const user = getFirebaseAuth().currentUser;
  const token = user ? await user.getIdToken() : null;
  const headers = new Headers(init?.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  let body = init?.body;
  if (init?.json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(init.json);
  }
  const res = await fetch(path, { ...init, headers, body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, (data as { error?: string }).error ?? "error");
  return data as T;
}

// 로그인했을 때만 불러오는 SWR 훅
export function useApi<T>(path: string | null, config?: SWRConfiguration<T>) {
  const { user } = useAuth();
  return useSWR<T>(user && path ? [path, user.uid] : null, ([p]: [string]) => api<T>(p), {
    revalidateOnFocus: false,
    ...config,
  });
}

// 기기 현지 날짜 키 (07_I18N_THEME.md "오늘" = 기기 현지 날짜)
export function localDateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
export function shiftDate(key: string, days: number) {
  const [y, m, d] = key.split("-").map(Number);
  return localDateKey(new Date(y, m - 1, d + days));
}
