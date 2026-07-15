import type { DefaultSession } from "next-auth";

/** Augment Auth.js types so `role` and `id` are available on the session/JWT. */
declare module "next-auth" {
  interface User {
    role: "user" | "admin";
  }

  interface Session {
    user: {
      id: string;
      role: "user" | "admin";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "user" | "admin";
  }
}
