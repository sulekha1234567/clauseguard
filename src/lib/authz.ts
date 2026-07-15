import { auth } from "@/auth";
import { assertCanAccess, type SessionUser } from "@/lib/access";
import { UnauthorizedError } from "@/lib/errors";

export { assertCanAccess };
export type { SessionUser };

/**
 * Returns the current user or throws UnauthorizedError. Use in every server
 * action / route handler that requires authentication.
 */
export async function requireUser(): Promise<SessionUser> {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) throw new UnauthorizedError();
  return {
    id: user.id,
    name: user.name ?? "",
    email: user.email ?? "",
    role: user.role,
  };
}
