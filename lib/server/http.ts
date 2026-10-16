import "server-only";
import type { DecodedIdToken } from "firebase-admin/auth";
import { unstable_rethrow } from "next/navigation";
import { ZodError, type ZodType } from "zod";
import { adminAuth } from "./firebase-admin";

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

// 로그인 사용자 확인: Authorization: Bearer <Firebase ID token>
export async function requireUser(req: Request): Promise<DecodedIdToken> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw new HttpError(401, "unauthenticated");
  try {
    return await adminAuth().verifyIdToken(token);
  } catch {
    throw new HttpError(401, "invalid_token");
  }
}

export async function requireAdmin(req: Request) {
  const user = await requireUser(req);
  if (user.admin !== true) throw new HttpError(403, "forbidden");
  return user;
}

export async function parseBody<T>(req: Request, schema: ZodType<T>): Promise<T> {
  try {
    return schema.parse(await req.json());
  } catch (e) {
    if (e instanceof ZodError) throw new HttpError(400, "invalid_body");
    throw new HttpError(400, "invalid_json");
  }
}

// 라우트 핸들러 감싸기: 오류를 JSON으로
export function handler<C = unknown>(fn: (req: Request, ctx: C) => Promise<Response>) {
  return async (req: Request, ctx: C) => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      unstable_rethrow(e); // Next 내부 신호(동적 렌더링 전환 등)는 그대로 통과
      if (e instanceof HttpError) return json({ error: e.code }, e.status);
      console.error(e);
      return json({ error: "internal" }, 500);
    }
  };
}
