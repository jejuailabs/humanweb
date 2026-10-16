import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// 첫 접속: 기기 언어(Accept-Language)가 지원 언어면 그 언어로, 아니면 en
export default createMiddleware(routing);

export const config = {
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
