import type { NextAuthConfig } from "next-auth";

/**
 * Base auth config shared between the lightweight proxy (route protection) and
 * the full Node-runtime auth instance. It deliberately contains NO database or
 * bcrypt access so it stays cheap to evaluate on every request.
 */
export const authConfig = {
  // Trust the deployment host (required for self-hosted / non-Vercel runtimes;
  // Vercel sets this automatically).
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
  providers: [], // real providers are attached in auth.ts (Node runtime)
  callbacks: {
    /**
     * Gatekeeper used by the proxy. Returning false on a protected route sends
     * the user to the sign-in page; returning a redirect bounces authenticated
     * users away from the auth pages.
     */
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      // Pages are guarded here (redirect to login). API routes are intentionally
      // NOT guarded by the proxy — their handlers call requireUser() and return
      // a proper 401 JSON response instead of an HTML redirect.
      const isProtected = pathname.startsWith("/dashboard");
      const isAuthPage = pathname === "/login" || pathname === "/register";

      if (isProtected) return isLoggedIn;

      if (isAuthPage && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
