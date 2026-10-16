"use client";

import { GoogleAuthProvider, onIdTokenChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getFirebaseAuth } from "@/lib/firebase/client";

type AuthState = { user: User | null; ready: boolean };
const AuthContext = createContext<AuthState>({ user: null, ready: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, ready: false });
  useEffect(() => onIdTokenChanged(getFirebaseAuth(), (user) => setState({ user, ready: true })), []);
  // 개발 모드 전용: 테스트 계정 로그인 (scripts/e2e). 프로덕션 번들에는 포함되지 않는다
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    (window as unknown as Record<string, unknown>).__yeonTestSignIn = async (token: string) => {
      const { signInWithCustomToken } = await import("firebase/auth");
      await signInWithCustomToken(getFirebaseAuth(), token);
    };
  }, []);
  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export async function signInWithGoogle() {
  await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
}

export async function logout() {
  await signOut(getFirebaseAuth());
}
