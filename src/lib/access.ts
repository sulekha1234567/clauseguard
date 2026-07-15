import { ForbiddenError } from "@/lib/errors";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
};

/**
 * Central ownership check (pure, dependency-free so it is trivially testable).
 * A resource is accessible if the caller owns it or is an admin. Every
 * read/update/delete funnels through this to prevent IDOR.
 */
export function assertCanAccess(
  resourceOwnerId: string,
  user: SessionUser,
): void {
  if (user.role === "admin") return;
  if (resourceOwnerId === user.id) return;
  throw new ForbiddenError();
}
