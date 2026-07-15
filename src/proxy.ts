import NextAuth from "next-auth";

import { authConfig } from "@/auth.config";

/**
 * Next.js 16 renamed `middleware` → `proxy`. We build a lightweight Auth.js
 * instance from the DB-free base config purely to evaluate the `authorized`
 * callback (route protection) on each matched request.
 */
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  // Run on everything except static assets and image optimization.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)"],
};
